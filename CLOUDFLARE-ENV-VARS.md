# 🌐 Variables de Entorno para Cloudflare Pages

## ⚠️ CRÍTICO: Variables Obligatorias

Para que el build funcione correctamente en Cloudflare Pages, **debes configurar estas variables**:

### 🛠️ Variables de Build (CRÍTICAS)
```bash
NODE_VERSION=18
DISABLE_ESLINT_PLUGIN=true
CI=false
```

### 🔥 Variables de Firebase (Tu configuración)
```bash
REACT_APP_FIREBASE_API_KEY=tu_api_key_aqui
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://tu_proyecto.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto_id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id
```

### 🎯 Variables de Aplicación
```bash
REACT_APP_CONFIG_MODE=production
```

## 📋 Cómo Configurar en Cloudflare Pages

1. **Ve a tu proyecto en Cloudflare Pages**
2. **Settings** → **Environment variables**
3. **Add variable** para cada una de las arriba
4. **Save** después de cada variable

## ⚡ Variables Explicadas

| Variable | Propósito | Valor |
|----------|-----------|-------|
| `NODE_VERSION` | Especifica Node.js 18 | `18` |
| `DISABLE_ESLINT_PLUGIN` | **CRÍTICO**: Evita que ESLint falle el build | `true` |
| `CI` | **CRÍTICO**: Deshabilita modo CI estricto | `false` |
| `REACT_APP_FIREBASE_*` | Configuración de tu proyecto Firebase | *Tus valores* |
| `REACT_APP_CONFIG_MODE` | Modo de configuración de la app | `production` |

## 🚨 Sin estas variables, el build FALLARÁ

Si no configuras `DISABLE_ESLINT_PLUGIN=true` y `CI=false`, verás este error:

```
Failed to compile.
[eslint] 
Treating warnings as errors because process.env.CI = true
```

## ✅ Verificación

Después de configurar las variables:

1. **Redeploy** tu sitio en Cloudflare Pages
2. **Check build logs** - debería decir "Compiled successfully"
3. **Test your site** - debería cargar sin errores

## 🔧 Variables Opcionales

```bash
# Solo si usas Cloudflare Worker para API keys
REACT_APP_WORKER_URL=https://wpt-config-api.tu-account.workers.dev
REACT_APP_CONFIG_MODE=cloudflare-worker

# Optimizaciones adicionales
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
```

## 🆘 Troubleshooting

**Si el build sigue fallando:**

1. ✅ Verificar que `DISABLE_ESLINT_PLUGIN=true` esté configurado
2. ✅ Verificar que `CI=false` esté configurado  
3. ✅ Verificar que `NODE_VERSION=18` esté configurado
4. ✅ Redeploy después de cambios en variables
5. ✅ Revisar build logs en Cloudflare Pages dashboard

**¡Con estas variables configuradas correctamente, tu deployment debería ser exitoso!** 🎉
