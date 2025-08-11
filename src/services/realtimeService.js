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
import { realtimeDb } from './firebase';

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
      const userRef = ref(realtimeDb, `users/${userData.uid}`);
      await set(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return userData.uid;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  updateUser: async (userId, updateData) => {
    try {
      const userRef = ref(realtimeDb, `users/${userId}`);
      await update(userRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const userRef = ref(realtimeDb, `users/${userId}`);
      await remove(userRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
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
      console.error('Error getting users:', error);
      throw error;
    }
  },

  subscribeToUsers: (callback) => {
    console.log('Setting up users subscription...');
    const usersRef = ref(realtimeDb, 'users');
    console.log('Users ref created:', usersRef);
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      console.log('Users onValue callback triggered');
      console.log('Snapshot exists:', snapshot.exists());
      
      const users = [];
      if (snapshot.exists()) {
        console.log('Processing users snapshot...');
        snapshot.forEach((childSnapshot) => {
          const userData = {
            id: childSnapshot.key,
            uid: childSnapshot.key, // Asegurar que uid esté disponible
            ...childSnapshot.val()
          };
          users.push(userData);
          console.log('Added user:', userData);
        });
      } else {
        console.log('No users found in database');
      }
      
      console.log('Final users array:', users);
      callback(users);
    }, (error) => {
      console.error('Error in users subscription:', error);
      callback([]);
    });
    
    return unsubscribe;
  },

  // MANGAS
  createManga: async (mangaData) => {
    try {
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
      console.error('Error creating manga:', error);
      throw error;
    }
  },

  updateManga: async (mangaId, updateData) => {
    try {
      const mangaRef = ref(realtimeDb, `mangas/${mangaId}`);
      await update(mangaRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating manga:', error);
      throw error;
    }
  },

  getAllMangas: async () => {
    try {
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
      console.error('Error getting mangas:', error);
      throw error;
    }
  },

  subscribeToMangas: (callback) => {
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
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  updateAssignment: async (assignmentId, updateData) => {
    try {
      const assignmentRef = ref(realtimeDb, `assignments/${assignmentId}`);
      await update(assignmentRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  },

  deleteAssignment: async (assignmentId) => {
    try {
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
      console.error('Error deleting assignment:', error);
      throw error;
    }
  },

  getAllAssignments: async () => {
    try {
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
      console.error('Error getting assignments:', error);
      throw error;
    }
  },

  getAssignmentsByUser: async (userId) => {
    try {
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
      console.error('Error getting user assignments:', error);
      throw error;
    }
  },

  subscribeToAssignments: (callback, userFilter = null) => {
    const assignmentsRef = ref(realtimeDb, 'assignments');
    const unsubscribe = onValue(assignmentsRef, (snapshot) => {
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
      callback(assignments);
    });
    return () => off(assignmentsRef);
  },

  // FUNCIONES ESPECIALES PARA COMPARTIR ASIGNACIONES
  
  // Obtener asignación por ID compartible (sin autenticación)
  getSharedAssignment: async (shareableId) => {
    try {
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
      console.error('Error getting shared assignment:', error);
      throw error;
    }
  },

  // Actualizar progreso de asignación compartida
  updateSharedAssignmentProgress: async (shareableId, progress, comments = '') => {
    try {
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
      console.error('Error updating shared assignment:', error);
      throw error;
    }
  },

  // Generar link compartible para una asignación
  generateShareableLink: (shareableId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${shareableId}`;
  },

  // Escuchar cambios en asignación específica (para links compartidos)
  subscribeToSharedAssignment: (shareableId, callback) => {
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
      console.error('Error updating manga chapter count:', error);
      throw error;
    }
  },

  // CAPÍTULOS (independientes de asignaciones)
  createChapter: async (mangaId, chapterData) => {
    try {
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
      console.error('Error creating chapter:', error);
      throw error;
    }
  },

  updateChapter: async (mangaId, chapterNumber, updateData) => {
    try {
      const encodedChapterNumber = encodeChapterNumber(chapterNumber);
      const chapterRef = ref(realtimeDb, `mangas/${mangaId}/chapters/${encodedChapterNumber}`);
      await update(chapterRef, {
        ...updateData,
        chapter: chapterNumber, // Asegurar que el número original se mantiene
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating chapter:', error);
      throw error;
    }
  },

  deleteChapter: async (mangaId, chapterNumber) => {
    try {
      const encodedChapterNumber = encodeChapterNumber(chapterNumber);
      const chapterRef = ref(realtimeDb, `mangas/${mangaId}/chapters/${encodedChapterNumber}`);
      await remove(chapterRef);
      
      // Actualizar automáticamente el conteo de capítulos del manga
      await realtimeService.updateMangaChapterCount(mangaId);
    } catch (error) {
      console.error('Error deleting chapter:', error);
      throw error;
    }
  },

  getChapters: async (mangaId) => {
    try {
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
      console.error('Error getting chapters:', error);
      throw error;
    }
  },

  // ESTADÍSTICAS
  getStats: async () => {
    try {
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
      console.error('Error getting stats:', error);
      throw error;
    }
  }
};

export default realtimeService;
