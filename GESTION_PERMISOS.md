# 🔐 Gestión de Permisos - WhitePearl Translations

## 📋 **Resumen del Sistema de Roles**

```
ADMIN (Jerarquía: 5) 
├── Crear/editar/eliminar mangas
├── Crear cuentas de staff
├── Gestionar permisos
├── Asignar capítulos
└── Acceso total al sistema

JEFE_EDITOR/JEFE_TRADUCTOR (Jerarquía: 4)
├── Asignar capítulos 
└── Gestionar asignaciones

UPLOADER (Jerarquía: 3)
├── Marcar capítulos como subidos
└── Ver tareas de subida

EDITOR/TRADUCTOR (Jerarquía: 2)  
├── Ver solo sus asignaciones
├── Marcar tareas como completadas
└── Acceder a archivos de Drive
```

## 🚀 **Cómo Gestionar Permisos**

### **Opción 1: Panel de Administrador (Recomendado)**
1. **Accede como Admin** al panel `/admin`
2. **Ve a "Gestión del Staff"** 
3. **Crear nuevo usuario:**
   - Haz clic en "Agregar Staff"
   - Llena: Nombre, Email, Contraseña temporal, Rol
   - El sistema crea la cuenta y envía email de reset
4. **Cambiar rol:** Haz clic en "Editar rol" en la tarjeta del usuario

### **Opción 2: Directamente en Firebase (Avanzado)**

#### **A. En Firebase Console:**
```javascript
// Estructura en Firebase Realtime Database
users: {
  "uid_del_usuario": {
    name: "Nombre del Usuario",
    email: "email@ejemplo.com", 
    role: "traductor",  // ← Cambiar este campo
    status: "active",
    createdAt: "2024-08-10"
  }
}
```

#### **B. Crear usuario manualmente:**
1. **Firebase Authentication:** Crear cuenta con email/password
2. **Realtime Database:** Agregar entrada en `/users/{uid}`:
```json
{
  "name": "Nuevo Usuario",
  "email": "usuario@whitepearl.com",
  "role": "traductor",
  "status": "active", 
  "createdAt": "2024-08-10"
}
```

## 🔑 **Valores de Roles Válidos:**
```javascript
'admin'           // Administrador total
'jefe_editor'     // Jefe Editor
'jefe_traductor'  // Jefe Traductor  
'uploader'        // Uploader
'editor'          // Editor
'traductor'       // Traductor
```

## ⚡ **Comandos Rápidos (Código)**

### **Crear usuario programáticamente:**
```javascript
import { createUserAccount } from './services/userManagement';

const nuevoUsuario = await createUserAccount({
  name: "Nombre Usuario",
  email: "email@ejemplo.com", 
  password: "password123",
  role: "traductor"
});
```

### **Cambiar rol:**
```javascript
import { updateUserRole } from './services/userManagement';

await updateUserRole("uid_usuario", "jefe_editor");
```

### **Verificar permisos en componentes:**
```javascript
import { useAuth, ROLES } from './contexts/AuthContext';

const { hasRole } = useAuth();

// Verificar si tiene rol específico o superior
if (hasRole(ROLES.JEFE_EDITOR)) {
  // Mostrar funcionalidad de jefe
}

// Verificar rol exacto
if (userProfile?.role === ROLES.ADMIN) {
  // Solo para administradores
}
```

## 🛡️ **Protección de Rutas**

Las rutas se protegen automáticamente:
```javascript
// Solo admin puede acceder
/admin -> AdminPanel (requiere ROLES.ADMIN)

// Solo staff puede acceder  
/staff -> StaffDashboard (requiere autenticación)

// Acceso basado en jerarquía
/users -> Users (requiere ROLES.JEFE_EDITOR o superior)
```

## 🔄 **Flujo de Nuevos Usuarios**

1. **Admin crea cuenta** en Panel de Administrador
2. **Sistema envía email** con link de reset de contraseña  
3. **Usuario configura** su contraseña definitiva
4. **Usuario accede** con permisos según su rol asignado
5. **Sistema muestra** interfaz personalizada según rol

## 📞 **Troubleshooting**

### **Usuario no puede acceder:**
- ✅ Verificar que `status: "active"` en Firebase
- ✅ Verificar que tiene rol válido asignado
- ✅ Verificar que la cuenta existe en Firebase Auth

### **Permisos no funcionan:**
- ✅ Verificar jerarquía de roles en `AuthContext.js`
- ✅ Verificar que `hasRole()` se usa correctamente
- ✅ Revisar console para errores de Firebase

### **No puede crear usuarios:**
- ✅ Verificar reglas de Firebase Authentication
- ✅ Verificar que tienes permisos de admin
- ✅ Verificar configuración de email en Firebase

---

**🎯 Próximo Paso:** Accede al panel de administrador en `/admin` y comienza a crear tus usuarios del staff!
