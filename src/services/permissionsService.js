import { getRealtimeDb } from './firebase';
import { ref, get, set, update, onValue } from 'firebase/database';

/**
 * Servicio para manejar permisos personalizados de usuarios
 */

// Permisos disponibles en el sistema
export const AVAILABLE_PERMISSIONS = {
  // Permisos de asignaciones
  canAssignChapters: {
    name: 'Asignar Capítulos',
    description: 'Puede crear y asignar nuevos capítulos a otros usuarios',
    category: 'assignments'
  },
  canEditAssignments: {
    name: 'Editar Asignaciones', 
    description: 'Puede modificar asignaciones existentes',
    category: 'assignments'
  },
  canDeleteAssignments: {
    name: 'Eliminar Asignaciones',
    description: 'Puede eliminar asignaciones (acción irreversible)',
    category: 'assignments'
  },
  canReassignTasks: {
    name: 'Reasignar Tareas',
    description: 'Puede reasignar tareas de un usuario a otro',
    category: 'assignments'
  },
  
  // Permisos de visualización
  canViewAllProjects: {
    name: 'Ver Todos los Proyectos',
    description: 'Puede ver proyectos de otros equipos y usuarios',
    category: 'viewing'
  },
  canAccessReports: {
    name: 'Acceso a Reportes',
    description: 'Puede generar y ver reportes del sistema',
    category: 'viewing'
  },
  canViewUserStats: {
    name: 'Ver Estadísticas de Usuarios',
    description: 'Puede ver estadísticas detalladas de otros usuarios',
    category: 'viewing'
  },
  
  // Permisos especiales
  canManageUploads: {
    name: 'Gestionar Subidas',
    description: 'Puede gestionar el proceso de subida y publicación',
    category: 'special'
  },
  canManageSeries: {
    name: 'Gestionar Series',
    description: 'Puede crear, editar y eliminar series',
    category: 'special'
  },
  canModerateReviews: {
    name: 'Moderar Revisiones',
    description: 'Puede aprobar o rechazar revisiones de otros usuarios',
    category: 'special'
  },
  
  // Permisos administrativos
  canViewSystemLogs: {
    name: 'Ver Logs del Sistema',
    description: 'Puede acceder a los logs y actividades del sistema',
    category: 'admin'
  },
  canManageBackups: {
    name: 'Gestionar Respaldos',
    description: 'Puede crear y restaurar respaldos del sistema',
    category: 'admin'
  }
};

// Permisos por defecto según el rol
export const DEFAULT_PERMISSIONS = {
  admin: Object.keys(AVAILABLE_PERMISSIONS).reduce((acc, perm) => ({ ...acc, [perm]: true }), {}),
  jefe_editor: {
    canAssignChapters: true,
    canEditAssignments: true,
    canDeleteAssignments: true,
    canReassignTasks: true,
    canViewAllProjects: true,
    canAccessReports: true,
    canViewUserStats: true,
    canModerateReviews: true,
    canViewSystemLogs: false,
    canManageBackups: false,
    canManageUploads: false,
    canManageSeries: true
  },
  jefe_traductor: {
    canAssignChapters: true,
    canEditAssignments: true,
    canDeleteAssignments: false,
    canReassignTasks: true,
    canViewAllProjects: true,
    canAccessReports: true,
    canViewUserStats: true,
    canModerateReviews: true,
    canViewSystemLogs: false,
    canManageBackups: false,
    canManageUploads: false,
    canManageSeries: false
  },
  uploader: {
    canAssignChapters: false,
    canEditAssignments: false,
    canDeleteAssignments: false,
    canReassignTasks: false,
    canViewAllProjects: false,
    canAccessReports: false,
    canViewUserStats: false,
    canModerateReviews: false,
    canViewSystemLogs: false,
    canManageBackups: false,
    canManageUploads: true,
    canManageSeries: false
  },
  editor: {
    canAssignChapters: false,
    canEditAssignments: false,
    canDeleteAssignments: false,
    canReassignTasks: false,
    canViewAllProjects: false,
    canAccessReports: false,
    canViewUserStats: false,
    canModerateReviews: false,
    canViewSystemLogs: false,
    canManageBackups: false,
    canManageUploads: false,
    canManageSeries: false
  },
  traductor: {
    canAssignChapters: false,
    canEditAssignments: false,
    canDeleteAssignments: false,
    canReassignTasks: false,
    canViewAllProjects: false,
    canAccessReports: false,
    canViewUserStats: false,
    canModerateReviews: false,
    canViewSystemLogs: false,
    canManageBackups: false,
    canManageUploads: false,
    canManageSeries: false
  }
};

/**
 * Obtiene los permisos de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} - Objeto con los permisos del usuario
 */
export const getUserPermissions = async (userId) => {
  try {
    const db = await getRealtimeDb();
    const permissionsRef = ref(db, `userPermissions/${userId}`);
    const snapshot = await get(permissionsRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo permisos del usuario:', error);
    throw new Error(`No se pudieron obtener los permisos: ${error.message}`);
  }
};

/**
 * Obtiene los permisos efectivos de un usuario (combinando rol por defecto + personalizados)
 * @param {string} userId - ID del usuario
 * @param {string} userRole - Rol del usuario
 * @returns {Promise<Object>} - Objeto con los permisos efectivos
 */
export const getEffectiveUserPermissions = async (userId, userRole) => {
  try {
    // Obtener permisos por defecto del rol
    const defaultPerms = DEFAULT_PERMISSIONS[userRole] || DEFAULT_PERMISSIONS.traductor;
    
    // Obtener permisos personalizados
    const customPerms = await getUserPermissions(userId);
    
    // Combinar permisos (los personalizados sobrescriben los por defecto)
    const effectivePermissions = {
      ...defaultPerms,
      ...customPerms,
      // Metadata
      _hasCustomPermissions: !!customPerms,
      _lastUpdated: customPerms?._lastUpdated || null,
      _updatedBy: customPerms?._updatedBy || null
    };
    
    return effectivePermissions;
  } catch (error) {
    console.error('Error obteniendo permisos efectivos:', error);
    // En caso de error, retornar permisos por defecto del rol
    return DEFAULT_PERMISSIONS[userRole] || DEFAULT_PERMISSIONS.traductor;
  }
};

/**
 * Actualiza los permisos de un usuario
 * @param {string} userId - ID del usuario
 * @param {Object} permissions - Nuevos permisos
 * @param {string} updatedBy - ID del usuario que hace la actualización
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const updateUserPermissions = async (userId, permissions, updatedBy) => {
  try {
    const db = await getRealtimeDb();
    const permissionsRef = ref(db, `userPermissions/${userId}`);
    
    // Filtrar solo permisos válidos
    const validPermissions = {};
    Object.keys(AVAILABLE_PERMISSIONS).forEach(perm => {
      if (permissions.hasOwnProperty(perm)) {
        validPermissions[perm] = Boolean(permissions[perm]);
      }
    });
    
    // Agregar metadata
    const permissionsData = {
      ...validPermissions,
      _lastUpdated: new Date().toISOString(),
      _updatedBy: updatedBy
    };
    
    await set(permissionsRef, permissionsData);
    
    // También registrar en el log de actividad del usuario
    await logPermissionChange(userId, validPermissions, updatedBy);
    
    return {
      success: true,
      message: 'Permisos actualizados correctamente',
      permissions: validPermissions
    };
  } catch (error) {
    console.error('Error actualizando permisos:', error);
    return {
      success: false,
      message: `Error actualizando permisos: ${error.message}`,
      error: error.message
    };
  }
};

/**
 * Elimina los permisos personalizados de un usuario (vuelve a permisos por defecto)
 * @param {string} userId - ID del usuario
 * @param {string} deletedBy - ID del usuario que hace la eliminación
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const deleteUserPermissions = async (userId, deletedBy) => {
  try {
    const db = await getRealtimeDb();
    const permissionsRef = ref(db, `userPermissions/${userId}`);
    
    await set(permissionsRef, null);
    
    // Registrar en el log
    await logPermissionChange(userId, null, deletedBy, 'delete');
    
    return {
      success: true,
      message: 'Permisos personalizados eliminados. El usuario tendrá los permisos por defecto de su rol.'
    };
  } catch (error) {
    console.error('Error eliminando permisos:', error);
    return {
      success: false,
      message: `Error eliminando permisos: ${error.message}`,
      error: error.message
    };
  }
};

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {string} userId - ID del usuario
 * @param {string} userRole - Rol del usuario
 * @param {string} permission - Permiso a verificar
 * @returns {Promise<boolean>} - True si tiene el permiso
 */
export const hasPermission = async (userId, userRole, permission) => {
  try {
    const permissions = await getEffectiveUserPermissions(userId, userRole);
    return Boolean(permissions[permission]);
  } catch (error) {
    console.error('Error verificando permiso:', error);
    // En caso de error, usar permisos por defecto
    const defaultPerms = DEFAULT_PERMISSIONS[userRole] || DEFAULT_PERMISSIONS.traductor;
    return Boolean(defaultPerms[permission]);
  }
};

/**
 * Obtiene todos los usuarios con permisos personalizados
 * @returns {Promise<Array>} - Lista de usuarios con permisos personalizados
 */
export const getUsersWithCustomPermissions = async () => {
  try {
    const db = await getRealtimeDb();
    const permissionsRef = ref(db, 'userPermissions');
    const snapshot = await get(permissionsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(userId => ({
        userId,
        permissions: data[userId],
        lastUpdated: data[userId]._lastUpdated,
        updatedBy: data[userId]._updatedBy
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error obteniendo usuarios con permisos personalizados:', error);
    return [];
  }
};

/**
 * Registra un cambio de permisos en el log del sistema
 * @param {string} userId - ID del usuario afectado
 * @param {Object} permissions - Permisos (null si se eliminaron)
 * @param {string} changedBy - ID del usuario que hizo el cambio
 * @param {string} action - Tipo de acción: 'update' | 'delete'
 */
const logPermissionChange = async (userId, permissions, changedBy, action = 'update') => {
  try {
    const db = await getRealtimeDb();
    const logsRef = ref(db, `systemLogs/permissions/${Date.now()}_${userId}`);
    
    const logEntry = {
      userId,
      action,
      permissions: permissions,
      changedBy,
      timestamp: new Date().toISOString(),
      type: 'permission_change'
    };
    
    await set(logsRef, logEntry);
  } catch (error) {
    console.error('Error registrando cambio de permisos en log:', error);
    // No es crítico si falla el log
  }
};

/**
 * Listener para cambios en permisos de un usuario
 * @param {string} userId - ID del usuario
 * @param {Function} callback - Función callback que se ejecuta cuando cambian los permisos
 * @returns {Function} - Función para desuscribirse del listener
 */
export const subscribeToUserPermissions = (userId, callback) => {
  let unsubscribe = () => {};
  
  (async () => {
    try {
      const db = await getRealtimeDb();
      const permissionsRef = ref(db, `userPermissions/${userId}`);
      
      unsubscribe = onValue(permissionsRef, (snapshot) => {
        const permissions = snapshot.exists() ? snapshot.val() : null;
        callback(permissions);
      }, (error) => {
        console.error('Error en listener de permisos:', error);
        callback(null);
      });
    } catch (error) {
      console.error('Error configurando listener de permisos:', error);
      callback(null);
    }
  })();
  
  return () => unsubscribe();
};
