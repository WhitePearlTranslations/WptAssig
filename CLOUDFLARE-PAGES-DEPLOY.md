# 🚀 Deployment en Cloudflare Pages

Esta guía te ayuda a desplegar el proyecto WPT Asignaciones en Cloudflare Pages.

## 📋 Prerrequisitos

1. **Cuenta de Cloudflare** (gratuita)
2. **Repositorio GitHub** configurado
3. **Firebase** configurado (ver README.md principal)

## 🔧 Configuración de Cloudflare Pages

### 1. Crear un nuevo sitio

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Selecciona "Pages" en el menú lateral
3. Haz clic en "Create a project"
4. Conecta tu repositorio GitHub: `https://github.com/WhitePearlTranslations/WptAssig.git`

### 2. Configuración de Build

**Framework preset:** `Create React App`

**Build settings:**
- **Build command:** `npm run build`
- **Build output directory:** `build`
- **Root directory:** `/` (dejar vacío)

### 3. Variables de Entorno

En la sección "Environment variables", agrega las siguientes variables:

```
NODE_VERSION=18
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://tu_proyecto.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto_id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id
REACT_APP_CONFIG_MODE=production
```

> ⚠️ **Importante**: Nunca commitees estas variables al repositorio. Configúralas solo en el panel de Cloudflare Pages.

### 4. Configuración de Dominio Personalizado (Opcional)

1. En el panel de tu proyecto en Cloudflare Pages
2. Ve a "Custom domains"
3. Agrega tu dominio personalizado
4. Configura los registros DNS según las instrucciones

## 🛡️ Configuración de Seguridad

El proyecto incluye archivos de configuración para Cloudflare Pages:

- **`public/_headers`**: Headers de seguridad y cache
- **`public/_redirects`**: Redireccionamiento para SPA

### Headers de Seguridad Incluidos

- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection
- ✅ X-Content-Type-Options
- ✅ Content Security Policy
- ✅ Cache Control optimizado

## 🔄 Process de Deploy

### Deploy Automático

1. **Push a GitHub**: Cada push a `master` despliega automáticamente
2. **Preview Deploys**: Los PRs crean deploys de preview
3. **Rollback**: Fácil rollback a versiones anteriores

### Deploy Manual

```bash
# 1. Build local
npm run build

# 2. Subir a GitHub
git add .
git commit -m "Deploy: preparado para Cloudflare Pages"
git push origin master
```

## 🌐 Integración con Cloudflare Worker (Opcional)

Si usas el Cloudflare Worker para las API keys:

### 1. Desplegar el Worker

```bash
cd cloudflare-worker
npm run deploy
```

### 2. Actualizar la configuración

En las variables de entorno de Cloudflare Pages:

```
REACT_APP_WORKER_URL=https://wpt-config-api.tu-account.workers.dev
REACT_APP_CONFIG_MODE=cloudflare-worker
```

### 3. Actualizar dominios permitidos

En `cloudflare-worker/src/index.js`, agrega tu dominio de producción:

```javascript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://tu-dominio-de-produccion.com',
  'https://tu-proyecto.pages.dev'
];
```

## 📊 Monitoreo y Analytics

### Cloudflare Analytics

- **Traffic Analytics**: Visitas, países, dispositivos
- **Performance**: Core Web Vitals, speed insights
- **Security**: Ataques bloqueados, bots

### Acceso a Logs

```bash
# Logs del Worker (si lo usas)
cd cloudflare-worker
wrangler tail
```

## 🐛 Solución de Problemas

### Error de Build

```
Error: Module not found
```
**Solución**: Verifica que todas las dependencias estén en `package.json`

### Error de Variables de Entorno

```
Firebase configuration error
```
**Solución**: Verifica que todas las variables `REACT_APP_FIREBASE_*` estén configuradas en Cloudflare Pages

### Error de CORS

```
CORS policy blocked
```
**Solución**: 
1. Si usas Worker: Verifica que tu dominio esté en `ALLOWED_ORIGINS`
2. Si no: Verifica la configuración de Firebase

### Rutas no funcionan

```
404 Not Found en rutas de React
```
**Solución**: Verifica que `public/_redirects` esté presente y configurado correctamente

## 🚀 Performance Tips

### 1. Optimización de Bundle

```bash
# Analizar el bundle
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

### 2. Code Splitting

Ya implementado con React Router lazy loading:

```javascript
const LazyComponent = lazy(() => import('./Component'));
```

### 3. Cache Strategy

El archivo `_headers` incluye configuración de cache optimizada:
- **Static assets**: Cache de 1 año
- **Service worker**: Sin cache
- **HTML**: Cache controlado por CF

## 📈 Scaling

### Límites del Plan Gratuito

- **Requests**: 100k/month
- **Bandwidth**: Ilimitado
- **Build time**: 500 minutos/mes
- **Sites**: 1 por cuenta

### Upgrade a Pro

Para proyectos más grandes:
- **Requests**: Ilimitados
- **Build time**: 5000 minutos/mes
- **Advanced analytics**
- **Priority support**

## 🎉 ¡Deploy Exitoso!

Tu aplicación estará disponible en:
- `https://tu-proyecto.pages.dev` (dominio por defecto)
- Tu dominio personalizado (si lo configuras)

### Verificación Post-Deploy

1. ✅ La aplicación carga correctamente
2. ✅ Firebase se conecta sin errores
3. ✅ Las rutas funcionan (refresh en cualquier página)
4. ✅ Los headers de seguridad están activos
5. ✅ Performance score > 90 en Lighthouse

## 📞 Soporte

- **Cloudflare Docs**: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)
- **Community**: [community.cloudflare.com](https://community.cloudflare.com)
- **Issues**: Crear issue en este repositorio
