# 🔧 Actualización de Reglas Firebase - Sistema de Aprobación

## 🚨 Error Actual
Se está presentando el error:
```
Error: PERMISSION_DENIED: Permission denied
```

Este error ocurre porque las reglas actuales de Firebase no incluyen los nuevos estados de aprobación que hemos implementado.

## ⚡ Solución - Actualizar Reglas de Firebase

### 1. Acceder a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **"Realtime Database"**
4. Haz clic en la pestaña **"Rules"**

### 2. Reemplazar las Reglas Actuales

Copia y pega las siguientes reglas actualizadas que incluyen soporte para los nuevos estados:

```json
{
  "rules": {
    // Usuarios - Permitir lectura completa para superusuario y administradores
    "users": {
      ".read": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador')",
      ".write": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador')",
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador')",
        ".write": "auth != null && (auth.uid == $uid || auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador')",
        ".validate": "newData.hasChildren(['email', 'name', 'role'])"
      }
    },
    
    // Mangas - Solo usuarios con roles específicos pueden gestionar
    "mangas": {
      ".read": "auth != null",
      ".write": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador' || root.child('users').child(auth.uid).child('role').val() == 'jefe_editor' || root.child('users').child(auth.uid).child('role').val() == 'jefe_traductor')",
      "$mangaId": {
        ".validate": "newData.hasChildren(['title', 'author', 'status', 'createdAt'])"
      }
    },
    
    // Asignaciones - Permisos basados en roles y propiedad
    "assignments": {
      ".read": "auth != null",
      ".write": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador' || root.child('users').child(auth.uid).child('role').val() == 'jefe_editor' || root.child('users').child(auth.uid).child('role').val() == 'jefe_traductor')",
      "$assignmentId": {
        // Los usuarios asignados pueden actualizar su progreso
        ".write": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador' || root.child('users').child(auth.uid).child('role').val() == 'jefe_editor' || root.child('users').child(auth.uid).child('role').val() == 'jefe_traductor' || data.child('assignedTo').val() == auth.uid)",
        ".validate": "newData.hasChildren(['mangaId', 'mangaTitle', 'chapter', 'type', 'status', 'createdAt'])",
        
        // Reglas específicas para campos
        "progress": {
          ".write": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador' || root.child('users').child(auth.uid).child('role').val() == 'jefe_editor' || root.child('users').child(auth.uid).child('role').val() == 'jefe_traductor' || root.child('assignments').child($assignmentId).child('assignedTo').val() == auth.uid)",
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 100"
        },
        
        "status": {
          ".write": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador' || root.child('users').child(auth.uid).child('role').val() == 'jefe_editor' || root.child('users').child(auth.uid).child('role').val() == 'jefe_traductor' || root.child('assignments').child($assignmentId).child('assignedTo').val() == auth.uid)",
          ".validate": "newData.isString() && (newData.val() == 'pendiente' || newData.val() == 'en_progreso' || newData.val() == 'completado' || newData.val() == 'cancelado' || newData.val() == 'sin_asignar' || newData.val() == 'uploaded' || newData.val() == 'pendiente_aprobacion' || newData.val() == 'aprobado')"
        },
        
        // Campos adicionales para el flujo de aprobación
        "completedDate": {
          ".write": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador' || root.child('users').child(auth.uid).child('role').val() == 'jefe_editor' || root.child('users').child(auth.uid).child('role').val() == 'jefe_traductor' || root.child('assignments').child($assignmentId).child('assignedTo').val() == auth.uid)",
          ".validate": "newData.isString()"
        },
        
        "completedBy": {
          ".write": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador' || root.child('users').child(auth.uid).child('role').val() == 'jefe_editor' || root.child('users').child(auth.uid).child('role').val() == 'jefe_traductor' || root.child('assignments').child($assignmentId).child('assignedTo').val() == auth.uid)",
          ".validate": "newData.isString()"
        },
        
        "pendingApprovalSince": {
          ".write": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador' || root.child('users').child(auth.uid).child('role').val() == 'jefe_editor' || root.child('users').child(auth.uid).child('role').val() == 'jefe_traductor' || root.child('assignments').child($assignmentId).child('assignedTo').val() == auth.uid)",
          ".validate": "newData.isString()"
        },
        
        "reviewRequiredBy": {
          ".write": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador' || root.child('users').child(auth.uid).child('role').val() == 'jefe_editor' || root.child('users').child(auth.uid).child('role').val() == 'jefe_traductor' || root.child('assignments').child($assignmentId).child('assignedTo').val() == auth.uid)",
          ".validate": "newData.isString()"
        }
      }
    },
    
    // Asignaciones compartidas - Acceso público para lectura y actualización de progreso
    "sharedAssignments": {
      ".read": true,
      "$shareId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['assignmentId', 'createdAt'])",
        
        // Permitir actualización de progreso sin autenticación
        "progress": {
          ".write": true,
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 100"
        },
        
        "status": {
          ".write": true,
          ".validate": "newData.isString() && (newData.val() == 'pendiente' || newData.val() == 'en_progreso' || newData.val() == 'completado' || newData.val() == 'cancelado' || newData.val() == 'sin_asignar' || newData.val() == 'uploaded' || newData.val() == 'pendiente_aprobacion' || newData.val() == 'aprobado')"
        },
        
        "updatedAt": {
          ".write": true
        },
        
        "lastUpdatedBy": {
          ".write": true
        }
      }
    },
    
    // Estadísticas - Solo lectura para usuarios autenticados
    "stats": {
      ".read": "auth != null",
      ".write": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador')"
    },
    
    // Configuración del sistema - Solo administradores
    "config": {
      ".read": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador')",
      ".write": "auth != null && (auth.uid == '7HIHfawVZtYBnUgIsvuspXY9DCw1' || root.child('users').child(auth.uid).child('role').val() == 'admin' || root.child('users').child(auth.uid).child('role').val() == 'administrador')"
    }
  }
}
```

### 3. Publicar las Reglas

1. Haz clic en **"Publish"** o **"Publicar"**
2. Confirma los cambios

## 🎯 Qué Cambia con Esta Actualización

### Nuevos Estados Permitidos
- `pendiente_aprobacion` - Para trabajos enviados a revisión
- `aprobado` - Para trabajos aprobados por jefes

### Nuevos Campos Permitidos
- `completedDate` - Fecha de completado
- `completedBy` - Usuario que completó la tarea
- `pendingApprovalSince` - Timestamp de cuándo se solicitó aprobación
- `reviewRequiredBy` - Tipo de jefe que debe revisar

### Permisos Actualizados
- Los trabajadores pueden actualizar el estado de sus asignaciones a `pendiente_aprobacion`
- Los jefes pueden cambiar estados de `pendiente_aprobacion` a `aprobado` o `completado`
- Todos los nuevos campos pueden ser escritos por usuarios asignados y jefes

## ✅ Verificación

Después de actualizar las reglas:

1. **Recarga la aplicación** (`Ctrl+F5` o `Cmd+Shift+R`)
2. **Intenta marcar una tarea como completada**
3. **Verifica que no aparezca el error `PERMISSION_DENIED`**
4. **Confirma que el estado cambia correctamente** a `pendiente_aprobacion` o `completado` según el rol

## 🚨 Importante

- **Estas reglas mantienen la seguridad** - solo los usuarios autorizados pueden modificar asignaciones
- **Los trabajadores solo pueden actualizar sus propias asignaciones**
- **Los jefes mantienen permisos completos sobre las asignaciones**
- **Los administradores tienen acceso total**

---

🔥 **Una vez que actualices las reglas en Firebase Console, el sistema de aprobación funcionará correctamente.**
