/**
 * Cloudflare Worker para servir configuración de Firebase de WPT
 * Protege las API keys mediante autenticación por dominio
 * Incluye funcionalidad administrativa para eliminar usuarios de Authentication
 */

// No necesitamos firebase-admin ya que usaremos la API REST
// import admin from 'firebase-admin';

// Dominios permitidos para acceder a la configuración
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://wptasignacion.firebaseapp.com', // Tu dominio de Firebase Hosting
  'https://wptasignacion.web.app', // Dominio alternativo de Firebase
  'https://wptassig.dpdns.org', // Tu dominio personalizado de producción
  // Para desarrollo, permitir null para herramientas como curl/PowerShell
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

  // Request logging removed for production

  // Manejar preflight requests
  if (request.method === 'OPTIONS') {
    return handleOptions(origin);
  }

  // Verificar origen
  if (!isOriginAllowed(origin)) {
    // Origin check failed - logging removed for production
    return new Response(JSON.stringify({ 
      error: 'Origin not allowed',
      origin: origin,
      debug: 'Check allowed origins configuration'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin || '*'
      }
    });
  }

  // Ruta para obtener configuración de Firebase
  if (url.pathname === '/firebase-config' && request.method === 'GET') {
    return handleFirebaseConfig(request, env, origin);
  }

  // Ruta para eliminar usuario de Authentication
  if (url.pathname === '/admin/delete-user' && request.method === 'POST') {
    return handleDeleteUser(request, env, origin);
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
  // Permitir requests sin origen (null) para herramientas como curl/PowerShell
  if (!origin) return ALLOWED_ORIGINS.includes(null);
  
  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed === null) return false; // null solo se permite cuando origin es null
    if (typeof allowed === 'string' && allowed.includes('localhost')) {
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
      // Missing environment variables - logging removed for production
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
    // Firebase config error - logging removed for production
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

// Función para obtener un token de acceso OAuth2 usando la API REST
async function getAccessToken(env) {
  try {
    // Verificar que tenemos la clave de servicio
    if (!env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no está configurada');
    }

    // Parsear la clave de servicio
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
    // Service account parsed successfully

    // Crear el JWT para obtener el token de acceso
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/identitytoolkit',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600, // 1 hora
      iat: now
    };

    // Crear el JWT header y payload
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: serviceAccount.private_key_id
    };

    // Codificar el JWT usando WebCrypto API
    const jwtToken = await createJWT(header, payload, serviceAccount.private_key);

    // Intercambiar el JWT por un token de acceso
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error obteniendo token de acceso: ${response.status} ${errorText}`);
    }

    const tokenResponse = await response.json();
    // Access token obtained successfully
    return tokenResponse.access_token;

  } catch (error) {
    // Error obtaining access token - logging removed for production
    throw error;
  }
}

// Función para crear un JWT usando WebCrypto API
async function createJWT(header, payload, privateKey) {
  // Importar la clave privada
  const key = await crypto.subtle.importKey(
    'pkcs8',
    str2ab(atob(privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, '').replace(/\n/g, ''))),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  // Codificar header y payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  // Crear la firma
  const data = encodedHeader + '.' + encodedPayload;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(data)
  );

  // Codificar la firma
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return data + '.' + encodedSignature;
}

// Función auxiliar para convertir string a ArrayBuffer
function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// Función para manejar la eliminación de usuarios de Authentication usando API REST
async function handleDeleteUser(request, env, origin) {
  try {
    // Starting handleDeleteUser
    
    // Obtener el cuerpo de la petición
    const body = await request.json();
    const { userId, adminToken } = body;
    
    // Request body parsed successfully

    if (!userId) {
      // Error: userId not provided
      return new Response(JSON.stringify({
        success: false,
        error: 'userId es requerido'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          'Access-Control-Allow-Origin': origin
        }
      });
    }

    // Verificar el token de administrador
    // Verifying admin token
    if (!adminToken || adminToken !== env.ADMIN_DELETE_TOKEN) {
      // Invalid admin token - logging removed for production
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de administrador inválido'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          'Access-Control-Allow-Origin': origin
        }
      });
    }
    
    // Token verified successfully, obtaining access token
    
    // Obtener token de acceso OAuth2
    const accessToken = await getAccessToken(env);
    // Access token obtained successfully

    // Obtener el project_id
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const projectId = serviceAccount.project_id;

    // Verificar si el usuario existe usando la API REST
    // Verifying if user exists using REST API
    let userExists = true;
    let userRecord = null;
    
    try {
      const getUserResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          localId: [userId]
        })
      });

      if (!getUserResponse.ok) {
        if (getUserResponse.status === 400) {
          // Usuario no encontrado
          userExists = false;
          // User does not exist in Firebase Authentication
        } else {
          const errorText = await getUserResponse.text();
          throw new Error(`Error verificando usuario: ${getUserResponse.status} ${errorText}`);
        }
      } else {
        const getUserResult = await getUserResponse.json();
        if (getUserResult.users && getUserResult.users.length > 0) {
          userRecord = getUserResult.users[0];
          // User found in Auth
        } else {
          userExists = false;
          // User does not exist in Firebase Authentication
        }
      }
    } catch (error) {
      // Error verifying user - logging removed for production
      throw error;
    }

    if (!userExists) {
      // Returning 404 response - user not found
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado en Firebase Authentication'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          'Access-Control-Allow-Origin': origin
        }
      });
    }

    // Eliminar el usuario usando la API REST
    // Proceeding to delete user using REST API
    
    const deleteResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        localId: userId
      })
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`Error eliminando usuario: ${deleteResponse.status} ${errorText}`);
    }

    const deleteResult = await deleteResponse.json();
    // User deleted successfully from Firebase Authentication

    return new Response(JSON.stringify({
      success: true,
      message: 'Usuario eliminado exitosamente de Firebase Authentication',
      userId: userId
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin
      }
    });

  } catch (error) {
    // Detailed error deleting user from Authentication - logging removed for production
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message,
      debug: {
        errorName: error.name
      }
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
