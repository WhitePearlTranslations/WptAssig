# Sistema de Permisos Personalizados

## Descripción General

El sistema de permisos personalizados permite a los administradores asignar permisos específicos a cada usuario, sobrescribiendo los permisos por defecto de su rol. Esto proporciona un control granular sobre qué funcionalidades puede acceder cada miembro del equipo.

## Arquitectura del Sistema

### 1. Servicio de Permisos (`src/services/permissionsService.js`)

El servicio principal que maneja todas las operaciones CRUD de permisos:

```javascript
// Obtener permisos efectivos de un usuario
const permissions = await getEffectiveUserPermissions(userId, userRole);

// Verificar un permiso específico
const canEdit = await hasPermission(userId, userRole, 'canEditAssignments');

// Actualizar permisos personalizados
await updateUserPermissions(userId, newPermissions, currentUserId);
```

### 2. Hook de Permisos (`src/hooks/useUserPermissions.js`)

Proporciona hooks personalizados para manejar permisos en componentes React:

```javascript
// Hook principal para permisos
const { permissions, checkPermission, hasAnyPermission } = useUserPermissions();

// Hook para verificar un permiso específico
const { hasPermission, loading } = usePermissionCheck('canAssignChapters');

// Hook para renderizado condicional
const { canRender } = useConditionalRender(['canEdit', 'canDelete'], 'any');
```

### 3. Contexto de Autenticación

Extendido para incluir permisos del usuario actual:

```javascript
const { userPermissions, checkPermission, hasAnyPermission } = useAuth();
```

## Tipos de Permisos Disponibles

### Permisos de Asignaciones
- `canAssignChapters`: Puede crear y asignar nuevos capítulos
- `canEditAssignments`: Puede modificar asignaciones existentes
- `canDeleteAssignments`: Puede eliminar asignaciones
- `canReassignTasks`: Puede reasignar tareas entre usuarios

### Permisos de Visualización
- `canViewAllProjects`: Puede ver proyectos de otros equipos
- `canAccessReports`: Puede generar y ver reportes del sistema
- `canViewUserStats`: Puede ver estadísticas detalladas de usuarios

### Permisos Especiales
- `canManageUploads`: Puede gestionar el proceso de subida
- `canManageSeries`: Puede crear, editar y eliminar series
- `canModerateReviews`: Puede aprobar o rechazar revisiones

### Permisos Administrativos
- `canViewSystemLogs`: Puede acceder a logs del sistema
- `canManageBackups`: Puede crear y restaurar respaldos

## Permisos por Defecto por Rol

### Admin
- Todos los permisos habilitados

### Jefe Editor
```javascript
canAssignChapters: true,
canEditAssignments: true,
canDeleteAssignments: true,
canReassignTasks: true,
canViewAllProjects: true,
canAccessReports: true,
canViewUserStats: true,
canModerateReviews: true,
canManageSeries: true
```

### Jefe Traductor
```javascript
canAssignChapters: true,
canEditAssignments: true,
canReassignTasks: true,
canViewAllProjects: true,
canAccessReports: true,
canViewUserStats: true,
canModerateReviews: true
```

### Uploader
```javascript
canManageUploads: true
```

### Editor/Traductor
- Solo permisos básicos (ningún permiso especial por defecto)

## Cómo Usar los Permisos

### 1. Renderizado Condicional con Componentes

```jsx
import PermissionWrapper from '../components/PermissionWrapper';

// Mostrar botón solo si tiene permiso
<PermissionWrapper permission="canAssignChapters">
  <Button onClick={handleAssignChapter}>
    Asignar Capítulo
  </Button>
</PermissionWrapper>

// Mostrar sección solo si tiene al menos uno de varios permisos
<PermissionWrapper 
  permissions={["canEditAssignments", "canDeleteAssignments"]} 
  mode="any"
>
  <EditControlsSection />
</PermissionWrapper>
```

### 2. Verificaciones Programáticas

```jsx
import { useAuth } from '../contexts/AuthContextSimple';
import { useCurrentUserPermissions } from '../hooks/useUserPermissions';

const MyComponent = () => {
  const { checkPermission } = useAuth();
  const permissions = useCurrentUserPermissions();
  
  const handleEdit = async () => {
    if (await checkPermission('canEditAssignments')) {
      // Usuario puede editar
      editAssignment();
    } else {
      showErrorMessage('No tienes permisos para editar asignaciones');
    }
  };
  
  return (
    <div>
      {permissions.permissions?.canAssignChapters && (
        <Button onClick={handleAssign}>Asignar</Button>
      )}
    </div>
  );
};
```

### 3. HOC para Componentes Completos

```jsx
import { withPermissions } from '../components/PermissionWrapper';

const AdminPanelComponent = () => {
  return <div>Panel administrativo</div>;
};

// Exportar componente protegido
export const AdminPanel = withPermissions(
  ['canViewSystemLogs', 'canManageBackups'], 
  { mode: 'any' }
)(AdminPanelComponent);
```

## Gestión de Permisos desde Admin Panel

### 1. Configurar Permisos Personalizados

1. Ir a **Admin Panel → Gestión del Staff**
2. Hacer clic en el botón de permisos (⚙️) del usuario
3. Configurar los permisos específicos
4. Guardar cambios

### 2. Debug de Permisos

1. Ir a **Admin Panel → Debug de Permisos**
2. Seleccionar un usuario de la lista
3. Ver permisos efectivos y por defecto
4. Identificar permisos personalizados

### 3. Resetear Permisos

Para volver a usar solo los permisos por defecto del rol:
1. Abrir configuración de permisos del usuario
2. Hacer clic en "Resetear a por Defecto"
3. Confirmar la acción

## Estructura de Datos en Firebase

### Permisos Personalizados (`userPermissions/{userId}`)
```javascript
{
  "canAssignChapters": true,
  "canEditAssignments": false,
  "canViewAllProjects": true,
  "_lastUpdated": "2024-01-15T10:30:00.000Z",
  "_updatedBy": "adminUserId"
}
```

### Logs de Cambios (`systemLogs/permissions/{timestamp}_{userId}`)
```javascript
{
  "userId": "targetUserId",
  "action": "update",
  "permissions": { /* permisos modificados */ },
  "changedBy": "adminUserId",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "type": "permission_change"
}
```

## Reglas de Seguridad de Firebase

```javascript
// Permisos personalizados - solo admins pueden escribir
"userPermissions": {
  ".read": "auth != null",
  "$userId": {
    ".write": "root.child('users').child(auth.uid).child('role').val() == 'admin'"
  }
},

// Logs del sistema - solo admins pueden acceder
"systemLogs": {
  ".read": "root.child('users').child(auth.uid).child('role').val() == 'admin'",
  ".write": "root.child('users').child(auth.uid).child('role').val() == 'admin'"
}
```

## Ejemplos de Implementación

### Ejemplo 1: Botones de Acción Condicionales

```jsx
const AssignmentCard = ({ assignment }) => {
  const { checkPermission } = useAuth();
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      setCanEdit(await checkPermission('canEditAssignments'));
      setCanDelete(await checkPermission('canDeleteAssignments'));
    };
    checkPermissions();
  }, [checkPermission]);

  return (
    <Card>
      <CardContent>
        <Typography>{assignment.title}</Typography>
        <Box sx={{ mt: 2 }}>
          {canEdit && (
            <Button onClick={() => editAssignment(assignment.id)}>
              Editar
            </Button>
          )}
          {canDelete && (
            <Button color="error" onClick={() => deleteAssignment(assignment.id)}>
              Eliminar
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
```

### Ejemplo 2: Navegación Condicional

```jsx
const NavigationMenu = () => {
  return (
    <List>
      <ListItem>
        <ListItemText primary="Dashboard" />
      </ListItem>
      
      <PermissionWrapper permissions={["canAssignChapters", "canEditAssignments"]} mode="any">
        <ListItem>
          <ListItemText primary="Gestionar Asignaciones" />
        </ListItem>
      </PermissionWrapper>
      
      <PermissionWrapper permission="canAccessReports">
        <ListItem>
          <ListItemText primary="Reportes" />
        </ListItem>
      </PermissionWrapper>
      
      <PermissionWrapper permission="canViewAllProjects">
        <ListItem>
          <ListItemText primary="Todos los Proyectos" />
        </ListItem>
      </PermissionWrapper>
    </List>
  );
};
```

## Mejores Prácticas

### 1. Verificación de Permisos
- Siempre verificar permisos tanto en frontend como backend
- Usar fallbacks apropiados cuando no se tengan permisos
- Mantener la UX fluida evitando demasiadas verificaciones

### 2. Manejo de Errores
- Proporcionar mensajes claros cuando se niega el acceso
- Logs apropiados para debugging
- Fallbacks a permisos por defecto en caso de error

### 3. Performance
- Usar el sistema de cache del hook para evitar consultas repetitivas
- Verificar permisos una sola vez por componente cuando sea posible
- Usar renderizado condicional en lugar de ocultar elementos con CSS

### 4. Seguridad
- Nunca confiar únicamente en verificaciones del frontend
- Implementar validaciones en el backend para operaciones críticas
- Logs de auditoría para cambios de permisos

## Troubleshooting

### Permisos no se actualizan en tiempo real
- Verificar que el listener de Firebase esté configurado correctamente
- Usar `refreshPermissions()` del contexto de autenticación si es necesario

### Error "Permission denied"
- Verificar reglas de seguridad de Firebase
- Confirmar que el usuario tiene autenticación válida
- Revisar permisos del usuario en el debug panel

### Permisos inconsistentes
- Usar el Debug Panel para verificar permisos efectivos
- Revisar logs de cambios de permisos
- Confirmar que los permisos por defecto del rol son correctos
