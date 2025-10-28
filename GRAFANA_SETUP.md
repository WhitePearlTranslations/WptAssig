# Configuración de Observabilidad con Grafana Cloud

Esta guía te ayudará a configurar el monitoreo completo de tu aplicación WPTAsignation con Grafana Cloud.

## 📊 Arquitectura de Observabilidad

```
┌─────────────────────────────────────────────────────────────────┐
│                      GRAFANA CLOUD                              │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Grafana    │  │    Tempo     │  │    Mimir     │        │
│  │ (Dashboards) │  │   (Traces)   │  │  (Metrics)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         ▲                 ▲                  ▲                  │
└─────────┼─────────────────┼──────────────────┼─────────────────┘
          │                 │                  │
          │                 │                  │
    ┌─────┴─────────────────┴──────────────────┴────────┐
    │                                                    │
    │  Frontend (React)        Backend (CF Worker)      │
    │  ┌──────────────┐       ┌──────────────┐         │
    │  │ Grafana Faro │       │ OpenTelemetry│         │
    │  │  - Sessions  │       │  - Traces    │         │
    │  │  - Errors    │       │  - Metrics   │         │
    │  │  - WebVitals │       │  - Logs      │         │
    │  └──────────────┘       └──────────────┘         │
    │         │                       │                 │
    │         └───────────┬───────────┘                 │
    │                     │                             │
    │              ┌──────▼──────┐                      │
    │              │  Firestore  │                      │
    │              │  (Metrics)  │                      │
    │              └─────────────┘                      │
    │                                                    │
    └────────────────────────────────────────────────────┘
```

## 🚀 Paso 1: Crear cuenta en Grafana Cloud

1. Ve a https://grafana.com/
2. Crea una cuenta gratuita (incluye 10k series métricas, 50GB traces)
3. Crea un nuevo stack (selecciona región más cercana)

## 🔑 Paso 2: Obtener credenciales

### 2.1 API Key de Grafana Cloud

1. En Grafana Cloud, ve a **Connections** → **API Keys**
2. Crea un nuevo API Key con los siguientes permisos:
   - `MetricsPublisher`
   - `TracesPublisher`
3. Copia el token generado (solo se muestra una vez)

### 2.2 URLs de endpoints

En tu stack de Grafana Cloud, encontrarás:

**Prometheus (Mimir):**
```
https://prometheus-prod-XX-prod-XX-XXX.grafana.net/api/prom/push
```

**Tempo (Traces):**
```
https://tempo-prod-XX-prod-XX-XXX.grafana.net/otlp/v1/traces
```

**Faro (Frontend):**
```
https://faro-collector-prod-XX-XXX.grafana.net/collect/<INSTANCE_ID>
```

## 🔧 Paso 3: Configurar Frontend

### 3.1 Variables de entorno

Crea o actualiza `.env.local`:

```bash
# Grafana Faro
REACT_APP_FARO_COLLECTOR_URL=https://faro-collector-prod-us-east-0.grafana.net/collect/YOUR_INSTANCE_ID
REACT_APP_ENABLE_FARO=true
REACT_APP_VERSION=1.0.0
```

### 3.2 Obtener el Instance ID de Faro

1. En Grafana Cloud, ve a **Frontend Observability**
2. Crea una nueva aplicación: **"WPTAsignation"**
3. Copia el `INSTANCE_ID` del snippet de configuración

### 3.3 Verificar instalación

El proyecto ya tiene Faro configurado en `src/lib/observability.js`. Solo necesitas las variables de entorno.

## ⚙️ Paso 4: Configurar Cloudflare Worker

### 4.1 Configurar secrets

```bash
cd cloudflare-worker

# API Key de Grafana Cloud
wrangler secret put GRAFANA_CLOUD_API_KEY
# Pega el token cuando te lo pida

# URL de Mimir (Prometheus)
wrangler secret put GRAFANA_MIMIR_URL
# Pega la URL de Remote Write

# URL de Tempo (Traces)
wrangler secret put GRAFANA_TEMPO_URL
# Pega la URL de OTLP
```

### 4.2 Configurar Cron Trigger (opcional)

Edita `cloudflare-worker/wrangler.toml` y agrega:

```toml
[triggers]
crons = ["*/1 * * * *"]  # Enviar métricas cada minuto
```

### 4.3 Desplegar

```bash
npm run deploy
```

## 📈 Paso 5: Crear Dashboard en Grafana

### 5.1 Importar dashboard base

1. En Grafana, ve a **Dashboards** → **Import**
2. Usa el siguiente JSON para crear el dashboard:

```json
{
  "title": "WPTAsignation - Observabilidad",
  "panels": [
    {
      "title": "Request Rate (Worker)",
      "targets": [
        {
          "expr": "rate(wpt_worker_requests_total[5m])"
        }
      ]
    },
    {
      "title": "Error Rate",
      "targets": [
        {
          "expr": "wpt_worker_error_rate"
        }
      ]
    },
    {
      "title": "Response Time P95",
      "targets": [
        {
          "expr": "wpt_worker_duration_p95_ms"
        }
      ]
    },
    {
      "title": "Firestore Operations",
      "targets": [
        {
          "expr": "sum by (operation) (rate(firestore_operations[5m]))"
        }
      ]
    }
  ]
}
```

### 5.2 Métricas disponibles

**Worker (Backend):**
- `wpt_worker_requests_total` - Total de requests
- `wpt_worker_errors_total` - Total de errores
- `wpt_worker_error_rate` - Tasa de error (%)
- `wpt_worker_duration_avg_ms` - Duración promedio
- `wpt_worker_duration_p95_ms` - Percentil 95
- `wpt_worker_duration_p99_ms` - Percentil 99
- `wpt_worker_requests_by_status{status_code}` - Requests por código HTTP
- `wpt_worker_endpoint_requests{endpoint}` - Requests por endpoint
- `wpt_worker_endpoint_errors{endpoint}` - Errores por endpoint

**Frontend (Faro):**
- Automáticamente captura:
  - Core Web Vitals (LCP, FID, CLS)
  - Errores de JavaScript
  - Métricas de sesión
  - Logs de consola
  - Performance marks

**Firestore:**
- Eventos personalizados en Faro:
  - `firestore_read` - Lecturas
  - `firestore_write` - Escrituras
  - `firestore_query` - Queries
  - `firestore_delete` - Eliminaciones
  - `firestore_error` - Errores

## 🔍 Paso 6: Explorar Traces

### 6.1 Traces distribuidos

Los traces incluyen:
- Request ID único (`X-Trace-Id` header)
- Span ID por operación
- Contexto de propagación W3C

### 6.2 Buscar traces en Grafana

1. Ve a **Explore**
2. Selecciona **Tempo** como datasource
3. Busca por:
   - `http.status_code = 500` (errores)
   - `http.url =~ "/firebase-config"` (endpoint específico)
   - `duration > 1s` (requests lentos)

## 📊 Paso 7: Paneles recomendados

### Panel 1: Salud del Sistema
- Uptime del worker
- Request rate
- Error rate
- Latencia P50/P95/P99

### Panel 2: APIs
- Requests por endpoint
- Latencia por endpoint
- Errores por endpoint
- Distribución de códigos HTTP

### Panel 3: Base de Datos (Firestore)
- Operaciones por tipo (read/write/query)
- Latencia de operaciones
- Errores de Firestore
- Documentos leídos/escritos

### Panel 4: Frontend
- Core Web Vitals
- Errores de JavaScript
- Usuarios activos
- Sesiones por página

### Panel 5: Traces
- Top 10 traces más lentos
- Errores por servicio
- Distribución de latencia

## 🧪 Paso 8: Verificar instrumentación

### 8.1 Verificar Worker

```bash
# Ver métricas en vivo
curl https://YOUR-WORKER.workers.dev/metrics

# Ver health check
curl https://YOUR-WORKER.workers.dev/health
```

### 8.2 Verificar Frontend

1. Abre la consola del navegador
2. Deberías ver: `✅ Faro observability initialized`
3. Navega por la app, las métricas se envían automáticamente

### 8.3 Usar wrappers de Firestore

Para instrumentar operaciones de Firestore, usa los wrappers:

```javascript
import { 
  instrumentedGet, 
  instrumentedWrite, 
  instrumentedQuery,
  instrumentedOnSnapshot 
} from './lib/firestoreMetrics';

// En lugar de:
// const doc = await db.collection('users').doc(userId).get();

// Usa:
const doc = await instrumentedGet(db.collection('users').doc(userId), 'get-user');

// Queries:
const snapshot = await instrumentedQuery(
  db.collection('assignments').where('status', '==', 'active'),
  'active-assignments'
);

// Listeners:
const unsubscribe = instrumentedOnSnapshot(
  db.collection('users').doc(userId),
  (snapshot) => { /* handler */ },
  (error) => { /* error handler */ },
  'user-listener'
);
```

## 🎯 Paso 9: Alertas (Opcional)

### 9.1 Alertas recomendadas

1. **Error Rate > 5%**
   ```promql
   wpt_worker_error_rate > 5
   ```

2. **Latencia P95 > 2s**
   ```promql
   wpt_worker_duration_p95_ms > 2000
   ```

3. **Firestore Errors**
   ```
   count(firestore_error) > 10
   ```

### 9.2 Configurar notificaciones

1. Ve a **Alerting** → **Contact points**
2. Agrega tu email o Slack webhook
3. Crea reglas de alerta con las queries anteriores

## 📚 Recursos adicionales

- [Grafana Faro Docs](https://grafana.com/docs/grafana-cloud/faro-web-sdk/)
- [OpenTelemetry](https://opentelemetry.io/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

## 🆘 Troubleshooting

### No veo métricas en Grafana

1. Verifica que el API Key tenga los permisos correctos
2. Revisa los logs del worker: `wrangler tail`
3. Verifica las URLs de endpoints
4. Confirma que las variables estén configuradas: `wrangler secret list`

### Faro no envía datos

1. Verifica `REACT_APP_FARO_COLLECTOR_URL` en `.env.local`
2. Abre DevTools → Network y busca requests a `grafana.net`
3. Verifica CORS en la configuración de Faro

### Traces no aparecen en Tempo

1. Verifica formato OTLP en `instrumentation.js`
2. Confirma que `GRAFANA_TEMPO_URL` incluya `/otlp/v1/traces`
3. Revisa autenticación del API Key

## ✅ Checklist final

- [ ] Cuenta de Grafana Cloud creada
- [ ] API Key generado con permisos correctos
- [ ] URLs de endpoints obtenidas
- [ ] Variables de frontend configuradas
- [ ] Secrets de Cloudflare Worker configurados
- [ ] Worker desplegado
- [ ] Dashboard creado en Grafana
- [ ] Métricas visibles en Grafana
- [ ] Traces visibles en Tempo
- [ ] Eventos de Faro visibles en Frontend Observability

---

¡Listo! Ahora tienes observabilidad completa de tu aplicación. 🎉
