import React from 'react';
import { Box, Alert, Typography } from '@mui/material';
import { useConditionalRender } from '../hooks/useUserPermissions';

/**
 * Componente wrapper para renderizado condicional basado en permisos
 * 
 * Ejemplo de uso:
 * 
 * // Mostrar solo si tiene un permiso específico
 * <PermissionWrapper permission="canAssignChapters">
 *   <Button>Asignar Capítulo</Button>
 * </PermissionWrapper>
 * 
 * // Mostrar solo si tiene al menos uno de varios permisos
 * <PermissionWrapper permissions={["canEditAssignments", "canDeleteAssignments"]} mode="any">
 *   <EditControls />
 * </PermissionWrapper>
 * 
 * // Mostrar solo si tiene todos los permisos especificados
 * <PermissionWrapper permissions={["canViewAllProjects", "canAccessReports"]} mode="all">
 *   <AdminDashboard />
 * </PermissionWrapper>
 */
const PermissionWrapper = ({ 
  children, 
  permission, 
  permissions, 
  mode = 'any', 
  fallback = null,
  showFallbackMessage = false,
  fallbackMessage = "No tienes permisos para ver este contenido."
}) => {
  // Determinar qué permisos verificar
  const permsToCheck = permission ? [permission] : permissions;
  
  const { canRender, loading, error } = useConditionalRender(permsToCheck, mode);

  // Mientras carga, mostrar contenido (evita flicker)
  if (loading) {
    return <>{children}</>;
  }

  // Si hay error, mostrar fallback o nada
  if (error) {
    console.error('Error verificando permisos:', error);
    return fallback || null;
  }

  // Si puede renderizar, mostrar contenido
  if (canRender) {
    return <>{children}</>;
  }

  // Si no puede renderizar y se solicita mensaje de fallback
  if (showFallbackMessage) {
    return (
      <Alert severity="warning" sx={{ my: 2 }}>
        <Typography variant="body2">
          {fallbackMessage}
        </Typography>
      </Alert>
    );
  }

  // Si no puede renderizar, mostrar fallback o nada
  return fallback || null;
};

/**
 * HOC (Higher Order Component) para componentes completos
 * 
 * Ejemplo de uso:
 * const AdminPanel = withPermissions(['canViewSystemLogs'], { mode: 'all' })(AdminPanelComponent);
 */
export const withPermissions = (permissions, options = {}) => (WrappedComponent) => {
  const { 
    mode = 'any', 
    fallback = null,
    showFallbackMessage = true,
    fallbackMessage = "No tienes permisos para acceder a esta funcionalidad."
  } = options;
  
  return function PermissionWrappedComponent(props) {
    return (
      <PermissionWrapper
        permissions={permissions}
        mode={mode}
        fallback={fallback}
        showFallbackMessage={showFallbackMessage}
        fallbackMessage={fallbackMessage}
      >
        <WrappedComponent {...props} />
      </PermissionWrapper>
    );
  };
};

/**
 * Hook personalizado para verificaciones más complejas
 * 
 * Ejemplo de uso:
 * const MyComponent = () => {
 *   const permissions = usePermissions();
 *   
 *   const canEdit = permissions.check('canEditAssignments');
 *   const canDelete = permissions.check('canDeleteAssignments');
 *   const canManage = permissions.hasAny(['canEditAssignments', 'canDeleteAssignments']);
 *   
 *   return (
 *     <div>
 *       {canEdit && <EditButton />}
 *       {canDelete && <DeleteButton />}
 *       {canManage && <ManageButton />}
 *     </div>
 *   );
 * };
 */
export { useCurrentUserPermissions as usePermissions } from '../hooks/useUserPermissions';

export default PermissionWrapper;
