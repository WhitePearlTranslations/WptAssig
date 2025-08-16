import { 
  ref, 
  push, 
  set, 
  get, 
  update, 
  remove, 
  onValue,
  off,
  serverTimestamp,
  child
} from 'firebase/database';
import { getRealtimeDb } from './firebase';

// Funciones auxiliares para codificar/decodificar números de capítulos decimales
// Firebase no permite puntos (.) en las rutas, así que los reemplazamos
const encodeChapterNumber = (chapterNumber) => {
  return String(chapterNumber).replace(/\./g, '_DOT_');
};

const decodeChapterNumber = (encodedChapterNumber) => {
  return String(encodedChapterNumber).replace(/_DOT_/g, '.');
};

export const realtimeService = {
  // USUARIOS
  createUser: async (userData) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const userRef = ref(realtimeDb, `users/${userData.uid}`);
      await set(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return userData.uid;
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  updateUser: async (userId, updateData) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const userRef = ref(realtimeDb, `users/${userId}`);
      await update(userRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const userRef = ref(realtimeDb, `users/${userId}`);
      await remove(userRef);
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const realtimeDb = await getRealtimeDb();
      const usersRef = ref(realtimeDb, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const users = [];
        snapshot.forEach((childSnapshot) => {
          users.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return users;
      }
      return [];
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  subscribeToUsers: async (callback) => {
    //  message removed for production
    const realtimeDb = await getRealtimeDb();
    const usersRef = ref(realtimeDb, 'users');
    //  message removed for production
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      //  message removed for production
      //  message removed for production
      
      const users = [];
      if (snapshot.exists()) {
        //  message removed for production
        snapshot.forEach((childSnapshot) => {
          const userData = {
            id: childSnapshot.key,
            uid: childSnapshot.key, // Asegurar que uid esté disponible
            ...childSnapshot.val()
          };
          users.push(userData);
          //  message removed for production
        });
      } else {
        //  message removed for production
      }
      
      //  message removed for production
      callback(users);
    }, (error) => {
      //  message removed for production
      callback([]);
    });
    
    return unsubscribe;
  },

  // MANGAS
  createManga: async (mangaData) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const mangasRef = ref(realtimeDb, 'mangas');
      const newMangaRef = push(mangasRef);
      await set(newMangaRef, {
        ...mangaData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        chapters: mangaData.chapters || {}
      });
      return newMangaRef.key;
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  updateManga: async (mangaId, updateData) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const mangaRef = ref(realtimeDb, `mangas/${mangaId}`);
      await update(mangaRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  getAllMangas: async () => {
    try {
      const realtimeDb = await getRealtimeDb();
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
        return mangas;
      }
      return [];
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  subscribeToMangas: async (callback) => {
    const realtimeDb = await getRealtimeDb();
    const mangasRef = ref(realtimeDb, 'mangas');
    const unsubscribe = onValue(mangasRef, (snapshot) => {
      const mangas = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          mangas.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
      }
      callback(mangas);
    });
    return unsubscribe;
  },

  // ASIGNACIONES
  createAssignment: async (assignmentData) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const assignmentsRef = ref(realtimeDb, 'assignments');
      const newAssignmentRef = push(assignmentsRef);
      
      // Crear ID único para compartir
      const shareableId = newAssignmentRef.key;
      
      await set(newAssignmentRef, {
        ...assignmentData,
        shareableId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: assignmentData.status || 'pendiente',
        progress: assignmentData.progress || 0
      });
      
      // Actualizar automáticamente el conteo de capítulos del manga si aplica
      if (assignmentData.mangaId) {
        await realtimeService.updateMangaChapterCount(assignmentData.mangaId);
      }
      
      return { id: newAssignmentRef.key, shareableId };
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  updateAssignment: async (assignmentId, updateData) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const assignmentRef = ref(realtimeDb, `assignments/${assignmentId}`);
      await update(assignmentRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      // Añadir un pequeño retraso para asegurar que la actualización se propague
      await new Promise(resolve => setTimeout(resolve, 100));
      
      //  message removed for production
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  deleteAssignment: async (assignmentId) => {
    try {
      const realtimeDb = await getRealtimeDb();
      // Obtener datos de la asignación antes de eliminarla para actualizar el conteo
      const assignmentRef = ref(realtimeDb, `assignments/${assignmentId}`);
      const snapshot = await get(assignmentRef);
      const assignmentData = snapshot.exists() ? snapshot.val() : null;
      
      await remove(assignmentRef);
      
      // Actualizar automáticamente el conteo de capítulos del manga si aplica
      if (assignmentData && assignmentData.mangaId) {
        await realtimeService.updateMangaChapterCount(assignmentData.mangaId);
      }
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  getAllAssignments: async () => {
    try {
      const realtimeDb = await getRealtimeDb();
      const assignmentsRef = ref(realtimeDb, 'assignments');
      const snapshot = await get(assignmentsRef);
      if (snapshot.exists()) {
        const assignments = [];
        snapshot.forEach((childSnapshot) => {
          assignments.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return assignments;
      }
      return [];
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  getAssignmentsByUser: async (userId) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const assignmentsRef = ref(realtimeDb, 'assignments');
      const snapshot = await get(assignmentsRef);
      if (snapshot.exists()) {
        const assignments = [];
        snapshot.forEach((childSnapshot) => {
          const assignment = childSnapshot.val();
          if (assignment.assignedTo === userId) {
            assignments.push({
              id: childSnapshot.key,
              ...assignment
            });
          }
        });
        return assignments;
      }
      return [];
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  subscribeToAssignments: async (callback, userFilter = null) => {
    //  message removed for production
    const realtimeDb = await getRealtimeDb();
    const assignmentsRef = ref(realtimeDb, 'assignments');
    const unsubscribe = onValue(assignmentsRef, (snapshot) => {
      //  message removed for production
      const assignments = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const assignment = childSnapshot.val();
          if (!userFilter || assignment.assignedTo === userFilter) {
            assignments.push({
              id: childSnapshot.key,
              ...assignment
            });
          }
        });
      }
      //  message removed for production
      callback(assignments);
    }, (error) => {
      //  message removed for production
      callback([]);
    });
    return unsubscribe;
  },

  // FUNCIONES ESPECIALES PARA COMPARTIR ASIGNACIONES
  
  // Obtener asignación por ID compartible (sin autenticación)
  getSharedAssignment: async (shareableId) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const assignmentRef = ref(realtimeDb, `assignments/${shareableId}`);
      const snapshot = await get(assignmentRef);
      if (snapshot.exists()) {
        return {
          id: snapshot.key,
          ...snapshot.val()
        };
      }
      return null;
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  // Actualizar progreso de asignación compartida
  updateSharedAssignmentProgress: async (shareableId, progress, comments = '') => {
    try {
      const realtimeDb = await getRealtimeDb();
      const assignmentRef = ref(realtimeDb, `assignments/${shareableId}`);
      const status = progress >= 100 ? 'completado' : progress > 0 ? 'en_progreso' : 'pendiente';
      
      await update(assignmentRef, {
        progress,
        status,
        comments,
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  // Generar link compartible para una asignación
  generateShareableLink: (shareableId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${shareableId}`;
  },

  // Escuchar cambios en asignación específica (para links compartidos)
  subscribeToSharedAssignment: async (shareableId, callback) => {
    const realtimeDb = await getRealtimeDb();
    const assignmentRef = ref(realtimeDb, `assignments/${shareableId}`);
    const unsubscribe = onValue(assignmentRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({
          id: snapshot.key,
          ...snapshot.val()
        });
      } else {
        callback(null);
      }
    });
    return () => off(assignmentRef);
  },

  // Función auxiliar para actualizar el conteo de capítulos de un manga
  updateMangaChapterCount: async (mangaId) => {
    try {
      const realtimeDb = await getRealtimeDb();
      // Contar capítulos independientes
      const chaptersRef = ref(realtimeDb, `mangas/${mangaId}/chapters`);
      const chaptersSnapshot = await get(chaptersRef);
      const independentChapters = new Set();
      
      if (chaptersSnapshot.exists()) {
        Object.keys(chaptersSnapshot.val()).forEach(encodedChapterNumber => {
          const decodedChapterNumber = decodeChapterNumber(encodedChapterNumber);
          independentChapters.add(decodedChapterNumber);
        });
      }
      
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
      const allChapters = new Set([...independentChapters, ...assignmentChapters]);
      
      // Actualizar el conteo en el manga
      const mangaRef = ref(realtimeDb, `mangas/${mangaId}`);
      await update(mangaRef, {
        publishedChapters: allChapters.size,
        updatedAt: serverTimestamp()
      });
      
      return allChapters.size;
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  // CAPÍTULOS (independientes de asignaciones)
  createChapter: async (mangaId, chapterData) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const encodedChapterNumber = encodeChapterNumber(chapterData.chapter);
      const chapterRef = ref(realtimeDb, `mangas/${mangaId}/chapters/${encodedChapterNumber}`);
      await set(chapterRef, {
        ...chapterData,
        chapter: chapterData.chapter, // Guardar el número original en los datos
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Actualizar automáticamente el conteo de capítulos del manga
      await realtimeService.updateMangaChapterCount(mangaId);
      
      return chapterData.chapter;
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  updateChapter: async (mangaId, chapterNumber, updateData) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const encodedChapterNumber = encodeChapterNumber(chapterNumber);
      const chapterRef = ref(realtimeDb, `mangas/${mangaId}/chapters/${encodedChapterNumber}`);
      await update(chapterRef, {
        ...updateData,
        chapter: chapterNumber, // Asegurar que el número original se mantiene
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  deleteChapter: async (mangaId, chapterNumber) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const encodedChapterNumber = encodeChapterNumber(chapterNumber);
      const chapterRef = ref(realtimeDb, `mangas/${mangaId}/chapters/${encodedChapterNumber}`);
      await remove(chapterRef);
      
      // Actualizar automáticamente el conteo de capítulos del manga
      await realtimeService.updateMangaChapterCount(mangaId);
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  getChapters: async (mangaId) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const chaptersRef = ref(realtimeDb, `mangas/${mangaId}/chapters`);
      const snapshot = await get(chaptersRef);
      if (snapshot.exists()) {
        const chapters = [];
        snapshot.forEach((childSnapshot) => {
          const decodedChapterNumber = decodeChapterNumber(childSnapshot.key);
          const chapterData = childSnapshot.val();
          chapters.push({
            number: decodedChapterNumber,
            chapter: chapterData.chapter || decodedChapterNumber, // Preferir el número guardado en los datos
            ...chapterData
          });
        });
        // Ordenar por número de capítulo (manejando decimales correctamente)
        return chapters.sort((a, b) => {
          const numA = parseFloat(a.chapter || a.number);
          const numB = parseFloat(b.chapter || b.number);
          return numA - numB;
        });
      }
      return [];
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  // ESTADÍSTICAS
  getStats: async () => {
    try {
      const realtimeDb = await getRealtimeDb();
      const [mangasSnapshot, assignmentsSnapshot, usersSnapshot] = await Promise.all([
        get(ref(realtimeDb, 'mangas')),
        get(ref(realtimeDb, 'assignments')),
        get(ref(realtimeDb, 'users'))
      ]);

      const stats = {
        totalMangas: 0,
        totalAssignments: 0,
        activeAssignments: 0,
        completedAssignments: 0,
        totalUsers: 0
      };

      if (mangasSnapshot.exists()) {
        stats.totalMangas = Object.keys(mangasSnapshot.val()).length;
      }

      if (usersSnapshot.exists()) {
        stats.totalUsers = Object.keys(usersSnapshot.val()).length;
      }

      if (assignmentsSnapshot.exists()) {
        const assignments = Object.values(assignmentsSnapshot.val());
        stats.totalAssignments = assignments.length;
        stats.activeAssignments = assignments.filter(a => a.status !== 'completado').length;
        stats.completedAssignments = assignments.filter(a => a.status === 'completado').length;
      }

      return stats;
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  // SINCRONIZACIÓN DE ESTADO DE ASIGNACIONES
  syncAssignmentsWithPublishedChapters: async () => {
    try {
      const realtimeDb = await getRealtimeDb();
      //  message removed for production
      
      // Obtener todas las asignaciones
      const assignmentsRef = ref(realtimeDb, 'assignments');
      const assignmentsSnapshot = await get(assignmentsRef);
      
      if (!assignmentsSnapshot.exists()) {
        //  message removed for production
        return { updated: 0, total: 0 };
      }
      
      // Primero, crear mapa de capítulos subidos desde las asignaciones
      const uploadedChapters = new Map(); // mangaId -> Set(chapters con status 'uploaded')
      
      //  message removed for production
      assignmentsSnapshot.forEach((assignmentSnapshot) => {
        const assignment = assignmentSnapshot.val();
        
        // Si la asignación tiene status 'uploaded', marcar ese capítulo como publicado
        if (assignment.status === 'uploaded' && assignment.mangaId && assignment.chapter) {
          if (!uploadedChapters.has(assignment.mangaId)) {
            uploadedChapters.set(assignment.mangaId, new Set());
          }
          uploadedChapters.get(assignment.mangaId).add(assignment.chapter.toString());
          
          //  message removed for production
        }
      });
      
      // Debug message removed for production
      
      // Obtener todos los mangas con sus capítulos
      const mangasRef = ref(realtimeDb, 'mangas');
      const mangasSnapshot = await get(mangasRef);
      
      const publishedChapters = new Map(); // mangaId -> Set(chapters publicados)
      
      if (mangasSnapshot.exists()) {
        mangasSnapshot.forEach((mangaSnapshot) => {
          const mangaId = mangaSnapshot.key;
          const mangaData = mangaSnapshot.val();
          
          //  message removed for production
          
          if (mangaData.chapters) {
            const publishedChaptersSet = new Set();
            
            // Revisar cada capítulo
            Object.entries(mangaData.chapters).forEach(([chapterKey, chapterData]) => {
              const decodedChapterKey = decodeChapterNumber(chapterKey);
              const chapterNumber = chapterData.chapter || chapterData.number || decodedChapterKey;
              
              // Mostrar todos los campos disponibles para debug
              // Debug message removed for production
              
              // Un capítulo se considera "publicado" si cumple alguna de estas condiciones:
              // 1. Tiene fechaSubida válida y no vacía
              const hasValidUploadDate = chapterData.fechaSubida && 
                                        typeof chapterData.fechaSubida === 'string' && 
                                        chapterData.fechaSubida.trim() !== '';
              
              // 2. Tiene linkCapitulo válido y no vacío
              const hasValidLink = chapterData.linkCapitulo && 
                                 typeof chapterData.linkCapitulo === 'string' && 
                                 chapterData.linkCapitulo.trim() !== '';
              
              // 3. Su status indica que está subido/publicado
              const hasUploadedStatus = chapterData.status && 
                                      ['uploaded', 'publicado', 'completado', 'subido'].includes(chapterData.status.toLowerCase());
              
              // 4. La propiedad 'uploaded' es true (booleano)
              const isUploadedFlag = chapterData.uploaded === true;
              
              // 5. Verificar también otros campos comunes que podrían indicar que está subido
              const hasUploadDate = chapterData.uploadDate && chapterData.uploadDate.trim() !== '';
              const hasPublishDate = chapterData.publishDate && chapterData.publishDate.trim() !== '';
              const isMarkedAsPublished = chapterData.published === true;
              const isMarkedAsCompleted = chapterData.completed === true;
              
              const isPublished = hasValidUploadDate || hasValidLink || hasUploadedStatus || 
                                isUploadedFlag || hasUploadDate || hasPublishDate || 
                                isMarkedAsPublished || isMarkedAsCompleted;
              
              // Log detallado de la evaluación
              // Debug message removed for production
              
              if (isPublished && chapterNumber) {
                publishedChaptersSet.add(chapterNumber.toString());
                //  message removed for production
              } else {
                //  message removed for production
              }
            });
            
            if (publishedChaptersSet.size > 0) {
              publishedChapters.set(mangaId, publishedChaptersSet);
              //  message removed for production
            }
          } else {
            //  message removed for production
          }
        });
      }
      
      // Combinar capítulos publicados de ambas fuentes (manga chapters + uploaded assignments)
      for (const [mangaId, uploadedChaps] of uploadedChapters.entries()) {
        if (!publishedChapters.has(mangaId)) {
          publishedChapters.set(mangaId, new Set());
        }
        // Agregar todos los capítulos subidos al conjunto de publicados
        uploadedChaps.forEach(chapterNum => {
          publishedChapters.get(mangaId).add(chapterNum);
        });
      }
      
      // Debug message removed for production
      
      let totalAssignments = 0;
      let updatedAssignments = 0;
      const updates = [];
      
      // Revisar todas las asignaciones
      assignmentsSnapshot.forEach((assignmentSnapshot) => {
        const assignmentId = assignmentSnapshot.key;
        const assignment = assignmentSnapshot.val();
        totalAssignments++;
        
        //  message removed for production
        
        // Solo procesar asignaciones que no están completadas ni subidas (uploaded)
        // No debemos cambiar asignaciones que ya están en estado 'uploaded' porque ese es un estado superior a 'completado'
        if (assignment.status !== 'completado' && assignment.status !== 'uploaded' && assignment.mangaId && assignment.chapter) {
          const mangaPublishedChapters = publishedChapters.get(assignment.mangaId);
          const chapterStr = assignment.chapter.toString();
          
          // Debug message removed for production : 'Sin capítulos publicados');
          
          if (mangaPublishedChapters && mangaPublishedChapters.has(chapterStr)) {
            // Este capítulo está publicado, marcar asignación como completada
            //  message removed for production
            
            updates.push({
              assignmentId,
              mangaTitle: assignment.mangaTitle,
              chapter: assignment.chapter,
              currentStatus: assignment.status,
              newStatus: 'completado',
              progress: 100,
              completedAt: new Date().toISOString(),
              syncedBySystem: true
            });
            updatedAssignments++;
          } else {
            //  message removed for production
          }
        } else if (assignment.status === 'completado') {
          //  message removed for production
        } else {
          //  message removed for production
        }
      });
      
      // Aplicar las actualizaciones
      if (updates.length > 0) {
        //  message removed for production
        
        for (const update of updates) {
          await realtimeService.updateAssignment(update.assignmentId, {
            status: update.newStatus,
            progress: update.progress,
            completedAt: update.completedAt,
            syncedBySystem: update.syncedBySystem,
            lastSyncDate: new Date().toISOString()
          });
          
          //  message removed for production
        }
      } else {
        //  message removed for production
      }
      
      //  message removed for production
      
      return {
        updated: updatedAssignments,
        total: totalAssignments,
        updates: updates.map(u => ({
          manga: u.mangaTitle,
          chapter: u.chapter,
          status: `${u.currentStatus} → ${u.newStatus}`
        }))
      };
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  // MÉTODOS GENÉRICOS PARA CUALQUIER RUTA
  updateData: async (path, data) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const dataRef = ref(realtimeDb, path);
      await update(dataRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  setData: async (path, data) => {
    try {
      console.log('setData: Iniciando guardado en path:', path);
      console.log('setData: Datos a guardar:', Object.keys(data));
      
      // Asegurar que Firebase esté inicializado
      const realtimeDb = await getRealtimeDb();
      if (!realtimeDb) {
        throw new Error('Firebase Realtime Database no está inicializado');
      }
      
      const dataRef = ref(realtimeDb, path);
      const dataToSave = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      console.log('setData: Estructura de datos final:', Object.keys(dataToSave));
      
      await set(dataRef, dataToSave);
      
      console.log('setData: Guardado exitoso en path:', path);
      return true;
    } catch (error) {
      console.error('setData: Error detallado:', {
        path,
        errorCode: error.code,
        errorMessage: error.message,
        errorName: error.name,
        stack: error.stack
      });
      
      // Enriquecer el error con más información
      if (error.code === 'PERMISSION_DENIED') {
        error.message += ' - Acceso denegado a la ruta: ' + path;
      } else if (error.code === 'NETWORK_ERROR') {
        error.message += ' - Error de conexión al guardar en: ' + path;
      }
      
      throw error;
    }
  },

  getData: async (path) => {
    try {
      // Asegurar que Firebase esté inicializado
      const realtimeDb = await getRealtimeDb();
      if (!realtimeDb) {
        throw new Error('Firebase Realtime Database no está inicializado');
      }
      
      const dataRef = ref(realtimeDb, path);
      const snapshot = await get(dataRef);
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('getData: Error al obtener datos:', {
        path,
        errorCode: error.code,
        errorMessage: error.message
      });
      throw error;
    }
  },

  deleteData: async (path) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const dataRef = ref(realtimeDb, path);
      await remove(dataRef);
      return true;
    } catch (error) {
      //  message removed for production
      throw error;
    }
  },

  // Método específico para cargar reportes de uploads respetando las reglas de seguridad
  getUploadReports: async (userRole, userId) => {
    try {
      const realtimeDb = await getRealtimeDb();
      const dataRef = ref(realtimeDb, 'uploadReports');
      const snapshot = await get(dataRef);
      
      if (snapshot.exists()) {
        const allReports = snapshot.val();
        
        // Si es administrador, devolver todos los reportes
        if (userRole === 'admin' || userRole === 'administrador') {
          return allReports;
        }
        
        // Si es uploader u otro rol, filtrar solo sus reportes
        const userReports = {};
        Object.keys(allReports).forEach(key => {
          if (allReports[key].uploaderId === userId) {
            userReports[key] = allReports[key];
          }
        });
        return userReports;
      }
      
      return {};
    } catch (error) {
      //  message removed for production
      // En caso de error de permisos u otros, devolver objeto vacío
      return {};
    }
  },

  // Método para obtener el usuario actual (útil para logs)
  getCurrentUser: () => {
    // Este método puede ser implementado según tu sistema de autenticación
    // Por ahora retorna null, pero puedes integrarlo con Firebase Auth
    return null;
  }
};

export default realtimeService;
