# 🔥 Configuración de Firebase para Producción

## ⚠️ CONFIGURACIÓN REQUERIDA DESPUÉS DEL DEPLOYMENT

Tu app ya está desplegada en: `https://c9a6aaae.wptassigment.pages.dev`

Pero necesitas configurar Firebase Console para que funcione correctamente.

## 🔧 Paso 1: Autorizar Dominio en Firebase Console

1. **Ve a [Firebase Console](https://console.firebase.google.com/)**
2. **Selecciona tu proyecto**: `wptasignacion`
3. **Ve a Authentication → Settings**
4. **Scroll down hasta "Authorized domains"**
5. **Click "Add domain"**
6. **Agregar**: `c9a6aaae.wptassigment.pages.dev`
7. **Save**

## 🌐 Paso 2: Configurar Variables de Entorno en Cloudflare Pages

Ve a tu proyecto en Cloudflare Pages y agrega estas variables:

### Variables de Firebase (CRÍTICAS):
```bash
REACT_APP_FIREBASE_API_KEY=AIzaSyChIT75G_dG-31ATjI3_TC0rBC5OMlfj74
REACT_APP_FIREBASE_AUTH_DOMAIN=wptasignacion.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://wptasignacion-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=wptasignacion
REACT_APP_FIREBASE_STORAGE_BUCKET=wptasignacion.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=73710953060
REACT_APP_FIREBASE_APP_ID=1:73710953060:web:e0c529b782b6eb8eab7571
REACT_APP_CONFIG_MODE=production
```

### Variables de Build (YA CONFIGURADAS):
```bash
NODE_VERSION=18
DISABLE_ESLINT_PLUGIN=true
CI=false
```

## 📋 Paso 3: Cómo Configurar Variables en Cloudflare Pages

1. **Ve a [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)**
2. **Selecciona tu proyecto** (WptAssig)
3. **Settings → Environment variables**
4. **Production → Add variable**
5. **Agrega cada variable una por una**:
   - Name: `REACT_APP_FIREBASE_API_KEY`
   - Value: `AIzaSyChIT75G_dG-31ATjI3_TC0rBC5OMlfj74`
   - Click "Add variable"
6. **Repite para todas las variables**
7. **Redeploy** después de agregar todas las variables

## 🚀 Paso 4: Redeploy

Después de configurar las variables:

1. **Ve a Deployments**
2. **Click "Retry deployment"** en el último deployment
3. **O haz un nuevo commit al repositorio**

## ✅ Paso 5: Verificar que Funciona

Después del redeploy:

1. **Ve a tu sitio**: `https://c9a6aaae.wptassigment.pages.dev`
2. **Abre DevTools (F12)**
3. **Ve a Console**
4. **No deberías ver**:
   - "Usando fallback a variables de entorno locales"
   - Errores de Content Security Policy
   - Errores de OAuth operations

## 🔐 Paso 6: Crear Usuario Administrador

Una vez que la autenticación funcione:

1. **Registra un usuario** desde la interfaz
2. **Ve a Firebase Console → Realtime Database**
3. **Ve a la sección `users`**
4. **Encuentra tu usuario recién creado**
5. **Edita el campo `role`** de `"user"` a `"admin"`
6. **Save**

## 🏠 URLs Importantes

- **Tu app**: https://c9a6aaae.wptassigment.pages.dev
- **Firebase Console**: https://console.firebase.google.com/project/wptasignacion
- **Cloudflare Pages**: https://dash.cloudflare.com/

## 🆘 Troubleshooting

### Si sigues viendo "fallback a variables locales":
- ✅ Verificar que todas las variables `REACT_APP_FIREBASE_*` estén configuradas
- ✅ Redeploy después de agregar variables
- ✅ Revisar que los nombres de las variables estén correctos (case-sensitive)

### Si el login no funciona:
- ✅ Verificar que el dominio esté en "Authorized domains" de Firebase
- ✅ Verificar que Authentication esté habilitado
- ✅ Verificar que Email/Password provider esté habilitado

### Si hay errores de CSP:
- ✅ El archivo `_headers` ya fue actualizado para incluir `identitytoolkit.googleapis.com`
- ✅ Debería resolverse con el próximo deployment

## 🎉 ¡Éxito!

Una vez completados estos pasos, tu sistema de asignaciones debería funcionar perfectamente en producción.

**¡Tu equipo ya puede empezar a usar el sistema!** 📚✨
