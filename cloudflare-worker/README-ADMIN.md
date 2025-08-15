# Configuración de Funciones Administrativas

Este worker de Cloudflare ahora incluye funcionalidad para eliminar usuarios de Firebase Authentication. Esto es necesario para que la función `deleteUser` del frontend pueda eliminar completamente las cuentas de usuario.

## ⚠️ Importante - Seguridad

La eliminación de usuarios de Firebase Authentication requiere privilegios administrativos especiales. Por seguridad, esta funcionalidad está protegida por:

1. **Verificación de origen**: Solo dominios autorizados pueden hacer peticiones
2. **Token administrativo**: Se requiere un token de seguridad adicional
3. **Clave de cuenta de servicio**: Firebase Admin SDK con permisos completos

## 🔧 Configuración Inicial

### 1. Obtener clave de cuenta de servicio de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto `wptasignacion`
3. Ve a **Configuración del proyecto** (⚙️) > **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Descarga el archivo JSON y guárdalo en un lugar seguro

### 2. Configurar secretos del worker

Ejecuta el script de configuración:

```bash
cd cloudflare-worker
npm run setup-admin-secrets
```

El script te pedirá:
- Un token de seguridad para proteger las operaciones (opcional, usa el predeterminado si prefieres)
- La ruta al archivo JSON de la clave de servicio que descargaste

### 3. Configurar variables de entorno del frontend

Agrega estas variables a tu archivo `.env`:

```env
# URL de tu worker desplegado
REACT_APP_WORKER_URL=https://wpt-config.tu-worker.workers.dev

# Token de administrador (debe coincidir con el configurado en el worker)
REACT_APP_ADMIN_DELETE_TOKEN=wpt-admin-delete-2024-secure
```

### 4. Desplegar el worker

```bash
npm run deploy
```

## 🔄 Funcionalidad

Una vez configurado, la función `deleteUser` del frontend:

1. **Elimina datos de Realtime Database**:
   - Asignaciones del usuario
   - Asignaciones compartidas relacionadas
   - Progreso de upload
   - Reportes de upload
   - Registro del usuario
   - Usuario fantasma (si aplica)

2. **Llama al worker para eliminar de Authentication**:
   - Verifica permisos y origen
   - Usa Firebase Admin SDK para eliminar la cuenta
   - Maneja errores gracefully (no falla si el usuario no existe en Auth)

## 🛡️ Endpoint de Seguridad

**POST** `/admin/delete-user`

**Headers requeridos**:
```json
{
  "Content-Type": "application/json",
  "Origin": "https://dominio-autorizado.com"
}
```

**Body**:
```json
{
  "userId": "firebase-user-id",
  "adminToken": "token-de-seguridad"
}
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente de Firebase Authentication",
  "userId": "firebase-user-id"
}
```

## 🔍 Troubleshooting

### Error: "Token de administrador inválido"
- Verifica que `REACT_APP_ADMIN_DELETE_TOKEN` en tu `.env` coincida con `ADMIN_DELETE_TOKEN` en el worker

### Error: "Origin not allowed"
- Agrega tu dominio a `ALLOWED_ORIGINS` en `src/index.js`
- Para desarrollo local, ya están incluidos `localhost:3000` y `localhost:3001`

### Error: "Usuario no encontrado en Firebase Authentication"
- Esto es normal para usuarios fantasma o que ya fueron eliminados de Auth
- La función continúa y elimina los datos de la base de datos

### Error: "FIREBASE_SERVICE_ACCOUNT_KEY no está configurada"
- Ejecuta `npm run setup-admin-secrets` para configurar los secretos
- Verifica que la clave de servicio sea válida

## 📝 Logs

Para ver los logs del worker en tiempo real:

```bash
wrangler tail
```

## 🚀 Testing

Puedes probar el endpoint directamente:

```bash
curl -X POST https://tu-worker.workers.dev/admin/delete-user \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"userId":"test-user-id","adminToken":"tu-token"}'
```

---

**⚠️ Nota**: Esta funcionalidad es para administradores únicamente. La eliminación de usuarios es irreversible.
