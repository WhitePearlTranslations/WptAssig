// Script para configurar el administrador inicial
// Ejecutar una sola vez para establecer el superusuario

import { ref, set, get } from 'firebase/database';
import { realtimeDb } from '../services/firebase';
import { ROLES } from '../contexts/AuthContext';

const ADMIN_UID = '7HIHfawVZtYBnUgIsvuspXY9DCw1';

export const setupSuperAdmin = async () => {
  try {
    console.log('🔧 Configurando superusuario...');
    
    // Verificar si ya existe
    const adminRef = ref(realtimeDb, `users/${ADMIN_UID}`);
    const snapshot = await get(adminRef);
    
    if (snapshot.exists()) {
      console.log('✅ El superusuario ya existe:', snapshot.val());
      
      // Asegurarse de que tiene rol de admin
      const currentData = snapshot.val();
      if (currentData.role !== ROLES.ADMIN) {
        await set(adminRef, {
          ...currentData,
          role: ROLES.ADMIN,
          updatedAt: new Date().toISOString(),
        });
        console.log('🔄 Rol actualizado a ADMIN');
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
    
    console.log('✅ Superusuario creado exitosamente!');
    console.log('📋 Perfil:', adminProfile);
    
    return {
      success: true,
      message: 'Superusuario configurado exitosamente',
      profile: adminProfile
    };

  } catch (error) {
    console.error('❌ Error configurando superusuario:', error);
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
  console.log('🚀 Script de configuración de superusuario cargado');
  console.log('💡 Ejecuta: setupSuperAdmin() en la consola para configurar');
}
