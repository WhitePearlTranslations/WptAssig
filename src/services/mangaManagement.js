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
      status: mangaData.status || 'active'
    };

    await set(newMangaRef, mangaProfile);

    return {
      success: true,
      manga: mangaProfile,
      message: 'Manga creado exitosamente'
    };
  } catch (error) {
    console.error('Error creando manga:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtener todos los mangas
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
      snapshot.forEach((childSnapshot) => {
        mangas.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

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
    console.error('Error obteniendo mangas:', error);
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
    console.error('Error obteniendo manga:', error);
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
    console.error('Error actualizando manga:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Eliminar un manga (marca como eliminado en lugar de eliminar físicamente)
export const deleteManga = async (mangaId) => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const mangaRef = ref(realtimeDb, `mangas/${mangaId}`);
    await update(mangaRef, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
      deletedBy: auth.currentUser.uid
    });

    return {
      success: true,
      message: 'Manga eliminado exitosamente'
    };
  } catch (error) {
    console.error('Error eliminando manga:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Actualizar el progreso de capítulos publicados
export const updateMangaProgress = async (mangaId, publishedChapters) => {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const mangaRef = ref(realtimeDb, `mangas/${mangaId}`);
    await update(mangaRef, {
      publishedChapters: publishedChapters,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.uid
    });

    return {
      success: true,
      message: 'Progreso actualizado exitosamente'
    };
  } catch (error) {
    console.error('Error actualizando progreso:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

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
    console.error('Error cambiando estado:', error);
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
    console.error('Error buscando mangas:', error);
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
    console.error('Error obteniendo estadísticas:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
