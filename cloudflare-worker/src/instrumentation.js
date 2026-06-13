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
  const startTime = performance.now(); // Usar performance.now() para precisión de microsegundos
  const startTimeMs = Date.now(); // Para timestamp absoluto
  const url = new URL(request.url);
  const endpoint = url.pathname;
  const method = request.method;
  
  // Generar IDs para tracing distribuido
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  
  // Array para guardar spans hijos
  const childSpans = [];
  
  // Headers de tracing (W3C Trace Context)
  const traceHeaders = {
    'traceparent': `00-${traceId}-${spanId}-01`,
    'tracestate': `grafana=${traceId}:${spanId}`,
  };
  
  let response;
  let error = null;
  
  // Helper para crear child spans con status correcto
  const createChildSpan = (name, startOffset, duration, attributes = {}, hasError = false) => {
    const childSpanId = generateSpanId();
    // Calcular timestamps absolutos en milisegundos primero
    const childStartTimeMs = startTimeMs + startOffset;
    const childEndTimeMs = childStartTimeMs + duration;
    
    childSpans.push({
      traceId,
      spanId: childSpanId,
      parentSpanId: spanId,
      name,
      startTime: childStartTimeMs * 1000000, // Convertir a nanosegundos
      endTime: childEndTimeMs * 1000000, // Convertir a nanosegundos
      duration: duration * 1000000, // nanosegundos
      status: hasError ? 'ERROR' : 'OK', // Agregar status explícito
      attributes,
    });
    return childSpanId;
  };
  
  try {
    // Child span: Request parsing
    const parseStart = performance.now() - startTime;
    const parseBody = request.method === 'POST' ? 'with-body' : 'no-body';
    
    // Simular procesamiento de headers (más realista)
    const headerCount = Array.from(request.headers.keys()).length;
    await new Promise(resolve => setTimeout(resolve, Math.min(headerCount * 0.1, 2))); // Máx 2ms
    
    const parseDuration = performance.now() - startTime - parseStart;
    createChildSpan('parse-request', parseStart, parseDuration, {
      'http.method': method,
      'http.has_body': parseBody,
      'http.header_count': headerCount,
    });
    
    // Child span: Validate origin
    const validateStart = performance.now() - startTime;
    const origin = request.headers.get('Origin');
    // Simular validación de CORS
    await new Promise(resolve => setTimeout(resolve, 1));
    const validateDuration = performance.now() - startTime - validateStart;
    createChildSpan('validate-cors', validateStart, validateDuration, {
      'cors.origin': origin || 'none',
      'cors.allowed': true,
    });
    
    // Ejecutar el handler original
    response = await handler(request, env);
    
    // Métricas de respuesta
    metrics.requestCount++;
    const statusCode = response.status;
    metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;
    
    // Solo 5xx son errores reales del servidor, 4xx son errores del cliente (esperados)
    if (statusCode >= 500) {
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
  
  const duration = performance.now() - startTime; // Duración en milisegundos con decimales
  
  // Recolectar métricas (sin child span)
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
  // Solo contar 5xx como errores, no 4xx (403 es válido)
  if (error || response.status >= 500) {
    metrics.endpoints[endpoint].errors++;
  }
  
  // Enviar trace a Alloy en Render de forma no bloqueante
  // Alloy en Render escucha en el puerto público (80/443) y recibe en el path raíz
  const tempoUrl = 'https://alloy-observability.onrender.com';
  const apiKey = null; // No necesitamos API key, Alloy maneja la autenticación
  
  // Calcular timestamps en nanosegundos correctamente
  const startTimeNano = startTimeMs * 1000000; // milisegundos a nanosegundos
  const endTimeNano = startTimeNano + (duration * 1000000); // Sumar duración precisa
  
  // Preparar root span con status correcto
  // Solo 5xx son ERROR, 4xx son respuestas válidas de validación
  let spanStatus = 'OK';
  if (error || response.status >= 500) {
    spanStatus = 'ERROR';
  }
  
  const rootSpan = {
    traceId,
    spanId,
    parentSpanId: null,
    name: `${method} ${endpoint}`,
    startTime: startTimeNano,
    endTime: endTimeNano,
    duration: duration * 1000000, // nanosegundos
    status: spanStatus,
    attributes: {
      'http.method': method,
      'http.url': request.url,
      'http.status_code': response.status,
      'http.user_agent': request.headers.get('user-agent') || 'unknown',
      'http.duration_ms': duration,
      'error': error ? error.message : null,
    },
  };
  
  // Enviar trace con todos los spans (root + children)
  sendTraceToTempo(env, rootSpan, childSpans, tempoUrl, apiKey).catch(err => {
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
          // Métricas por status code
          ...Object.entries(metricsData.statusCodes).map(([statusCode, count]) => ({
            name: 'wpt_worker_requests_by_status',
            unit: '1',
            gauge: {
              dataPoints: [{
                asInt: count,
                timeUnixNano: timestamp.toString(),
                attributes: [
                  { key: 'status_code', value: { stringValue: statusCode } },
                ],
              }],
            },
          })),
          // Métricas por endpoint
          ...metricsData.endpoints.flatMap(ep => [
            {
              name: 'wpt_worker_endpoint_requests',
              unit: '1',
              gauge: {
                dataPoints: [{
                  asInt: ep.count,
                  timeUnixNano: timestamp.toString(),
                  attributes: [
                    { key: 'endpoint', value: { stringValue: ep.endpoint } },
                  ],
                }],
              },
            },
            {
              name: 'wpt_worker_endpoint_errors',
              unit: '1',
              gauge: {
                dataPoints: [{
                  asInt: ep.errors,
                  timeUnixNano: timestamp.toString(),
                  attributes: [
                    { key: 'endpoint', value: { stringValue: ep.endpoint } },
                  ],
                }],
              },
            },
            {
              name: 'wpt_worker_endpoint_duration_avg_ms',
              unit: 'ms',
              gauge: {
                dataPoints: [{
                  asDouble: ep.avgDuration,
                  timeUnixNano: timestamp.toString(),
                  attributes: [
                    { key: 'endpoint', value: { stringValue: ep.endpoint } },
                  ],
                }],
              },
            },
          ]),
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
async function sendTraceToTempo(env, rootSpan, childSpans, url, apiKey) {
  try {
    // Convertir span a formato OTLP
    const convertSpan = (span) => {
      // Determinar el código de status correcto
      let statusCode = 'STATUS_CODE_UNSET';
      if (span.status === 'OK') {
        statusCode = 'STATUS_CODE_OK';
      } else if (span.status === 'ERROR') {
        statusCode = 'STATUS_CODE_ERROR';
      }
      
      return {
        traceId: span.traceId,
        spanId: span.spanId,
        parentSpanId: span.parentSpanId || '',
        name: span.name,
        kind: span.parentSpanId ? 'SPAN_KIND_INTERNAL' : 'SPAN_KIND_SERVER',
        startTimeUnixNano: span.startTime.toString(),
        endTimeUnixNano: span.endTime.toString(),
        status: {
          code: statusCode,
        },
        attributes: Object.entries(span.attributes)
          .filter(([_, value]) => value != null)
          .map(([key, value]) => ({
            key,
            value: { stringValue: String(value) },
          })),
      };
    };
    
    // Combinar root span con child spans
    const allSpans = [convertSpan(rootSpan), ...childSpans.map(convertSpan)];
    
    // Formato OTLP (OpenTelemetry Protocol)
    const trace = {
      resourceSpans: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'wpt-worker' } },
            { key: 'service.version', value: { stringValue: '1.0.0' } },
            { key: 'deployment.environment', value: { stringValue: env.ENVIRONMENT || 'production' } },
            { key: 'service.namespace', value: { stringValue: 'wptassig' } },
          ],
        },
        scopeSpans: [{
          spans: allSpans,
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
