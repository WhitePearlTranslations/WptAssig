# WhitePearl Translations - Sistema de Asignaciones

Sistema web moderno para gestión de asignaciones de traducción y edición de manga para el scan WhitePearlTranslations.

## 🚀 Características

- **Sistema de roles jerárquico**: Administrador, Jefe Editor, Jefe Traductor, Editor, Traductor
- **Gestión de asignaciones**: Crear, editar y monitorear el progreso de traducciones y ediciones
- **Dashboard interactivo**: Estadísticas en tiempo real y seguimiento del progreso
- **Interfaz moderna**: Diseño responsive con Material-UI
- **Base de datos en tiempo real**: Firebase Firestore para sincronización instantánea
- **Autenticación segura**: Firebase Auth con roles y permisos

## 🏗️ Arquitectura del Sistema

### Roles y Permisos

1. **Administrador**
   - Acceso completo al sistema
   - Crear y gestionar todos los usuarios
   - Ver todas las asignaciones

2. **Jefe Editor**
   - Crear y gestionar editores
   - Crear asignaciones de edición
   - Ver estadísticas del equipo de edición

3. **Jefe Traductor**
   - Crear y gestionar traductores
   - Crear asignaciones de traducción
   - Ver estadísticas del equipo de traducción

4. **Editor**
   - Ver y actualizar sus asignaciones de edición
   - Reportar progreso

5. **Traductor**
   - Ver y actualizar sus asignaciones de traducción
   - Reportar progreso

### Estructura de la Base de Datos

```
/users
  - uid, name, email, role, active, createdAt, stats

/mangas
  - title, description, status, chapters, createdAt

/assignments
  - mangaId, mangaTitle, chapter, type, assignedTo, assignedToName
  - status, progress, priority, dueDate, createdAt, updatedAt
```

## 📋 Prerrequisitos

- Node.js 16+ 
- npm o yarn
- Cuenta de Firebase

## 🛠️ Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd whitepearl-manga-assignments
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Firebase

1. Crear un nuevo proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Authentication (Email/Password)
3. Crear **Realtime Database** (no Firestore)
4. Configurar las reglas de seguridad de Realtime Database
5. Obtener la configuración del proyecto

### 4. Configurar variables de entorno

Editar `src/services/firebase.js` con tu configuración de Firebase:

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "tu-sender-id",
  appId: "tu-app-id"
};
```

### 5. Configurar reglas de Realtime Database

**Opción A: Deploy automático (Recomendado)**
```bash
# Hacer deploy de las reglas usando Firebase CLI
firebase deploy --only database

# O usar el script incluido (Windows)
deploy-rules.bat
```

**Opción B: Configuración manual**
En Firebase Console, ir a Realtime Database > Reglas y usar las reglas del archivo `database.rules.json`.

**Características de las reglas:**
- ✅ Sistema de aprobación con estados `pendiente_aprobacion` y `aprobado`
- ✅ Permisos diferenciados por roles
- ✅ Campos adicionales para tracking de aprobaciones
- ✅ Acceso público para asignaciones compartidas

## 🚀 Ejecutar la aplicación

### Desarrollo
```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

### Producción
```bash
npm run build
npm install -g serve
serve -s build
```

## 🌐 Deployment en Cloudflare Pages

Este proyecto está optimizado para Cloudflare Pages. Ver [CLOUDFLARE-PAGES-DEPLOY.md](CLOUDFLARE-PAGES-DEPLOY.md) para instrucciones detalladas.

### Deploy Rápido
1. Conecta tu repositorio GitHub a Cloudflare Pages
2. Configura las variables de entorno de Firebase
3. ¡Listo! Auto-deploy en cada push a master

## 📱 Uso del Sistema

### Primer Uso - Crear Administrador

1. Registrar al primer usuario desde Firebase Console
2. Agregar manualmente el documento en la colección `users`:

```json
{
  "uid": "firebase-uid-del-usuario",
  "name": "Administrador",
  "email": "admin@whitepearl.com",
  "role": "admin",
  "active": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "stats": {
    "assignmentsCompleted": 0,
    "assignmentsActive": 0
  }
}
```

### Flujo de Trabajo

1. **Administrador/Jefes**: Crear usuarios del equipo
2. **Administrador/Jefes**: Agregar mangas al sistema
3. **Jefes**: Crear asignaciones para su equipo
4. **Traductores/Editores**: Actualizar progreso de sus asignaciones
5. **Todos**: Ver estadísticas y progreso en el dashboard

## 🎨 Tecnologías Utilizadas

- **Frontend**: React 18, Material-UI 5
- **Backend**: Firebase (Auth + Firestore)
- **Routing**: React Router v6
- **State Management**: React Context
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Icons**: Material Icons

## 📊 Funcionalidades Principales

### Dashboard
- Estadísticas generales del proyecto
- Asignaciones activas del usuario
- Actividad reciente del equipo
- Gráficos de progreso

### Gestión de Asignaciones
- Crear nuevas asignaciones
- Filtrar por estado, tipo, usuario
- Actualizar progreso en tiempo real
- Establecer prioridades y fechas límite

### Gestión de Usuarios
- Crear usuarios con roles específicos
- Activar/desactivar usuarios
- Ver estadísticas de rendimiento
- Gestión jerárquica de permisos

### Perfil de Usuario
- Editar información personal
- Cambiar contraseña
- Ver estadísticas personales
- Historial de asignaciones

## 🔧 Personalización

### Colores y Tema
Modificar `src/App.js` para cambiar la paleta de colores:

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Color principal
    },
    secondary: {
      main: '#9c27b0', // Color secundario
    }
  }
});
```

### Agregar Nuevos Campos
1. Actualizar los formularios en las páginas correspondientes
2. Modificar los servicios de Firebase
3. Actualizar las reglas de Firestore si es necesario

## 🐛 Resolución de Problemas

### Error de permisos de Firestore
- Verificar que las reglas de seguridad estén configuradas correctamente
- Asegurar que el usuario tenga el rol adecuado

### Problemas de autenticación
- Verificar la configuración de Firebase
- Comprobar que Email/Password esté habilitado en Authentication

### Datos no se actualizan
- Verificar la conexión a internet
- Revisar la consola del navegador para errores
- Comprobar las reglas de Firestore

## 📝 Roadmap

- [ ] Notificaciones push para nuevas asignaciones
- [ ] Sistema de comentarios en asignaciones
- [ ] Exportar reportes en PDF/Excel
- [ ] Integración con Discord webhooks
- [ ] Sistema de badges y gamificación
- [ ] Panel de métricas avanzadas
- [ ] Modo oscuro/claro

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 🆘 Soporte

Para soporte o dudas:
- Crear un issue en GitHub
- Contactar al administrador del sistema
- Revisar la documentación

---

**Desarrollado para WhitePearl Translations** 🌟
