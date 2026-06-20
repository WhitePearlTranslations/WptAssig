# 📊 Guía de Tracing con Child Spans

Sistema completo de observabilidad con **child spans** (spans hijos) para rastrear operaciones internas tanto en el **Worker (Backend)** como en el **Frontend (Faro)**.

## 🎯 ¿Qué son los Child Spans?

Los **child spans** son sub-operaciones dentro de un trace principal que permiten:
- Ver el desglose temporal de cada operación
- Identificar cuellos de botella específicos
- Entender la secuencia de ejecución
- Medir performance de operaciones individuales

## 🔧 Worker (Backend) - Child Spans Automáticos

### Spans Creados Automáticamente

Cada request al Worker genera **4 spans** en este orden:

```
📊 GET /firebase-config (ROOT SPAN)
├── 🔍 parse-request (0.5ms)
├── ⚙️ execute-handler (15.2ms)
└── 📈 collect-metrics (0.3ms)
```

### Atributos de cada span:

**Root Span:**
- `http.method`: GET, POST, etc.
- `http.url`: URL completa
- `http.status_code`: 200, 404, etc.
- `http.duration_ms`: Duración total

**parse-request:**
- `http.method`: Método HTTP
- `http.has_body`: 'with-body' o 'no-body'

**execute-handler:**
- `handler.endpoint`: Ruta del endpoint
- `handler.status`: Status code de respuesta

**collect-metrics:**
- `metrics.endpoint`: Endpoint procesado
- `metrics.duration_ms`: Duración de la request

## 🌐 Frontend (Faro) - Child Spans Manuales

### 1. Operaciones de Firebase con Tracing

Usa los wrappers traced en lugar de las funciones normales:

```javascript
// ❌ ANTES (sin tracing)
import { ref, get } from 'firebase/database';
const snapshot = await get(ref(database, '/users'));

// ✅ AHORA (con child spans)
import { tracedGet } from '../lib/tracedFirebase';
const snapshot = await tracedGet(database, '/users');
```

**Funciones disponibles:**
- `tracedGet(database, path)` → Crea span `firebase.get`
- `tracedSet(database, path, data)` → Crea span `firebase.set`
- `tracedUpdate(database, path, updates)` → Crea span `firebase.update`
- `tracedRemove(database, path)` → Crea span `firebase.remove`
- `tracedPush(database, path, data)` → Crea span `firebase.push`
- `tracedOnValue(database, path, callback)` → Crea span `firebase.onValue`

### 2. Operaciones Asíncronas Genéricas

Para cualquier operación asíncrona:

```javascript
import { traceAsyncOperation } from '../lib/observability';

async function processData() {
  return traceAsyncOperation(
    'process-user-data',
    async () => {
      // Tu lógica aquí
      const result = await someHeavyOperation();
      return result;
    },
    {
      'operation.type': 'data-processing',
      'user.count': 100,
    }
  );
}
```

### 3. Operaciones de API/Fetch

Para llamadas HTTP:

```javascript
import { traceFetchOperation } from '../lib/observability';

async function fetchConfig() {
  return traceFetchOperation(
    'https://api.example.com/config',
    async () => {
      const response = await fetch('https://api.example.com/config');
      return response.json();
    },
    'GET'
  );
}
```

### 4. Spans Manuales Avanzados

Para control total:

```javascript
import { createSpan } from '../lib/observability';

async function complexOperation() {
  const span = createSpan('complex-calculation', {
    'input.size': 1000,
    'algorithm': 'quicksort',
  });

  try {
    // Agregar eventos durante la operación
    span.addEvent('validation-start');
    
    const validated = await validateData();
    
    span.addEvent('validation-complete', {
      'valid.count': validated.length,
    });

    // Operación principal
    const result = await calculate(validated);

    // Finalizar con éxito
    span.end({
      'result.size': result.length,
      'operation.success': true,
    });

    return result;
  } catch (error) {
    // Marcar como error
    span.setStatus(2, error.message); // 2 = ERROR
    span.end({
      'error.message': error.message,
      'operation.success': false,
    });
    throw error;
  }
}
```

## 📈 Ejemplo Completo: Login Flow

```javascript
import { traceAsyncOperation, createSpan } from '../lib/observability';
import { tracedGet, tracedUpdate } from '../lib/tracedFirebase';

async function handleLogin(email, password) {
  // Span principal (automático por Faro)
  return traceAsyncOperation(
    'user-login',
    async () => {
      // Child span 1: Validación
      const validationSpan = createSpan('validate-credentials');
      const isValid = await validateCredentials(email, password);
      validationSpan.end({ 'credentials.valid': isValid });

      if (!isValid) throw new Error('Invalid credentials');

      // Child span 2: Firebase Auth
      const authSpan = createSpan('firebase-auth');
      const user = await signInWithEmailAndPassword(auth, email, password);
      authSpan.end({ 'user.id': user.uid });

      // Child span 3: Cargar perfil (con tracedGet)
      const profile = await tracedGet(database, `/users/${user.uid}`);

      // Child span 4: Actualizar último login (con tracedUpdate)
      await tracedUpdate(database, `/users/${user.uid}`, {
        lastLogin: Date.now(),
      });

      return { user, profile };
    },
    {
      'auth.method': 'email-password',
      'user.email': email,
    }
  );
}
```

## 🔍 Visualización en Grafana

### Trace con Child Spans:

```
📊 WPTAssig: user-login (250ms)
├── 🔍 validate-credentials (5ms)
├── 🔐 firebase-auth (120ms)
├── 📖 firebase.get (80ms)
│   └── /users/abc123
└── 📝 firebase.update (45ms)
    └── /users/abc123
```

### Query en Tempo:

```traceql
{resource.service.name="WPTAssig"} | duration > 100ms
```

## ✅ Best Practices

1. **Nombra spans descriptivamente**: Usa verbos de acción
   - ✅ `load-user-profile`
   - ❌ `function1`

2. **Agrega atributos útiles**: Datos que ayuden a debugging
   ```javascript
   {
     'user.id': userId,
     'operation.type': 'read',
     'data.size': records.length,
   }
   ```

3. **No traces en exceso**: Solo operaciones significativas (>1ms)

4. **Maneja errores**: Siempre marca spans con error cuando fallen

5. **Usa helpers predefinidos**: `tracedGet`, `traceFetchOperation`, etc.

## 📊 Métricas Automáticas

Además de traces, el sistema captura automáticamente:

### Worker:
- `wpt_worker_requests_total`
- `wpt_worker_duration_avg_ms`
- `wpt_worker_duration_p95_ms`
- `wpt_worker_endpoint_requests`

### Frontend (Faro):
- Page views
- User sessions
- Frontend errors
- Web vitals (LCP, FID, CLS)
- XHR/Fetch automático

## 🎯 Para la Demo

Muestra estos flujos con child spans:

1. **Login completo** - 4-5 spans mostrando auth flow
2. **Crear asignación** - Múltiples Firebase operations
3. **Carga de dashboard** - Fetch + Firebase + Rendering
4. **Upload de archivo** - ImageKit + Firebase + Validación

Cada uno debe mostrar el **waterfall** de operaciones en Grafana.
