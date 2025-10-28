/**
 * Instrumentación de métricas y traces para Cloudflare Worker
 * Envía datos a Grafana Cloud (Tempo/Mimir)
 */

// Métricas en memoria (se resetean en cada worker lifecycle)
const metrics = {
  requestCount: 0,
  errorCount: 0,
  requestDurations: [],
  statusCodes: {},
  endpoints: {},
};

/**
 * Middleware de instrumentación para capturar métricas de cada request
 */
export async function instrumentRequest(request, env, handler) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const endpoint = url.pathname;
  const method = request.method;
  
  // Generar IDs para tracing distribuido
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  
  // Headers de tracing (W3C Trace Context)
  const traceHeaders = {
    'traceparent': `00-${traceId}-${spanId}-01`,
    'tracestate': `grafana=${traceId}:${spanId}`,
  };
  
  let response;
  let error = null;
  
  try {
    // Ejecutar el handler original
    response = await handler(request, env);
    
    // Métricas de respuesta exitosa
    metrics.requestCount++;
    const statusCode = response.status;
    metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;
    
    if (statusCode >= 400) {
      metrics.errorCount++;
    }
    
  } catch (err) {
    error = err;
    metrics.errorCount++;
    metrics.requestCount++;
    
    // Respuesta de error
    response = new Response(JSON.stringify({ 
      error: 'Internal server error',
      traceId 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const duration = Date.now() - startTime;
  metrics.requestDurations.push(duration);
  
  // Mantener solo las últimas 1000 duraciones
  if (metrics.requestDurations.length > 1000) {
    metrics.requestDurations.shift();
  }
  
  // Métricas por endpoint
  if (!metrics.endpoints[endpoint]) {
    metrics.endpoints[endpoint] = {
      count: 0,
      errors: 0,
      durations: [],
    };
  }
  metrics.endpoints[endpoint].count++;
  metrics.endpoints[endpoint].durations.push(duration);
  if (error || response.status >= 400) {
    metrics.endpoints[endpoint].errors++;
  }
  
  // Enviar trace a Alloy en Render de forma no bloqueante
  // Alloy en Render escucha en el puerto público (80/443) y recibe en el path raíz
  const tempoUrl = 'https://alloy-observability.onrender.com';
  const apiKey = null; // No necesitamos API key, Alloy maneja la autenticación
  
  // Enviar trace sin esperar (fire-and-forget para no bloquear la respuesta)
  sendTraceToTempo(env, {
    traceId,
    spanId,
    parentSpanId: null,
    name: `${method} ${endpoint}`,
    startTime: startTime * 1000000, // nanosegundos
    duration: duration * 1000000, // nanosegundos
    status: error ? 'ERROR' : 'OK',
    attributes: {
      'http.method': method,
      'http.url': request.url,
      'http.status_code': response.status,
      'http.user_agent': request.headers.get('user-agent') || 'unknown',
      'error': error ? error.message : null,
    },
  }, tempoUrl, apiKey).catch(err => {
    // Silenciar errores de telemetría para no afectar la respuesta
    if (env.ENVIRONMENT === 'development') {
      console.error('Failed to send trace:', err);
    }
  });
  
  // Agregar headers de tracing a la respuesta
  const headersWithTrace = new Headers(response.headers);
  headersWithTrace.set('X-Trace-Id', traceId);
  headersWithTrace.set('X-Span-Id', spanId);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headersWithTrace,
  });
}

/**
 * Endpoint para exponer métricas en formato Prometheus
 */
export function getMetrics() {
  const avgDuration = metrics.requestDurations.length > 0
    ? metrics.requestDurations.reduce((a, b) => a + b, 0) / metrics.requestDurations.length
    : 0;
  
  const p95Duration = calculatePercentile(metrics.requestDurations, 0.95);
  const p99Duration = calculatePercentile(metrics.requestDurations, 0.99);
  
  const endpointMetrics = Object.entries(metrics.endpoints).map(([endpoint, data]) => {
    const avgDur = data.durations.length > 0
      ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length
      : 0;
    
    return {
      endpoint,
      count: data.count,
      errors: data.errors,
      errorRate: data.count > 0 ? (data.errors / data.count) * 100 : 0,
      avgDuration: avgDur,
    };
  });
  
  return {
    timestamp: new Date().toISOString(),
    totalRequests: metrics.requestCount,
    totalErrors: metrics.errorCount,
    errorRate: metrics.requestCount > 0 
      ? (metrics.errorCount / metrics.requestCount) * 100 
      : 0,
    avgDuration,
    p95Duration,
    p99Duration,
    statusCodes: metrics.statusCodes,
    endpoints: endpointMetrics,
  };
}

/**
 * Enviar métricas a Grafana Cloud (Mimir)
 */
export async function sendMetricsToGrafana(env) {
  const metricsData = getMetrics();
  const timestamp = Date.now() * 1000000; // Convertir a nanosegundos para OTLP
  
  // Formato OTLP para métricas
  const otlpMetrics = {
    resourceMetrics: [{
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: 'wpt-worker' } },
          { key: 'service.version', value: { stringValue: '1.0.0' } },
          { key: 'deployment.environment', value: { stringValue: env.ENVIRONMENT || 'development' } },
        ],
      },
      scopeMetrics: [{
        metrics: [
          {
            name: 'wpt_worker_requests_total',
            unit: '1',
            sum: {
              dataPoints: [{
                asInt: metricsData.totalRequests,
                timeUnixNano: timestamp.toString(),
              }],
              aggregationTemporality: 2, // CUMULATIVE
              isMonotonic: true,
            },
          },
          {
            name: 'wpt_worker_errors_total',
            unit: '1',
            sum: {
              dataPoints: [{
                asInt: metricsData.totalErrors,
                timeUnixNano: timestamp.toString(),
              }],
              aggregationTemporality: 2,
              isMonotonic: true,
            },
          },
          {
            name: 'wpt_worker_error_rate',
            unit: '%',
            gauge: {
              dataPoints: [{
                asDouble: metricsData.errorRate,
                timeUnixNano: timestamp.toString(),
              }],
            },
          },
          {
            name: 'wpt_worker_duration_avg_ms',
            unit: 'ms',
            gauge: {
              dataPoints: [{
                asDouble: metricsData.avgDuration,
                timeUnixNano: timestamp.toString(),
              }],
            },
          },
          {
            name: 'wpt_worker_duration_p95_ms',
            unit: 'ms',
            gauge: {
              dataPoints: [{
                asDouble: metricsData.p95Duration,
                timeUnixNano: timestamp.toString(),
              }],
            },
          },
          {
            name: 'wpt_worker_duration_p99_ms',
            unit: 'ms',
            gauge: {
              dataPoints: [{
                asDouble: metricsData.p99Duration,
                timeUnixNano: timestamp.toString(),
              }],
            },
          },
        ],
      }],
    }],
  };
  
  try {
    // Enviar métricas a Alloy en Render (OTLP HTTP)
    await fetch('https://alloy-observability.onrender.com/v1/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(otlpMetrics),
    });
  } catch (error) {
    // Silencioso, Alloy puede estar dormido en Render (plan gratuito)
    if (env.ENVIRONMENT === 'production') {
      console.error('Failed to send metrics to Alloy:', error);
    }
  }
}

/**
 * Enviar trace a Grafana Tempo o Alloy
 */
async function sendTraceToTempo(env, span, url, apiKey) {
  try {
    // Formato OTLP (OpenTelemetry Protocol)
    const trace = {
      resourceSpans: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'wpt-worker' } },
            { key: 'service.version', value: { stringValue: '1.0.0' } },
            { key: 'deployment.environment', value: { stringValue: 'development' } },
          ],
        },
        scopeSpans: [{
          spans: [{
            traceId: span.traceId,
            spanId: span.spanId,
            parentSpanId: span.parentSpanId || '',
            name: span.name,
            kind: 'SPAN_KIND_SERVER',
            startTimeUnixNano: span.startTime.toString(),
            endTimeUnixNano: (span.startTime + span.duration).toString(),
            status: {
              code: span.status === 'OK' ? 'STATUS_CODE_OK' : 'STATUS_CODE_ERROR',
            },
            attributes: Object.entries(span.attributes)
              .filter(([_, value]) => value != null)
              .map(([key, value]) => ({
                key,
                value: { stringValue: String(value) },
              })),
          }],
        }],
      }],
    };
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Solo agregar Authorization si hay API Key (para Grafana Cloud directo)
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    // OTLP HTTP requiere el path /v1/traces
    const fullUrl = url.endsWith('/') ? url + 'v1/traces' : url + '/v1/traces';
    
    await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(trace),
    });
  } catch (error) {
    console.error('Failed to send trace:', error);
  }
}

// Utilidades
function generateTraceId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function generateSpanId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function calculatePercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * percentile) - 1;
  return sorted[index] || 0;
}
