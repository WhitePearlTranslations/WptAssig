import { ref, set, update, remove, get, push, query, orderByChild } from 'firebase/database';
import { auth, realtimeDb } from './firebase';

// Crear un nuevo manga
export const createManga = async (mangaData) => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Generar un ID único para el manga
    const mangasRef = ref(realtimeDb, 'mangas');
    const newMangaRef = push(mangasRef);

    const mangaProfile = {
      ...mangaData,
      id: newMangaRef.key,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: auth.currentUser.uid,
      updatedAt: new Date().toISOString(),
      publishedChapters: 0, // Inicialmente 0 capítulos publicados
      status: mangaData.status || 'active',
      isJoint: mangaData.isJoint || false, // Indica si es un proyecto conjunto
      availableTasks: mangaData.availableTasks || ['traduccion', 'proofreading', 'cleanRedrawer', 'type'], // Tareas disponibles
      jointPartner: mangaData.jointPartner || '' // Nombre del scan colaborador
    };

    await set(newMangaRef, mangaProfile);

    return {
      success: true,
      manga: mangaProfile,
      message: 'Manga creado exitosamente'
    };
  } catch (error) {
    //  message removed for production
    return {
      success: false,
      error: error.message
    };
  }
};

// Contar capítulos de un manga desde la base de datos
const countMangaChapters = async (mangaId) => {
  try {
    // Contar capítulos independientes
    const chaptersRef = ref(realtimeDb, `mangas/${mangaId}/chapters`);
    const chaptersSnapshot = await get(chaptersRef);
    const independentChaptersCount = chaptersSnapshot.exists() ? Object.keys(chaptersSnapshot.val()).length : 0;
    
    // Contar capítulos únicos desde asignaciones
    const assignmentsRef = ref(realtimeDb, 'assignments');
    const assignmentsSnapshot = await get(assignmentsRef);
    const assignmentChapters = new Set();
    
    if (assignmentsSnapshot.exists()) {
      assignmentsSnapshot.forEach((childSnapshot) => {
        const assignment = childSnapshot.val();
        if (assignment.mangaId === mangaId && assignment.chapter) {
          assignmentChapters.add(assignment.chapter);
        }
      });
    }
    
    // Combinar capítulos únicos de ambas fuentes
    const allChapters = new Set();
    
    // Agregar capítulos independientes
    if (chaptersSnapshot.exists()) {
      Object.keys(chaptersSnapshot.val()).forEach(chapterNumber => {
        allChapters.add(chapterNumber);
      });
    }
    
    // Agregar capítulos de asignaciones
    assignmentChapters.forEach(chapter => {
      allChapters.add(chapter);
    });
    
    return allChapters.size;
  } catch (error) {
    //  message removed for production
    return 0;
  }
};

// Actualizar automáticamente el conteo de capítulos de un manga
export const updateMangaChapterCount = async (mangaId) => {
  try {
    const chapterCount = await countMangaChapters(mangaId);
    const mangaRef = ref(realtimeDb, `mangas/${mangaId}`);
    await update(mangaRef, {
      publishedChapters: chapterCount,
      updatedAt: new Date().toISOString()
    });
    return chapterCount;
  } catch (error) {
    //  message removed for production
    throw error;
  }
};

// Obtener todos los mangas con conteo automático de capítulos
export const getAllMangas = async () => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const mangasRef = ref(realtimeDb, 'mangas');
    const snapshot = await get(mangasRef);

    if (snapshot.exists()) {
      const mangas = [];
      
      // Procesar cada manga y actualizar su conteo de capítulos
      for (const childSnapshot of snapshot.val() ? Object.entries(snapshot.val()) : []) {
        const [mangaId, mangaData] = childSnapshot;
        
        // Contar capítulos automáticamente
        const chapterCount = await countMangaChapters(mangaId);
        
        // Actualizar el conteo en la base de datos si es diferente
        if (mangaData.publishedChapters !== chapterCount) {
          const mangaRef = ref(realtimeDb, `mangas/${mangaId}`);
          await update(mangaRef, {
            publishedChapters: chapterCount,
            updatedAt: new Date().toISOString()
          });
        }
        
        mangas.push({
          id: mangaId,
          ...mangaData,
          publishedChapters: chapterCount // Asegurar que se use el conteo actualizado
        });
      }

      // Ordenar por fecha de creación (más recientes primero)
      mangas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        success: true,
        mangas: mangas
      };
    } else {
      return {
        success: true,
        mangas: []
      };
    }
  } catch (error) {
    //  message removed for production
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtener un manga específico por ID
export const getMangaById = async (mangaId) => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const mangaRef = ref(realtimeDb, `mangas/${mangaId}`);
    const snapshot = await get(mangaRef);

    if (snapshot.exists()) {
      return {
        success: true,
        manga: {
          id: snapshot.key,
          ...snapshot.val()
        }
      };
    } else {
      return {
        success: false,
        error: 'Manga no encontrado'
      };
    }
  } catch (error) {
    //  message removed for production
    return {
      success: false,
      error: error.message
    };
  }
};

// Actualizar un manga existente
export const updateManga = async (mangaId, updateData) => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const mangaRef = ref(realtimeDb, `mangas/${mangaId}`);
    const updates = {
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.uid
    };

    await update(mangaRef, updates);

    return {
      success: true,
      message: 'Manga actualizado exitosamente'
    };
  } catch (error) {
    //  message removed for production
    return {
      success: false,
      error: error.message
    };
  }
};

// Eliminar un manga completamente junto con todas sus asignaciones y capítulos
export const deleteManga = async (mangaId) => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    //  message removed for production
    
    // 1. Eliminar todas las asignaciones relacionadas con este manga
    const assignmentsRef = ref(realtimeDb, 'assignments');
    const assignmentsSnapshot = await get(assignmentsRef);
    const deletedAssignments = [];
    
    if (assignmentsSnapshot.exists()) {
      const assignmentsData = assignmentsSnapshot.val();
      const deletePromises = [];
      
      Object.entries(assignmentsData).forEach(([assignmentId, assignment]) => {
        if (assignment.mangaId === mangaId) {
          deletedAssignments.push({
            id: assignmentId,
            chapter: assignment.chapter,
            type: assignment.type,
            status: assignment.status
          });
          const assignmentRef = ref(realtimeDb, `assignments/${assignmentId}`);
          deletePromises.push(remove(assignmentRef));
        }
      });
      
      await Promise.all(deletePromises);
      //  message removed for production
    }
    
    // 2. Eliminar todos los capítulos independientes del manga
    const chaptersRef = ref(realtimeDb, `chapters/${mangaId}`);
    const chaptersSnapshot = await get(chaptersRef);
    let deletedChapters = 0;
    
    if (chaptersSnapshot.exists()) {
      await remove(chaptersRef);
      deletedChapters = Object.keys(chaptersSnapshot.val()).length;
      //  message removed for production
    }
    
    // 3. Finalmente, eliminar el manga completamente
    const mangaRef = ref(realtimeDb, `mangas/${mangaId}`);
    await remove(mangaRef);
    //  message removed for production

    return {
      success: true,
      message: `Manga eliminado exitosamente junto con ${deletedAssignments.length} asignaciones y ${deletedChapters} capítulos`,
      details: {
        deletedAssignments: deletedAssignments.length,
        deletedChapters,
        assignmentsList: deletedAssignments
      }
    };
  } catch (error) {
    //  message removed for production
    return {
      success: false,
      error: error.message
    };
  }
};

// NOTA: La función updateMangaProgress ya no es necesaria
// El conteo de capítulos ahora se actualiza automáticamente
// cuando se crean, editan o eliminan capítulos o asignaciones

// Cambiar estado del manga (activo, pausado, completado, etc.)
export const changeMangaStatus = async (mangaId, newStatus) => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const validStatuses = ['active', 'paused', 'completed', 'cancelled', 'hiatus'];
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        error: 'Estado no válido'
      };
    }

    const mangaRef = ref(realtimeDb, `mangas/${mangaId}`);
    await update(mangaRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.uid
    });

    return {
      success: true,
      message: `Estado cambiado a ${newStatus} exitosamente`
    };
  } catch (error) {
    //  message removed for production
    return {
      success: false,
      error: error.message
    };
  }
};

// Búsqueda de mangas por título
export const searchMangas = async (searchTerm) => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const mangasRef = ref(realtimeDb, 'mangas');
    const snapshot = await get(mangasRef);

    if (snapshot.exists()) {
      const mangas = [];
      snapshot.forEach((childSnapshot) => {
        const manga = {
          id: childSnapshot.key,
          ...childSnapshot.val()
        };
        
        // Filtrar por término de búsqueda
        if (manga.title && manga.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          mangas.push(manga);
        }
      });

      return {
        success: true,
        mangas: mangas
      };
    } else {
      return {
        success: true,
        mangas: []
      };
    }
  } catch (error) {
    //  message removed for production
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtener estadísticas de mangas
export const getMangaStats = async () => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const mangasRef = ref(realtimeDb, 'mangas');
    const snapshot = await get(mangasRef);

    const stats = {
      total: 0,
      active: 0,
      completed: 0,
      paused: 0,
      cancelled: 0,
      totalChapters: 0,
      publishedChapters: 0
    };

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const manga = childSnapshot.val();
        if (manga.status !== 'deleted') {
          stats.total++;
          stats[manga.status] = (stats[manga.status] || 0) + 1;
          stats.totalChapters += manga.totalChapters || 0;
          stats.publishedChapters += manga.publishedChapters || 0;
        }
      });
    }

    return {
      success: true,
      stats: stats
    };
  } catch (error) {
    //  message removed for production
    return {
      success: false,
      error: error.message
    };
  }
};
