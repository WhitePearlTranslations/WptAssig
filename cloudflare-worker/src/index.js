/**
 * Cloudflare Worker para servir configuración de Firebase de WPT
 * Protege las API keys mediante autenticación por dominio
 */

// Dominios permitidos para acceder a la configuración
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://your-production-domain.com', // Cambia esto por tu dominio de producción
  'https://wptasignacion.firebaseapp.com' // Tu dominio de Firebase Hosting
];

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Se ajustará dinámicamente
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');

  // Manejar preflight requests
  if (request.method === 'OPTIONS') {
    return handleOptions(origin);
  }

  // Verificar origen
  if (!isOriginAllowed(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Access-Control-Allow-Origin': 'null'
      }
    });
  }

  // Ruta para obtener configuración de Firebase
  if (url.pathname === '/firebase-config' && request.method === 'GET') {
    return handleFirebaseConfig(request, env, origin);
  }

  // Ruta para health check
  if (url.pathname === '/health' && request.method === 'GET') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT || 'unknown'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin || '*'
      }
    });
  }

  // Ruta no encontrada
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin || '*'
    }
  });
}

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('localhost')) {
      return origin.startsWith('http://localhost:');
    }
    return origin === allowed;
  });
}

function handleOptions(origin) {
  const allowedOrigin = isOriginAllowed(origin) ? origin : 'null';
  
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Origin': allowedOrigin
    }
  });
}

async function handleFirebaseConfig(request, env, origin) {
  try {
    // Obtener todas las variables de entorno necesarias
    const config = {
      apiKey: env.REACT_APP_FIREBASE_API_KEY,
      authDomain: env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      databaseURL: env.REACT_APP_FIREBASE_DATABASE_URL,
      projectId: env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.REACT_APP_FIREBASE_APP_ID,
      baseUrl: env.REACT_APP_BASE_URL || 'http://localhost:3000'
    };

    // Verificar que todas las variables estén configuradas
    const missingVars = Object.entries(config)
      .filter(([key, value]) => !value && key !== 'baseUrl')
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      return new Response(JSON.stringify({
        error: 'Server configuration error',
        missingVars: missingVars // Solo en desarrollo
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          'Access-Control-Allow-Origin': origin
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      config: config,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300', // Cache por 5 minutos
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin
      }
    });

  } catch (error) {
    console.error('Error getting Firebase config:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin
      }
    });
  }
}

// Exportar el handler principal
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};
