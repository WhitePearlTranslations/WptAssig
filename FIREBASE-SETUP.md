# 🔥 Configuración Rápida de Firebase

## 📋 Instrucciones paso a paso

### 1. Ejecutar el configurador automático

Elige una de las siguientes opciones:

**Opción A: Script de Node.js (Recomendado)**
```bash
npm run setup-firebase
```

**Opción B: Script de PowerShell (Windows)**
```bash
npm run setup-firebase-ps
```

**Opción C: Ejecutar directamente**
```bash
node setup-firebase.js
```

### 2. Datos que necesitarás

Antes de ejecutar el script, ten listos estos datos de tu proyecto Firebase:

1. **API Key** - Clave de la API
2. **Auth Domain** - Dominio de autenticación (ej: `tu-proyecto.firebaseapp.com`)
3. **Database URL** - URL de Realtime Database (ej: `https://tu-proyecto-default-rtdb.firebaseio.com/`)
4. **Project ID** - ID del proyecto
5. **Storage Bucket** - Bucket de almacenamiento (ej: `tu-proyecto.appspot.com`)
6. **Messaging Sender ID** - ID del servicio de mensajería
7. **App ID** - ID de la aplicación

### 3. ¿Dónde encontrar estos datos?

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Haz clic en ⚙️ **Project Settings**
4. Ve a la pestaña **General**
5. En **Your apps**, busca la sección **Web apps**
6. Si no tienes una app web, haz clic en **Add app** y selecciona **Web**
7. Copia los valores de `firebaseConfig`

### 4. Configurar Realtime Database

1. En Firebase Console, ve a **Realtime Database**
2. Haz clic en **Create Database**
3. Selecciona una ubicación
4. Empieza en **modo de prueba** (puedes cambiar las reglas después)
5. Ve a la pestaña **Rules** y configura:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "mangas": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "assignments": {
      ".read": true,
      ".write": true,
      "$assignmentId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

### 5. Configurar Authentication

1. En Firebase Console, ve a **Authentication**
2. Haz clic en **Get started**
3. Ve a la pestaña **Sign-in method**
4. Habilita **Email/Password**
5. Guarda los cambios

### 6. Verificar instalación

Después de la configuración:

1. Ejecuta `npm start`
2. Verifica que no haya errores en la consola
3. Deberías ver el mensaje "🔥 Firebase configurado correctamente" en la consola del navegador

## ✅ Archivos creados

El script creará automáticamente:

- **`.env`** - Variables de entorno (PRIVADO, no compartir)
- **`.env.example`** - Plantilla pública para referencia
- **`.gitignore`** - Configuración de seguridad
- **`src/services/firebase.js`** - Configuración actualizada

## 🔐 Seguridad

- ✅ El archivo `.env` está protegido en `.gitignore`
- ✅ Las variables están encriptadas en producción
- ✅ Solo se expone la configuración necesaria
- ❌ **NUNCA** compartas el archivo `.env` públicamente

## 🚀 Comandos disponibles

```bash
npm run setup-firebase    # Configurar Firebase (Node.js)
npm run setup-firebase-ps # Configurar Firebase (PowerShell)
npm run config            # Alias para setup-firebase
npm start                 # Iniciar la aplicación
npm run build             # Crear build de producción
```

## 🆘 Solución de problemas

### Error: "Firebase not configured"
- Verifica que el archivo `.env` existe
- Confirma que todas las variables estén completas
- Reinicia el servidor de desarrollo (`npm start`)

### Error: "Permission denied"
- Verifica las reglas de Realtime Database
- Confirma que Authentication esté habilitado
- Revisa que el usuario tenga los permisos correctos

### Error: "Module not found"
- Ejecuta `npm install` para instalar dependencias
- Verifica que estés en el directorio correcto del proyecto

## 📚 Documentación adicional

- [README.md](./README.md) - Documentación completa del proyecto
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

---

**¿Necesitas ayuda?** Consulta la documentación completa en [README.md](./README.md) o crea un issue en el repositorio.
