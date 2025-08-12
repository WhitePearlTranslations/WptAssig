# Configuración de Cloudflare Workers para WPT

Este documento explica cómo configurar Cloudflare Workers para manejar las API keys de Firebase de forma segura.

## 🎯 ¿Por qué usar Cloudflare Workers?

- **Seguridad**: Las API keys se mantienen en el servidor, no en el código del frontend
- **Control de acceso**: Solo dominios autorizados pueden acceder a la configuración
- **Performance**: Cache integrado y distribución global
- **Costo**: Plan gratuito generoso (100,000 requests/día)

## 📋 Prerrequisitos

1. Cuenta de Cloudflare (gratuita)
2. Node.js instalado
3. CLI de Wrangler

## 🚀 Paso 1: Instalar Wrangler

```bash
npm install -g wrangler
```

## 🔐 Paso 2: Configurar Cloudflare

1. **Crear cuenta en Cloudflare** (si no tienes una)
   - Ve a [cloudflare.com](https://cloudflare.com)
   - Registra tu cuenta gratuita

2. **Obtener tu Account ID**
   - Ve a tu dashboard de Cloudflare
   - Copia tu Account ID del panel derecho

3. **Autenticar Wrangler**
   ```bash
   wrangler login
   ```
   - Se abrirá tu navegador para autorizar

## ⚡ Paso 3: Configurar el Worker

1. **Navegar al directorio del worker**
   ```bash
   cd cloudflare-worker
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Actualizar configuración**
   - Edita `wrangler.toml`
   - Reemplaza `your-domain` con tu dominio real
   - Actualiza el nombre del worker si deseas

4. **Configurar secretos desde el .env existente**
   ```bash
   npm run setup-secrets
   ```
   
   Este comando:
   - Lee tu archivo .env actual
   - Configura todos los secretos en Cloudflare automáticamente
   - Te mostrará un resumen del proceso

## 🌐 Paso 4: Desplegar el Worker

```bash
npm run deploy
```

Después del despliegue, obtendrás una URL como:
```
https://wpt-config-api.your-account.workers.dev
```

## 🔧 Paso 5: Configurar la aplicación React

1. **Actualizar la URL del Worker**
   - Copia `.env.cloudflare` a `.env.local`
   - Reemplaza `your-account` con tu Account ID real

2. **Verificar dominios permitidos**
   - Edita `cloudflare-worker/src/index.js`
   - Actualiza `ALLOWED_ORIGINS` con tus dominios reales

3. **Probar la configuración**
   ```bash
   npm start
   ```

## 🧪 Paso 6: Verificar que funciona

1. **Health Check**
   ```bash
   curl https://wpt-config-api.your-account.workers.dev/health
   ```

2. **Configuración Firebase**
   ```bash
   curl -H "Origin: http://localhost:3000" https://wpt-config-api.your-account.workers.dev/firebase-config
   ```

3. **En el navegador**
   - Abre las DevTools (F12)
   - Ve a Console
   - Busca mensajes de Firebase iniciándose

## 🔒 Seguridad

### Dominios Permitidos
El Worker solo responde a estos orígenes:
- `http://localhost:3000` (desarrollo)
- `http://localhost:3001` (desarrollo)
- Tu dominio de producción

### Variables Secretas
Todas las API keys se almacenan como secretos de Cloudflare:
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_DATABASE_URL`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

## 🛠️ Comandos Útiles

```bash
# Ver secretos configurados
wrangler secret list

# Eliminar un secreto
wrangler secret delete NOMBRE_SECRETO

# Ver logs en tiempo real
wrangler tail

# Desarrollo local
npm run dev

# Desplegar cambios
npm run deploy
```

## 🐛 Solución de Problemas

### Error: "Origin not allowed"
- Verifica que tu dominio esté en `ALLOWED_ORIGINS`
- Redespliega el Worker después de cambios

### Error: "Server configuration error"
- Verifica que todos los secretos estén configurados
- Ejecuta `wrangler secret list`

### Error de CORS
- Verifica que el origen sea correcto
- Revisa las DevTools para detalles

### Worker no responde
- Verifica la URL del Worker
- Checa el estado en el dashboard de Cloudflare

## 🔄 Actualizaciones

Para actualizar secretos:
```bash
cd cloudflare-worker
npm run setup-secrets  # Re-configura desde .env
npm run deploy         # Despliega cambios
```

## 📊 Monitoreo

En el dashboard de Cloudflare puedes ver:
- Número de requests
- Errores y logs
- Performance metrics
- Uso de recursos

## 🎉 ¡Listo!

Tu aplicación ahora usa Cloudflare Workers para gestionar las API keys de forma segura. Las ventajas incluyen:

- ✅ API keys no expuestas en el código frontend
- ✅ Control de acceso por dominio
- ✅ Cache automático para mejor performance  
- ✅ Distribución global con Cloudflare
- ✅ Plan gratuito generoso
