// Servicio para gestionar el estado de usuarios (suspender/reactivar acceso)
import { auth, realtimeDb } from './firebase';
import { ref, update, get } from 'firebase/database';
import { ROLES } from '../contexts/AuthContextSimple';

/**
 * Actualiza el estado de un usuario (activo, suspendido, inactivo)
 * @param {string} userId - ID del usuario 
 * @param {string} newStatus - Nuevo estado ('active', 'suspended', 'inactive')
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
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

    // Obtener referencia al usuario en Realtime Database
    const userRef = ref(realtimeDb, `users/${userId}`);
    
    // Verificar que el usuario existe
    const userSnapshot = await get(userRef);
    if (!userSnapshot.exists()) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      };
    }

    const userData = userSnapshot.val();
    
    // No permitir suspender administradores principales
    if (userData.role === 'admin' && newStatus === 'suspended') {
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
    //  message removed for production
    return {
      success: false,
      error: 'Error interno del servidor: ' + error.message
    };
  }
};

/**
 * Obtiene el estado actual de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, status?: string, error?: string}>}
 */
export const getUserStatus = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'ID de usuario es requerido'
      };
    }

    const userRef = ref(realtimeDb, `users/${userId}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      };
    }

    const userData = userSnapshot.val();
    
    return {
      success: true,
      status: userData.status || 'active',
      statusUpdatedAt: userData.statusUpdatedAt,
      statusUpdatedBy: userData.statusUpdatedBy
    };

  } catch (error) {
    //  message removed for production
    return {
      success: false,
      error: 'Error interno del servidor: ' + error.message
    };
  }
};

/**
 * Verifica si un usuario puede acceder al sistema basado en su estado
 * @param {string} userId - ID del usuario
 * @returns {Promise<{canAccess: boolean, reason?: string}>}
 */
export const canUserAccess = async (userId) => {
  try {
    const statusResult = await getUserStatus(userId);
    
    if (!statusResult.success) {
      return {
        canAccess: false,
        reason: statusResult.error
      };
    }

    const { status } = statusResult;

    switch (status) {
      case 'active':
        return { canAccess: true };
      case 'suspended':
        return { 
          canAccess: false, 
          reason: 'Tu cuenta ha sido suspendida. Contacta al administrador.' 
        };
      case 'inactive':
        return { 
          canAccess: false, 
          reason: 'Tu cuenta está inactiva. Contacta al administrador.' 
        };
      default:
        return { 
          canAccess: false, 
          reason: 'Estado de cuenta desconocido.' 
        };
    }

  } catch (error) {
    //  message removed for production
    return {
      canAccess: false,
      reason: 'Error interno del servidor'
    };
  }
};

/**
 * Obtiene historial de cambios de estado de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, history?: Array, error?: string}>}
 */
export const getUserStatusHistory = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'ID de usuario es requerido'
      };
    }

    // Por ahora retornamos un array vacío
    // En una implementación completa, esto consultaría una colección de historial
    return {
      success: true,
      history: []
    };

  } catch (error) {
    //  message removed for production
    return {
      success: false,
      error: 'Error interno del servidor: ' + error.message
    };
  }
};
