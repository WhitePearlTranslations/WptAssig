// Script para configurar el administrador inicial
// Ejecutar una sola vez para establecer el superusuario

import { ref, set, get } from 'firebase/database';
import { realtimeDb } from '../services/firebase';
import { ROLES } from '../contexts/AuthContextSimple';

const ADMIN_UID = '7HIHfawVZtYBnUgIsvuspXY9DCw1';

export const setupSuperAdmin = async () => {
  try {
    //  message removed for production
    
    // Verificar si ya existe
    const adminRef = ref(realtimeDb, `users/${ADMIN_UID}`);
    const snapshot = await get(adminRef);
    
    if (snapshot.exists()) {
      //  message removed for production
      
      // Asegurarse de que tiene rol de admin
      const currentData = snapshot.val();
      if (currentData.role !== ROLES.ADMIN) {
        await set(adminRef, {
          ...currentData,
          role: ROLES.ADMIN,
          updatedAt: new Date().toISOString(),
        });
        //  message removed for production
      }
      
      return { success: true, message: 'Superusuario configurado correctamente' };
    }

    // Crear perfil de superusuario
    const adminProfile = {
      name: 'Super Administrador',
      email: 'whitepearltranslations@gmail.com', // Email del superusuario
      role: ROLES.ADMIN,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString(),
      isSystemAdmin: true,
      permissions: {
        createUsers: true,
        deleteUsers: true,
        manageRoles: true,
        createMangas: true,
        deleteMangas: true,
        systemAccess: true
      }
    };

    await set(adminRef, adminProfile);
    
    //  message removed for production
    //  message removed for production
    
    return {
      success: true,
      message: 'Superusuario configurado exitosamente',
      profile: adminProfile
    };

  } catch (error) {
    //  message removed for production
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para usar desde la consola del navegador
window.setupSuperAdmin = setupSuperAdmin;

// Auto-ejecutar si se llama directamente
if (typeof window !== 'undefined' && window.location) {
  //  message removed for production
  //  message removed for production
}
