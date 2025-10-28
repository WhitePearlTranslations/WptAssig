# Configuración con Grafana Alloy

Grafana Alloy actúa como intermediario local que recolecta métricas, logs y traces, y los envía a Grafana Cloud.

## ✅ Ventajas de usar Alloy

- **Un solo punto de configuración**: Solo configuras credenciales en Alloy
- **Métricas unificadas**: Frontend, Backend y DB en un solo lugar
- **Scraping automático**: Alloy hace scraping del endpoint `/metrics` del Worker
- **Buffer local**: Si pierdes conexión, Alloy mantiene datos en buffer
- **Procesamiento**: Puedes filtrar, transformar y agregar datos antes de enviar

## 📦 1. Instalar Grafana Alloy

### Windows (Scoop)
```powershell
scoop install alloy
```

### Windows (Manual)
1. Descarga desde: https://github.com/grafana/alloy/releases
2. Descomprime y agrega al PATH
3. Verifica: `alloy --version`

### Linux/Mac
```bash
# Linux
curl -O -L "https://github.com/grafana/alloy/releases/latest/download/alloy-linux-amd64.zip"
unzip alloy-linux-amd64.zip
sudo mv alloy-linux-amd64 /usr/local/bin/alloy

# Mac
brew install grafana/grafana/alloy
```

## 🔑 2. Obtener credenciales de Grafana Cloud

Ve a tu stack en Grafana Cloud:

### A. Instance ID (Stack ID)
1. Ve a tu stack en Grafana Cloud
2. En la URL verás algo como: `https://xxxxx.grafana.net`
3. El número antes de `.grafana.net` es tu Instance ID

### B. API Key
1. En tu stack, ve a **Connections** → **Add new connection** → **Hosted Grafana metrics**
2. O ve directo a: `https://grafana.com/profile/api-keys`
3. Crea un token con permisos: `MetricsPublisher`, `TracesPublisher`, `LogsPublisher`
4. Copia el token

### C. URLs de endpoints

En **Connections** → **Data sources**:

**Prometheus (Métricas):**
```
https://prometheus-prod-XX-prod-XX-XXX.grafana.net/api/prom/push
```

**Tempo (Traces):**
```
tempo-prod-XX-prod-XX-XXX.grafana.net:443
```

**Loki (Logs):**
```
https://logs-prod-XXX.grafana.net/loki/api/v1/push
```

## ⚙️ 3. Configurar Alloy

### A. Crear archivo con el token

```powershell
# En la raíz del proyecto
echo "tu_api_key_aqui" > grafana-token.txt
```

**⚠️ Importante:** Agrega `grafana-token.txt` a `.gitignore`

### B. Editar `alloy-config.alloy`

Reemplaza estos valores en el archivo:

```alloy
// Línea 58: URL de Prometheus
url = "https://prometheus-prod-XX-prod-XX-XXX.grafana.net/api/prom/push"

// Línea 62: Tu Instance ID
username = "123456"  // Reemplaza con tu Instance ID

// Línea 100: URL de Tempo (sin https://)
endpoint = "tempo-prod-XX-prod-XX-XXX.grafana.net:443"

// Línea 113: Tu Instance ID (de nuevo)
username = "123456"

// Línea 141: URL de Loki
url = "https://logs-prod-XXX.grafana.net/loki/api/v1/push"

// Línea 144: Tu Instance ID (de nuevo)
username = "123456"
```

## 🚀 4. Ejecutar todo

### Terminal 1: Alloy
```powershell
cd E:\PaginaAsignacion\WPTAsignation
alloy run alloy-config.alloy
```

Deberías ver:
```
ts=... level=info msg="starting Alloy"
ts=... level=info component=prometheus.scrape.worker_metrics msg="scrape pool started"
ts=... level=info component=otelcol.receiver.otlp msg="Starting OTLP receiver"
```

### Terminal 2: Cloudflare Worker
```powershell
cd cloudflare-worker
npm run dev
```

Worker en: http://localhost:8787

### Terminal 3: Frontend
```powershell
npm start
```

Frontend en: http://localhost:3000

## 🔍 5. Verificar que funciona

### A. Métricas del Worker

```powershell
# Ver métricas disponibles
curl http://localhost:8787/metrics
```

Deberías ver JSON con métricas.

### B. Logs de Alloy

En la terminal de Alloy deberías ver cada 15 segundos:
```
ts=... level=debug component=prometheus.scrape.worker_metrics msg="Scraped target" samples=25 duration=50ms
```

### C. En Grafana Cloud

1. Ve a tu Grafana Cloud
2. **Explore** → **Prometheus**
3. Query: `wpt_worker_requests_total`
4. Deberías ver datos apareciendo

Para traces:
1. **Explore** → **Tempo**
2. Query: `{service.name="wpt-worker"}`

## 📊 6. Dashboards

Importa el dashboard incluido:

1. En Grafana Cloud: **Dashboards** → **Import**
2. Arrastra el archivo `grafana-dashboard.json`
3. Selecciona tus data sources (Prometheus, Tempo, Loki)

## 🎯 Flujo de datos

```
┌─────────────────────────────────────────────────────┐
│                    TU MÁQUINA                       │
│                                                     │
│  ┌──────────────┐      ┌──────────────┐           │
│  │   Frontend   │      │    Worker    │           │
│  │ (localhost:  │      │ (localhost:  │           │
│  │    3000)     │      │    8787)     │           │
│  └──────┬───────┘      └──────┬───────┘           │
│         │                     │                    │
│         │ Faro                │ Métricas           │
│         │ (directo)           │ (scraping)         │
│         │                     ▼                    │
│         │              ┌──────────────┐            │
│         │              │    Alloy     │            │
│         │              │ (localhost)  │            │
│         │              │              │            │
│         │              │ • Scrapes    │            │
│         │              │ • Buffers    │            │
│         │              │ • Procesa    │            │
│         │              └──────┬───────┘            │
│         │                     │                    │
└─────────┼─────────────────────┼────────────────────┘
          │                     │
          │                     │ Todo unificado
          ▼                     ▼
    ┌─────────────────────────────────┐
    │       GRAFANA CLOUD             │
    │                                 │
    │  • Prometheus (Métricas)        │
    │  • Tempo (Traces)               │
    │  • Loki (Logs)                  │
    │  • Faro (Frontend)              │
    └─────────────────────────────────┘
```

## 🔧 Troubleshooting

### Alloy no inicia
```powershell
# Verificar sintaxis del config
alloy fmt alloy-config.alloy

# Ver errores detallados
alloy run alloy-config.alloy --server.http.listen-addr=127.0.0.1:12345
```

### No aparecen métricas
1. Verifica que el Worker esté corriendo en `localhost:8787`
2. Verifica que `/metrics` responda: `curl http://localhost:8787/metrics`
3. Revisa logs de Alloy: debe decir "Scraped target"

### No aparecen traces
1. Verifica que el Worker envíe a `localhost:4318` (Alloy)
2. En logs de Alloy busca: "Received spans"
3. Verifica credenciales de Tempo en `alloy-config.alloy`

### Error de autenticación
- Verifica que `grafana-token.txt` contenga el API Key correcto
- Verifica que el Instance ID (username) sea correcto
- El API Key debe tener permisos: MetricsPublisher, TracesPublisher, LogsPublisher

## 📝 Comandos útiles

```powershell
# Validar configuración
alloy fmt alloy-config.alloy

# Ejecutar en modo debug
$env:ALLOY_LOG_LEVEL="debug"
alloy run alloy-config.alloy

# Ver UI de Alloy (ver estado de componentes)
# Abre: http://localhost:12345
alloy run alloy-config.alloy --server.http.listen-addr=127.0.0.1:12345

# Recargar configuración sin reiniciar
# Alloy recarga automáticamente al detectar cambios en el archivo
```

## ✅ Checklist

- [ ] Alloy instalado
- [ ] `grafana-token.txt` creado con API Key
- [ ] `alloy-config.alloy` editado con tus URLs e Instance ID
- [ ] Alloy corriendo sin errores
- [ ] Worker corriendo en localhost:8787
- [ ] Endpoint `/metrics` responde
- [ ] Frontend corriendo en localhost:3000
- [ ] Métricas aparecen en Grafana Cloud (Prometheus)
- [ ] Traces aparecen en Grafana Cloud (Tempo)
- [ ] Dashboard importado y funcionando

¡Listo! Ahora tienes observabilidad completa con Alloy. 🎉
