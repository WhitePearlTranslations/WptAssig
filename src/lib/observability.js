import { getWebInstrumentations, initializeFaro, ReactIntegration, createReactRouterV6DataOptions } from '@grafana/faro-react';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { matchRoutes } from 'react-router-dom';

let faro = null;

export function initObservability() {
  // Solo inicializar en producción o si está habilitado explícitamente
  if (process.env.NODE_ENV !== 'production' && !process.env.REACT_APP_ENABLE_FARO) {
    console.log('Faro observability disabled in development');
    return null;
  }

  // Verificar que tenemos la URL del colector
  const collectorUrl = process.env.REACT_APP_FARO_COLLECTOR_URL;
  
  if (!collectorUrl) {
    console.warn('REACT_APP_FARO_COLLECTOR_URL not configured');
    return null;
  }

  try {
    faro = initializeFaro({
      url: collectorUrl,
      app: {
        name: 'WPTAssig',
        version: process.env.REACT_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'production',
      },
      instrumentations: [
        // Instrumentación automática de Web APIs
        ...getWebInstrumentations({
          captureConsole: true, // Capturar console.log, console.error, etc
          captureConsoleDisabledLevels: [], // Capturar todos los niveles
        }),
        
        // Tracing de requests y navegación
        new TracingInstrumentation({
          instrumentationOptions: {
            // Propagar contexto de tracing
            propagateTraceHeaderCorsUrls: [
              /https:\/\/wptassig\.dpdns\.org/,
              /https:\/\/.*\.firebaseio\.com/,
              /https:\/\/.*\.googleapis\.com/,
            ],
          },
        }),
        
        // React Router integration para rastrear navegación
        new ReactIntegration({
          router: createReactRouterV6DataOptions({
            matchRoutes,
          }),
        }),
      ],
      
      // Metadatos del usuario (se actualizarán después del login)
      user: {
        id: 'anonymous',
        attributes: {},
      },
      
      // Configuración de sesión
      sessionTracking: {
        enabled: true,
        persistent: true,
      },
      
      // Muestreo (100% en producción, ajustar si hay mucho tráfico)
      metas: [],
    });

    console.log('✅ Faro observability initialized');
    return faro;
  } catch (error) {
    console.error('Failed to initialize Faro:', error);
    return null;
  }
}

// Función para actualizar información del usuario después del login
export function setFaroUser(user) {
  if (faro && user) {
    faro.api.setUser({
      id: user.uid,
      email: user.email,
      username: user.displayName || user.email,
      attributes: {
        role: user.role || 'user',
        emailVerified: user.emailVerified,
      },
    });
  }
}

// Función para limpiar información del usuario (logout)
export function resetFaroUser() {
  if (faro) {
    faro.api.resetUser();
  }
}

// Función para enviar eventos personalizados
export function pushEvent(name, attributes = {}, domain = 'custom') {
  if (faro) {
    faro.api.pushEvent(name, attributes, domain);
  }
}

// Función para enviar logs manuales
export function pushLog(message, level = 'info', context = {}) {
  if (faro) {
    faro.api.pushLog([message], {
      level,
      context,
    });
  }
}

// Función para medir rendimiento de operaciones
export function measureOperation(name, operation) {
  if (!faro) return operation();
  
  const startTime = performance.now();
  try {
    const result = operation();
    const duration = performance.now() - startTime;
    
    pushEvent('operation_completed', {
      operation: name,
      duration,
      success: true,
    }, 'performance');
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    pushEvent('operation_failed', {
      operation: name,
      duration,
      error: error.message,
    }, 'performance');
    
    throw error;
  }
}

// Función para crear y gestionar spans manualmente (para child spans)
export function createSpan(name, attributes = {}) {
  if (!faro || !faro.api.getOTEL) return null;
  
  try {
    const tracer = faro.api.getOTEL()?.trace?.getTracer('WPTAssig');
    if (!tracer) return null;
    
    const span = tracer.startSpan(name, {
      attributes: {
        'component': 'frontend',
        'service.name': 'WPTAssig',
        ...attributes,
      },
    });
    
    return {
      end: (finalAttributes = {}) => {
        Object.entries(finalAttributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
        span.end();
      },
      addEvent: (eventName, eventAttributes = {}) => {
        span.addEvent(eventName, eventAttributes);
      },
      setStatus: (status, message) => {
        span.setStatus({ code: status, message });
      },
    };
  } catch (error) {
    console.warn('Failed to create span:', error);
    return null;
  }
}

// Wrapper para operaciones asíncronas con child spans
export async function traceAsyncOperation(name, operation, attributes = {}) {
  const span = createSpan(name, attributes);
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    if (span) {
      span.end({
        'operation.duration_ms': duration,
        'operation.status': 'success',
      });
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    if (span) {
      span.setStatus(2, error.message); // 2 = ERROR
      span.end({
        'operation.duration_ms': duration,
        'operation.status': 'error',
        'error.message': error.message,
        'error.type': error.name,
      });
    }
    
    throw error;
  }
}

// Helper específico para operaciones de Firebase
export async function traceFirebaseOperation(operationName, operation, metadata = {}) {
  return traceAsyncOperation(
    `firebase.${operationName}`,
    operation,
    {
      'db.system': 'firebase',
      'db.operation': operationName,
      ...metadata,
    }
  );
}

// Helper para operaciones de API/fetch
export async function traceFetchOperation(url, fetchFn, method = 'GET') {
  return traceAsyncOperation(
    `http.${method.toLowerCase()}`,
    fetchFn,
    {
      'http.method': method,
      'http.url': url,
      'http.target': new URL(url).pathname,
    }
  );
}

export default faro;
