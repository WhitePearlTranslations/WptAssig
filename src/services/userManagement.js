import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ref, set, update, remove, get } from 'firebase/database';
import { auth, realtimeDb } from './firebase';
import { ROLES } from '../contexts/AuthContext';

// Crear un nuevo usuario con rol específico
export const createUserAccount = async ({ name, email, password, role }) => {
  try {
    // 1. Crear cuenta en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Crear perfil en Realtime Database
    const userProfile = {
      name,
      email,
      role,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: 'Nunca',
      createdBy: auth.currentUser?.uid, // Quien lo creó
    };

    await set(ref(realtimeDb, `users/${user.uid}`), userProfile);

    // 3. Enviar email de reset para que el usuario configure su contraseña
    await sendPasswordResetEmail(auth, email);

    return {
      success: true,
      user: { uid: user.uid, ...userProfile },
      message: 'Usuario creado exitosamente. Se ha enviado un email para configurar la contraseña.'
    };
  } catch (error) {
    console.error('Error creando usuario:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Actualizar rol de usuario
export const updateUserRole = async (userId, newRole) => {
  try {
    await update(ref(realtimeDb, `users/${userId}`), {
      role: newRole,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid
    });

    return {
      success: true,
      message: 'Rol actualizado exitosamente'
    };
  } catch (error) {
    console.error('Error actualizando rol:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Desactivar/activar usuario
export const toggleUserStatus = async (userId, status) => {
  try {
    await update(ref(realtimeDb, `users/${userId}`), {
      status: status,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid
    });

    return {
      success: true,
      message: `Usuario ${status === 'active' ? 'activado' : 'desactivado'} exitosamente`
    };
  } catch (error) {
    console.error('Error actualizando estado:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Actualizar estado de usuario (suspender/reactivar)
export const updateUserStatus = async (userId, newStatus) => {
  try {
    if (!userId || !newStatus) {
      return {
        success: false,
        error: 'ID de usuario y nuevo estado son requeridos'
      };
    }

    // Validar estados permitidos
    const validStatuses = ['active', 'suspended', 'inactive'];
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        error: 'Estado no válido. Debe ser: active, suspended, o inactive'
      };
    }

    // Verificar que el usuario existe primero
    const userRef = ref(realtimeDb, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      };
    }

    const userData = userSnapshot.val();
    
    // No permitir suspender administradores principales
    if (userData.role === ROLES.ADMIN && newStatus === 'suspended') {
      return {
        success: false,
        error: 'No se puede suspender a un administrador principal'
      };
    }

    // Actualizar el estado del usuario
    await update(userRef, {
      status: newStatus,
      statusUpdatedAt: new Date().toISOString(),
      statusUpdatedBy: auth.currentUser?.uid || 'system'
    });

    const statusMessages = {
      active: 'Usuario reactivado exitosamente',
      suspended: 'Usuario suspendido exitosamente', 
      inactive: 'Usuario marcado como inactivo'
    };

    return {
      success: true,
      message: statusMessages[newStatus]
    };

  } catch (error) {
    console.error('Error actualizando estado del usuario:', error);
    return {
      success: false,
      error: 'Error interno del servidor: ' + error.message
    };
  }
};

// Obtener todos los usuarios (solo para superadmins)
export const getAllUsers = async () => {
  try {
    // Verificar que el usuario actual esté autenticado
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Obtener solo los datos del usuario actual primero para verificar permisos
    const currentUserRef = ref(realtimeDb, `users/${auth.currentUser.uid}`);
    const currentUserSnapshot = await get(currentUserRef);
    
    if (!currentUserSnapshot.exists()) {
      return {
        success: false,
        error: 'Usuario actual no encontrado en la base de datos'
      };
    }

    const currentUserData = currentUserSnapshot.val();
    const isAdmin = currentUserData.role === ROLES.ADMIN;
    const isSuperAdmin = auth.currentUser.uid === '7HIHfawVZtYBnUgIsvuspXY9DCw1' && 
                        auth.currentUser.email === 'whitepearltranslations@gmail.com';

    // Solo los superadmins pueden obtener todos los usuarios
    if (!isAdmin && !isSuperAdmin) {
      return {
        success: false,
        error: 'No tienes permisos para acceder a esta información'
      };
    }

    // Para superadmin, intentar obtener todos los usuarios (incluyendo fantasma)
    if (isSuperAdmin) {
      try {
        const usersSnapshot = await get(ref(realtimeDb, 'users'));
        const users = [];
        
        if (usersSnapshot.exists()) {
          usersSnapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            users.push({
              uid: childSnapshot.key,
              ...userData,
              // Marcar usuarios fantasma para identificarlos en la UI
              isGhost: userData.isGhost || false
            });
          });
        }
        
        return {
          success: true,
          users: users
        };
      } catch (dbError) {
        console.warn('Error accediendo a la base de datos completa, usando datos mock:', dbError);
        // Fallback a datos mock si las reglas de FB son muy restrictivas
        return {
          success: true,
          users: [
            {
              uid: auth.currentUser.uid,
              name: currentUserData.name || 'Administrador',
              email: auth.currentUser.email,
              role: currentUserData.role || ROLES.ADMIN,
              status: 'active',
              createdAt: currentUserData.createdAt || new Date().toISOString().split('T')[0],
              lastActive: 'Ahora'
            }
          ]
        };
      }
    }

    // Para admin normal, devolver solo su información
    return {
      success: true,
      users: [
        {
          uid: auth.currentUser.uid,
          name: currentUserData.name || 'Administrador',
          email: auth.currentUser.email,
          role: currentUserData.role || ROLES.ADMIN,
          status: 'active',
          createdAt: currentUserData.createdAt || new Date().toISOString().split('T')[0],
          lastActive: 'Ahora'
        }
      ]
    };

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Eliminar usuario (solo desactiva, no elimina realmente)
export const deleteUser = async (userId) => {
  try {
    await update(ref(realtimeDb, `users/${userId}`), {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
      deletedBy: auth.currentUser?.uid
    });

    return {
      success: true,
      message: 'Usuario eliminado exitosamente'
    };
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Verificar si el usuario actual puede gestionar otro usuario
export const canManageUser = (currentUserRole, targetUserRole) => {
  const hierarchy = {
    [ROLES.ADMIN]: 5,
    [ROLES.JEFE_EDITOR]: 4,
    [ROLES.JEFE_TRADUCTOR]: 4,
    [ROLES.UPLOADER]: 3,
    [ROLES.EDITOR]: 2,
    [ROLES.TRADUCTOR]: 2
  };

  return hierarchy[currentUserRole] > hierarchy[targetUserRole];
};

// Actualizar perfil completo de usuario (solo admin)
export const updateUserProfile = async (userId, updateData) => {
  try {
    if (!userId || !updateData) {
      return {
        success: false,
        error: 'ID de usuario y datos de actualización son requeridos'
      };
    }

    // Verificar que el usuario existe
    const userRef = ref(realtimeDb, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      };
    }

    const currentUserData = userSnapshot.val();
    
    // Preparar los datos de actualización con validaciones
    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid || 'admin'
    };

    // No permitir cambiar el email a través de esta función
    if (updateData.email && updateData.email !== currentUserData.email) {
      return {
        success: false,
        error: 'El email no se puede modificar a través de esta función'
      };
    }

    // No permitir cambiar la imagen de perfil de otros usuarios (solo el propio usuario puede hacerlo)
    if (updateData.profileImage !== undefined) {
      return {
        success: false,
        error: 'Los administradores no pueden modificar las imágenes de perfil de otros usuarios por razones de privacidad'
      };
    }

    // Validar el rol si se está actualizando
    if (updateData.role) {
      const validRoles = Object.values(ROLES);
      if (!validRoles.includes(updateData.role)) {
        return {
          success: false,
          error: 'Rol no válido'
        };
      }
    }

    // Validar el estado si se está actualizando
    if (updateData.status) {
      const validStatuses = ['active', 'suspended', 'inactive'];
      if (!validStatuses.includes(updateData.status)) {
        return {
          success: false,
          error: 'Estado no válido'
        };
      }
    }

    // Actualizar el perfil del usuario
    await update(userRef, dataToUpdate);

    return {
      success: true,
      message: 'Perfil de usuario actualizado exitosamente'
    };

  } catch (error) {
    console.error('Error actualizando perfil de usuario:', error);
    return {
      success: false,
      error: 'Error interno del servidor: ' + error.message
    };
  }
};

// Crear usuario fantasma (sin autenticación Firebase)
export const createGhostUser = async ({ name, email, role, isGhost = true }) => {
  try {
    if (!name || !role) {
      return {
        success: false,
        error: 'Nombre y rol son requeridos para crear un usuario fantasma'
      };
    }

    // Generar un ID único para el usuario fantasma
    const ghostId = `ghost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear perfil de usuario fantasma
    const ghostProfile = {
      id: ghostId,
      name,
      email: email || '', // Email opcional para usuarios fantasma
      role,
      status: 'ghost', // Estado especial para usuarios fantasma
      isGhost: true,
      canLogin: false,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: auth.currentUser?.uid || 'system',
      lastActive: 'Usuario fantasma - no puede iniciar sesión',
      description: 'Usuario creado para mantener historial de trabajos previos al sistema de autenticación'
    };

    // Guardar en la base de datos bajo una colección especial para usuarios fantasma
    await set(ref(realtimeDb, `users/${ghostId}`), ghostProfile);

    // También guardarlo en una colección separada para facilitar consultas
    await set(ref(realtimeDb, `ghostUsers/${ghostId}`), ghostProfile);

    return {
      success: true,
      user: ghostProfile,
      message: 'Usuario fantasma creado exitosamente. Este usuario aparecerá en el historial pero no podrá iniciar sesión.'
    };
  } catch (error) {
    console.error('Error creando usuario fantasma:', error);
    return {
      success: false,
      error: 'Error al crear usuario fantasma: ' + error.message
    };
  }
};

// Obtener todos los usuarios fantasma
export const getAllGhostUsers = async () => {
  try {
    const snapshot = await get(ref(realtimeDb, 'ghostUsers'));
    if (snapshot.exists()) {
      const ghostUsers = [];
      snapshot.forEach((childSnapshot) => {
        ghostUsers.push({
          uid: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return {
        success: true,
        users: ghostUsers
      };
    } else {
      return {
        success: true,
        users: []
      };
    }
  } catch (error) {
    console.error('Error obteniendo usuarios fantasma:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Resetear contraseña de usuario
export const resetUserPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Email de reset enviado exitosamente'
    };
  } catch (error) {
    console.error('Error enviando reset:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
