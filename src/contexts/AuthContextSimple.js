import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { getFirebaseAuth, getRealtimeDb } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const ROLES = {
  ADMIN: 'admin',
  JEFE_EDITOR: 'jefe_editor',
  JEFE_TRADUCTOR: 'jefe_traductor',
  UPLOADER: 'uploader',
  EDITOR: 'editor',
  TRADUCTOR: 'traductor'
};

export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 5,
  [ROLES.JEFE_EDITOR]: 4,
  [ROLES.JEFE_TRADUCTOR]: 4,
  [ROLES.UPLOADER]: 3,
  [ROLES.EDITOR]: 2,
  [ROLES.TRADUCTOR]: 2
};

// UID del superusuario (WhitePearl Translations)
const SUPER_USER_UID = "7HIHfawVZtYBnUgIsvuspXY9DCw1";

// Global flag to prevent multiple initializations
let isGloballyInitialized = false;

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Prevent multiple initializations globally
    if (isGloballyInitialized) {
      return;
    }
    
    isGloballyInitialized = true;

    let unsubscribe = null;
    let profileUnsubscribe = null;
    let initTimeout = null;

    const initAuth = async () => {
      try {
        const auth = await getFirebaseAuth();
        const realtimeDb = await getRealtimeDb();
        
        unsubscribe = onAuthStateChanged(auth, (user) => {

          if (user) {
            setCurrentUser(user);

            // Clean up previous profile listener
            if (profileUnsubscribe) {
              profileUnsubscribe();
            }

            const userRef = ref(realtimeDb, `users/${user.uid}`);
            console.log('🔍 AuthContext - Conectando a Firebase path:', `users/${user.uid}`);
            
            // Estrategia más robusta contra extensiones
            let retryCount = 0;
            const maxRetries = 3;
            let connectionTimeout;

            const attemptConnection = () => {
              console.log(`🔍 AuthContext - Intento de conexión #${retryCount + 1}`);
              
              // Timeout para detectar conexiones que se cuelgan
              connectionTimeout = setTimeout(() => {
                console.log('⏰ AuthContext - Timeout de conexión, forzando fallback');
                handleConnectionFallback();
              }, 5000);

              try {
                profileUnsubscribe = onValue(userRef, (snapshot) => {
                  clearTimeout(connectionTimeout);
                  console.log('📊 AuthContext - Datos recibidos:', {
                    exists: snapshot.exists(),
                    data: snapshot.exists() ? snapshot.val() : null,
                    uid: user.uid,
                    attempt: retryCount + 1
                  });
                  
                  if (snapshot.exists()) {
                    const profileData = { uid: user.uid, ...snapshot.val() };
                    console.log('✅ AuthContext - Perfil establecido:', profileData);
                    setUserProfile(profileData);
                  } else {
                    console.log('⚠️ AuthContext - No existe perfil, usando UID básico');
                    setUserProfile({ uid: user.uid });
                  }

                  setLoading(false);
                }, (error) => {
                  clearTimeout(connectionTimeout);
                  console.error(`❌ AuthContext - Error Firebase (intento ${retryCount + 1}):`, error);
                  handleConnectionError(error);
                });
              } catch (syncError) {
                clearTimeout(connectionTimeout);
                console.error('❌ AuthContext - Error síncrono:', syncError);
                handleConnectionError(syncError);
              }
            };

            const handleConnectionError = (error) => {
              retryCount++;
              
              // Detectar varios tipos de problemas de extensiones
              const isExtensionProblem = error.message && (
                error.message.includes('runtime.lastError') ||
                error.message.includes('Extension') ||
                error.message.includes('chrome-extension') ||
                error.message.includes('moz-extension') ||
                error.message.includes('websocket') ||
                error.code === 'NETWORK_ERROR'
              );

              if (isExtensionProblem && retryCount <= maxRetries) {
                console.log(`🔄 AuthContext - Problema de extensión detectado, reintentando en ${retryCount * 2}s (${retryCount}/${maxRetries})`);
                
                // Clean up previous listener
                if (profileUnsubscribe) {
                  try {
                    profileUnsubscribe();
                  } catch (e) {
                    console.log('⚠️ AuthContext - Error limpiando listener:', e);
                  }
                  profileUnsubscribe = null;
                }

                setTimeout(() => {
                  attemptConnection();
                }, retryCount * 2000); // Delay incremental
              } else {
                console.log('❌ AuthContext - Máximo de reintentos alcanzado o error no recuperable');
                handleConnectionFallback();
              }
            };

            const handleConnectionFallback = async () => {
              console.log('🆘 AuthContext - Firebase bloqueado, intentando API REST...');
              
              try {
                // Intentar obtener datos vía REST API
                const response = await fetch(`https://wptasignacion-default-rtdb.firebaseio.com/users/${user.uid}.json`);
                
                if (response.ok) {
                  const userData = await response.json();
                  if (userData) {
                    const profileData = { uid: user.uid, ...userData };
                    console.log('✅ AuthContext - Perfil obtenido vía REST API:', profileData);
                    setUserProfile(profileData);
                    setLoading(false);
                    return;
                  }
                }
              } catch (restError) {
                console.error('❌ AuthContext - Error en REST API fallback:', restError);
                console.log('📞 AuthContext - Intentando JSONP como último recurso...');
                
                // Fallback JSONP - esto bypasea completamente CSP
                try {
                  const jsonpCallback = `firebase_callback_${Date.now()}`;
                  
                  window[jsonpCallback] = (data) => {
                    if (data) {
                      const profileData = { uid: user.uid, ...data };
                      console.log('✅ AuthContext - Perfil obtenido vía JSONP:', profileData);
                      setUserProfile(profileData);
                    } else {
                      setUserProfile({ uid: user.uid });
                    }
                    setLoading(false);
                    // Cleanup
                    delete window[jsonpCallback];
                    const scriptElement = document.getElementById(jsonpCallback);
                    if (scriptElement) {
                      scriptElement.remove();
                    }
                  };
                  
                  const script = document.createElement('script');
                  script.id = jsonpCallback;
                  script.src = `https://wptasignacion-default-rtdb.firebaseio.com/users/${user.uid}.json?callback=${jsonpCallback}`;
                  script.onerror = () => {
                    console.error('❌ AuthContext - JSONP fallback también falló');
                    setUserProfile({ uid: user.uid });
                    setLoading(false);
                    delete window[jsonpCallback];
                  };
                  
                  document.head.appendChild(script);
                  
                  // Timeout para JSONP
                  setTimeout(() => {
                    if (window[jsonpCallback]) {
                      console.log('⏰ AuthContext - Timeout JSONP, usando perfil básico');
                      setUserProfile({ uid: user.uid });
                      setLoading(false);
                      delete window[jsonpCallback];
                      const scriptElement = document.getElementById(jsonpCallback);
                      if (scriptElement) {
                        scriptElement.remove();
                      }
                    }
                  }, 5000);
                  
                  return; // Exit early, JSONP will handle the rest
                } catch (jsonpError) {
                  console.error('❌ AuthContext - Error en JSONP fallback:', jsonpError);
                }
              }
              
              console.log('🆘 AuthContext - Usando perfil básico como último recurso');
              setUserProfile({ uid: user.uid });
              setLoading(false);
            };

            // Iniciar primer intento
            attemptConnection();
          } else {
            if (profileUnsubscribe) {
              profileUnsubscribe();
              profileUnsubscribe = null;
            }
            setCurrentUser(null);
            setUserProfile(null);
            setLoading(false);
          }
        });

        // Set timeout for mobile
        initTimeout = setTimeout(() => {
          setLoading(false);
          setAuthError('Authentication timeout - app will continue to load');
        }, 10000);

      } catch (error) {
        setAuthError(error.message);
        setLoading(false);
      }
    };

    initAuth();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      isGloballyInitialized = false;
    };
  }, []);

  const hasRole = (requiredRole) => {
    if (!userProfile) return false;
    return ROLE_HIERARCHY[userProfile.role] >= ROLE_HIERARCHY[requiredRole];
  };

  const canManageUser = (targetUserRole) => {
    if (!userProfile) return false;
    return ROLE_HIERARCHY[userProfile.role] > ROLE_HIERARCHY[targetUserRole];
  };

  const isSuperAdmin = () => {
    return currentUser?.uid === SUPER_USER_UID && 
           currentUser?.email === 'whitepearltranslations@gmail.com' &&
           userProfile?.role === ROLES.ADMIN;
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    authError,
    hasRole,
    canManageUser,
    isSuperAdmin
  };

  // Show loading screen
  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1e1b4b 50%, #0f0f23 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#f1f5f9',
          fontFamily: 'Inter, Roboto, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '50%',
            borderTop: '3px solid #6366f1',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '10px' }}>
            Cargando aplicación...
          </div>
          {authError && (
            <div style={{
              marginTop: '20px',
              padding: '12px 16px',
              background: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: '8px',
              color: '#ff6b6b',
              fontSize: '14px',
              textAlign: 'center',
              maxWidth: '400px'
            }}>
              {authError}
            </div>
          )}
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
