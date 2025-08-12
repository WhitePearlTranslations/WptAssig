import { ref, get, remove, update } from 'firebase/database';
import { realtimeDb } from '../services/firebase';

/**
 * Función para limpiar usuarios duplicados y fantasmas obsoletos
 * Esta función debe ser ejecutada por un administrador
 */
export const cleanDuplicateUsers = async () => {
  console.log('🧹 Iniciando limpieza de usuarios duplicados...');
  
  try {
    // 1. Obtener todos los usuarios
    const usersSnapshot = await get(ref(realtimeDb, 'users'));
    const ghostUsersSnapshot = await get(ref(realtimeDb, 'ghostUsers'));
    
    const allUsers = [];
    const usersByName = new Map();
    const duplicatesToRemove = [];
    const ghostsToRemove = [];
    
    // Procesar usuarios regulares
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        const userData = {
          uid: childSnapshot.key,
          ...childSnapshot.val(),
          source: 'users'
        };
        allUsers.push(userData);
        
        const key = userData.name?.toLowerCase().trim();
        if (key) {
          if (usersByName.has(key)) {
            // Usuario duplicado encontrado
            const existing = usersByName.get(key);
            console.log(`🔍 Usuario duplicado encontrado: ${userData.name}`);
            console.log(`  Existente: ${existing.uid} (${existing.source}) - ${existing.isGhost ? 'fantasma' : 'real'}`);
            console.log(`  Duplicado: ${userData.uid} (${userData.source}) - ${userData.isGhost ? 'fantasma' : 'real'}`);
            
            // Prioridad: usuario real > usuario fantasma más reciente
            if (userData.isGhost && !existing.isGhost) {
              // El duplicado es fantasma, mantener el real
              duplicatesToRemove.push(userData);
            } else if (!userData.isGhost && existing.isGhost) {
              // El existente es fantasma, reemplazarlo con el real
              duplicatesToRemove.push(existing);
              usersByName.set(key, userData);
            } else {
              // Ambos son del mismo tipo, mantener el más reciente
              const existingDate = new Date(existing.createdAt || 0);
              const currentDate = new Date(userData.createdAt || 0);
              
              if (currentDate > existingDate) {
                duplicatesToRemove.push(existing);
                usersByName.set(key, userData);
              } else {
                duplicatesToRemove.push(userData);
              }
            }
          } else {
            usersByName.set(key, userData);
          }
        }
      });
    }
    
    // Procesar usuarios fantasma por separado
    if (ghostUsersSnapshot.exists()) {
      ghostUsersSnapshot.forEach((childSnapshot) => {
        const ghostData = {
          uid: childSnapshot.key,
          ...childSnapshot.val(),
          source: 'ghostUsers'
        };
        
        const key = ghostData.name?.toLowerCase().trim();
        if (key && usersByName.has(key)) {
          const existing = usersByName.get(key);
          if (!existing.isGhost) {
            // Ya existe un usuario real con este nombre, eliminar el fantasma
            console.log(`👻 Usuario fantasma obsoleto encontrado: ${ghostData.name}`);
            ghostsToRemove.push(ghostData);
          }
        }
      });
    }
    
    console.log(`📊 Resumen de limpieza:`);
    console.log(`  Total de usuarios únicos: ${usersByName.size}`);
    console.log(`  Duplicados a eliminar: ${duplicatesToRemove.length}`);
    console.log(`  Fantasmas obsoletos a eliminar: ${ghostsToRemove.length}`);
    
    // 2. Eliminar usuarios duplicados
    for (const duplicate of duplicatesToRemove) {
      try {
        console.log(`🗑️ Eliminando duplicado: ${duplicate.name} (${duplicate.uid})`);
        await remove(ref(realtimeDb, `users/${duplicate.uid}`));
        
        // También eliminar de ghostUsers si existe ahí
        if (duplicate.isGhost) {
          await remove(ref(realtimeDb, `ghostUsers/${duplicate.uid}`));
        }
      } catch (error) {
        console.error(`❌ Error eliminando duplicado ${duplicate.uid}:`, error);
      }
    }
    
    // 3. Eliminar fantasmas obsoletos
    for (const ghost of ghostsToRemove) {
      try {
        console.log(`👻 Eliminando fantasma obsoleto: ${ghost.name} (${ghost.uid})`);
        await remove(ref(realtimeDb, `ghostUsers/${ghost.uid}`));
      } catch (error) {
        console.error(`❌ Error eliminando fantasma ${ghost.uid}:`, error);
      }
    }
    
    // 4. Marcar usuarios fantasma restantes que aún tienen asignaciones activas
    const remainingUsers = Array.from(usersByName.values());
    const activeGhosts = remainingUsers.filter(u => u.isGhost);
    
    for (const ghost of activeGhosts) {
      try {
        await update(ref(realtimeDb, `users/${ghost.uid}`), {
          status: 'ghost',
          cleanedAt: new Date().toISOString(),
          note: 'Usuario fantasma mantenido por historial de asignaciones'
        });
      } catch (error) {
        console.error(`❌ Error actualizando fantasma ${ghost.uid}:`, error);
      }
    }
    
    console.log('✅ Limpieza de usuarios completada exitosamente');
    
    return {
      success: true,
      removed: duplicatesToRemove.length + ghostsToRemove.length,
      uniqueUsers: usersByName.size,
      message: `Limpieza completada. Eliminados ${duplicatesToRemove.length} duplicados y ${ghostsToRemove.length} fantasmas obsoletos.`
    };
    
  } catch (error) {
    console.error('❌ Error durante la limpieza de usuarios:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Función para obtener usuarios únicos filtrados (sin duplicados y sin eliminados)
 * Esta función se puede usar como medida temporal mientras se ejecuta la limpieza
 */
export const getUniqueUsers = (users) => {
  const seen = new Map();
  const uniqueUsers = [];
  
  // Filtrar usuarios eliminados primero
  const activeUsers = users.filter(user => user.status !== 'deleted');
  
  // Procesar usuarios ordenados por prioridad: reales primero, luego fantasmas
  const sortedUsers = [...activeUsers].sort((a, b) => {
    // Usuarios reales tienen prioridad
    if (a.isGhost && !b.isGhost) return 1;
    if (!a.isGhost && b.isGhost) return -1;
    
    // Si ambos son del mismo tipo, ordenar por fecha de creación (más reciente primero)
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB - dateA;
  });
  
  for (const user of sortedUsers) {
    const key = user.name?.toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.set(key, true);
      uniqueUsers.push(user);
    }
  }
  
  console.log(`🔍 Usuarios únicos filtrados: ${uniqueUsers.length} de ${users.length} originales (${users.length - activeUsers.length} eliminados filtrados)`);
  return uniqueUsers;
};

/**
 * Función para verificar si un usuario es un duplicado
 */
export const isDuplicateUser = (user, existingUsers) => {
  const userKey = user.name?.toLowerCase().trim();
  if (!userKey) return false;
  
  return existingUsers.some(existingUser => {
    const existingKey = existingUser.name?.toLowerCase().trim();
    return existingKey === userKey && existingUser.uid !== user.uid;
  });
};
