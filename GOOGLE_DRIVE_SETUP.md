# Configuración de Google Drive API para Vista Previa de Archivos

Esta guía te ayudará a configurar la Google Drive API para habilitar la funcionalidad de vista previa de archivos en el panel de reviews.

## 🚀 Funcionalidades que Habilita

- **Lista de archivos en carpetas** sin salir de la página
- **Vista previa embebida** de PDFs, imágenes, documentos de Google
- **Navegación secuencial** entre archivos de la carpeta
- **Autenticación OAuth** segura con Google

## 📋 Prerequisitos

- Una cuenta de Google
- Acceso a [Google Cloud Console](https://console.cloud.google.com/)

## 🛠️ Configuración Paso a Paso

### 1. Crear/Configurar Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el **Project ID**

### 2. Habilitar Google Drive API

1. En el menú lateral, ve a **APIs & Services** > **Library**
2. Busca "Google Drive API"
3. Haz clic en **Enable**

### 3. Crear Credenciales

#### API Key
1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **API Key**
3. Anota la **API Key** generada
4. (Opcional) Restringe la key a Google Drive API para mayor seguridad

#### OAuth 2.0 Client ID
1. En **Credentials**, haz clic en **Create Credentials** > **OAuth client ID**
2. Si es la primera vez, configura la **OAuth consent screen**:
   - **User Type**: External (para uso público) o Internal (solo tu organización)
   - **App name**: "WhitePearl Manga Assignments"
   - **User support email**: tu email
   - **Developer contact**: tu email
   - **Scopes**: Agregar `../auth/drive.readonly` (solo lectura)
3. Para crear el Client ID:
   - **Application type**: Web application
   - **Name**: "WhitePearl Web Client"
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (desarrollo)
     - `https://tu-dominio.com` (producción)
   - **Authorized redirect URIs**: (puedes dejarlo vacío para esta implementación)
4. Anota el **Client ID**

### 4. Configurar Variables de Entorno

Copia tu archivo `.env.example` a `.env` y completa:

```env
# Google Drive API Configuration
REACT_APP_GOOGLE_DRIVE_API_KEY=tu_api_key_aqui
REACT_APP_GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
```

### 5. Configurar Dominios Autorizados

En Google Cloud Console > **APIs & Services** > **Credentials** > tu OAuth Client:

**Para desarrollo:**
```
http://localhost:3000
```

**Para producción:**
```
https://tu-dominio.com
https://www.tu-dominio.com
```

## 🔐 Configuración de Seguridad

### Restricciones de API Key
1. Ve a tu API Key en **Credentials**
2. Haz clic en **Restrict Key**
3. **API restrictions**: Selecciona "Google Drive API"
4. **Website restrictions** (opcional): Agrega tus dominios

### Scopes OAuth
El proyecto usa estos scopes mínimos:
- `https://www.googleapis.com/auth/drive.readonly` - Solo lectura de archivos

## 🧪 Probar la Configuración

1. Reinicia tu servidor de desarrollo
2. Ve al panel de **Reviews**
3. Haz clic en el botón de **vista previa** (👁️) de una asignación con carpeta de Drive
4. Deberías ver el botón "Conectar con Google Drive"
5. Después de autenticarte, deberías ver la lista de archivos

## ⚠️ Solución de Problemas

### Error: "Invalid API Key"
- Verifica que la API Key esté correcta en `.env`
- Asegúrate de que Google Drive API esté habilitada
- Verifica las restricciones de la API Key

### Error: "Unauthorized"
- Verifica que el Client ID esté correcto
- Asegúrate de que el dominio esté en "Authorized JavaScript origins"
- Verifica que el OAuth consent screen esté configurado

### Error: "Access Denied"
- Verifica que los scopes estén correctos
- Asegúrate de que el usuario tenga acceso a la carpeta de Drive
- Verifica que la carpeta sea pública o esté compartida

### Los archivos no se muestran
- Verifica que la carpeta de Google Drive sea accesible
- Asegúrate de que la URL de la carpeta sea correcta
- Verifica que hay archivos en la carpeta

## 🔄 Flujo de Autenticación

1. **Usuario hace clic en vista previa** → Se detecta que necesita autenticación
2. **Sistema muestra botón de login** → Usuario hace clic en "Conectar con Google Drive"
3. **Google abre popup de OAuth** → Usuario acepta permisos
4. **Sistema recibe token** → Se guarda automáticamente
5. **Lista archivos de carpeta** → Se muestran con vista previa

## 📚 Recursos Adicionales

- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [OAuth 2.0 for Client-side Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Google Cloud Console](https://console.cloud.google.com/)

## 💡 Consejos

- **Para desarrollo**: Usa `http://localhost:3000`
- **Para producción**: Asegúrate de usar HTTPS
- **Tokens**: Se guardan automáticamente en localStorage
- **Permisos**: Solo solicita permisos de lectura para seguridad
- **Testing**: Prueba con diferentes tipos de archivos (PDF, imágenes, documentos)

¡Una vez configurado, los jefes podrán revisar archivos directamente en la página sin salir a Google Drive! 🎉
