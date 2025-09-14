import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContextSimple';
import { 
  getEffectiveUserPermissions, 
  hasPermission,
  subscribeToUserPermissions,
  DEFAULT_PERMISSIONS 
} from '../services/permissionsService';

/**
 * Hook personalizado para manejar permisos de usuarios
 * Proporciona permisos en tiempo real con cache local para optimización
 */
export const useUserPermissions = (userId = null, userRole = null) => {
  const { currentUser, userProfile } = useAuth();
  
  // Si no se proporciona userId, usar el usuario actual
  const targetUserId = userId || currentUser?.uid;
  const targetUserRole = userRole || userProfile?.role;
  
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache local para evitar solicitudes repetidas
  const [cache, setCache] = useState(new Map());

  // Función para cargar permisos
  const loadPermissions = useCallback(async () => {
    if (!targetUserId || !targetUserRole) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verificar cache primero
      const cacheKey = `${targetUserId}_${targetUserRole}`;
      const cachedPerms = cache.get(cacheKey);
      
      if (cachedPerms && (Date.now() - cachedPerms.timestamp < 30000)) { // Cache válido por 30 segundos
        setPermissions(cachedPerms.permissions);
        setLoading(false);
        return;
      }

      const effectivePermissions = await getEffectiveUserPermissions(targetUserId, targetUserRole);
      
      // Actualizar cache
      setCache(prevCache => {
        const newCache = new Map(prevCache);
        newCache.set(cacheKey, {
          permissions: effectivePermissions,
          timestamp: Date.now()
        });
        return newCache;
      });
      
      setPermissions(effectivePermissions);
    } catch (err) {
      console.error('Error cargando permisos:', err);
      setError(err.message);
      
      // Fallback: usar permisos por defecto del rol
      if (targetUserRole) {
        const fallbackPermissions = DEFAULT_PERMISSIONS[targetUserRole] || DEFAULT_PERMISSIONS.traductor;
        setPermissions({
          ...fallbackPermissions,
          _hasCustomPermissions: false,
          _error: true,
          _errorMessage: 'Error cargando permisos personalizados. Usando permisos por defecto.'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [targetUserId, targetUserRole, cache]);

  // Configurar listener en tiempo real
  useEffect(() => {
    if (!targetUserId) return;

    let unsubscribe = () => {};

    // Cargar permisos iniciales
    loadPermissions();

    // Configurar listener para cambios en tiempo real
    unsubscribe = subscribeToUserPermissions(targetUserId, (updatedPermissions) => {
      if (updatedPermissions) {
        // Combinar con permisos por defecto
        const defaultPerms = DEFAULT_PERMISSIONS[targetUserRole] || DEFAULT_PERMISSIONS.traductor;
        const combinedPermissions = {
          ...defaultPerms,
          ...updatedPermissions,
          _hasCustomPermissions: true,
          _lastUpdated: updatedPermissions._lastUpdated,
          _updatedBy: updatedPermissions._updatedBy
        };
        
        setPermissions(combinedPermissions);
        
        // Actualizar cache
        const cacheKey = `${targetUserId}_${targetUserRole}`;
        setCache(prevCache => {
          const newCache = new Map(prevCache);
          newCache.set(cacheKey, {
            permissions: combinedPermissions,
            timestamp: Date.now()
          });
          return newCache;
        });
      } else {
        // No hay permisos personalizados, usar por defecto
        const defaultPerms = DEFAULT_PERMISSIONS[targetUserRole] || DEFAULT_PERMISSIONS.traductor;
        setPermissions({
          ...defaultPerms,
          _hasCustomPermissions: false
        });
      }
    });

    return () => unsubscribe();
  }, [targetUserId, targetUserRole, loadPermissions]);

  // Función helper para verificar un permiso específico
  const checkPermission = useCallback(async (permission) => {
    if (!targetUserId || !targetUserRole) return false;
    
    try {
      // Si tenemos permisos cargados, usar cache local
      if (permissions && !permissions._error) {
        return Boolean(permissions[permission]);
      }
      
      // Si no, hacer consulta directa
      return await hasPermission(targetUserId, targetUserRole, permission);
    } catch (error) {
      console.error('Error verificando permiso:', error);
      // Fallback: usar permisos por defecto
      const defaultPerms = DEFAULT_PERMISSIONS[targetUserRole] || DEFAULT_PERMISSIONS.traductor;
      return Boolean(defaultPerms[permission]);
    }
  }, [targetUserId, targetUserRole, permissions]);

  // Función helper para verificar múltiples permisos
  const checkPermissions = useCallback(async (permissionsList) => {
    const results = {};
    for (const permission of permissionsList) {
      results[permission] = await checkPermission(permission);
    }
    return results;
  }, [checkPermission]);

  // Función helper para verificar si tiene al menos uno de varios permisos
  const hasAnyPermission = useCallback(async (permissionsList) => {
    for (const permission of permissionsList) {
      if (await checkPermission(permission)) {
        return true;
      }
    }
    return false;
  }, [checkPermission]);

  // Función helper para verificar si tiene todos los permisos de la lista
  const hasAllPermissions = useCallback(async (permissionsList) => {
    for (const permission of permissionsList) {
      if (!(await checkPermission(permission))) {
        return false;
      }
    }
    return true;
  }, [checkPermission]);

  // Función para invalidar cache y recargar
  const refresh = useCallback(() => {
    const cacheKey = `${targetUserId}_${targetUserRole}`;
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.delete(cacheKey);
      return newCache;
    });
    loadPermissions();
  }, [targetUserId, targetUserRole, loadPermissions]);

  // Función para limpiar toda la cache
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    // Estado
    permissions,
    loading,
    error,
    
    // Información del usuario objetivo
    targetUserId,
    targetUserRole,
    
    // Funciones de verificación
    checkPermission,
    checkPermissions,
    hasAnyPermission,
    hasAllPermissions,
    
    // Utilidades
    refresh,
    clearCache,
    
    // Información adicional
    hasCustomPermissions: permissions?._hasCustomPermissions || false,
    lastUpdated: permissions?._lastUpdated || null,
    updatedBy: permissions?._updatedBy || null,
    
    // Permisos por defecto del rol
    defaultPermissions: DEFAULT_PERMISSIONS[targetUserRole] || DEFAULT_PERMISSIONS.traductor
  };
};

/**
 * Hook simplificado para verificar permisos del usuario actual
 */
export const useCurrentUserPermissions = () => {
  return useUserPermissions();
};

/**
 * Hook para verificar un permiso específico del usuario actual
 * @param {string} permission - El permiso a verificar
 * @returns {object} { hasPermission: boolean, loading: boolean, error: string }
 */
export const usePermissionCheck = (permission) => {
  const { checkPermission, loading, error } = useCurrentUserPermissions();
  const [hasPermissionState, setHasPermissionState] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPerm = async () => {
      if (!permission) {
        setChecking(false);
        return;
      }

      try {
        setChecking(true);
        const result = await checkPermission(permission);
        setHasPermissionState(result);
      } catch (err) {
        console.error('Error checking permission:', err);
        setHasPermissionState(false);
      } finally {
        setChecking(false);
      }
    };

    checkPerm();
  }, [permission, checkPermission]);

  return {
    hasPermission: hasPermissionState,
    loading: loading || checking,
    error
  };
};

/**
 * Hook para componentes que necesitan renderizado condicional basado en permisos
 * @param {string|string[]} permissions - Permiso o lista de permisos
 * @param {string} mode - 'any' para al menos uno, 'all' para todos
 * @returns {object} { canRender: boolean, loading: boolean, error: string }
 */
export const useConditionalRender = (permissions, mode = 'any') => {
  const { hasAnyPermission, hasAllPermissions, loading, error } = useCurrentUserPermissions();
  const [canRender, setCanRender] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRender = async () => {
      if (!permissions) {
        setCanRender(true);
        setChecking(false);
        return;
      }

      try {
        setChecking(true);
        const permsArray = Array.isArray(permissions) ? permissions : [permissions];
        
        let result = false;
        if (mode === 'all') {
          result = await hasAllPermissions(permsArray);
        } else {
          result = await hasAnyPermission(permsArray);
        }
        
        setCanRender(result);
      } catch (err) {
        console.error('Error checking conditional render:', err);
        setCanRender(false);
      } finally {
        setChecking(false);
      }
    };

    checkRender();
  }, [permissions, mode, hasAnyPermission, hasAllPermissions]);

  return {
    canRender,
    loading: loading || checking,
    error
  };
};
