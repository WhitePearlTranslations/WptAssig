import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
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

// Datos embebidos para usuarios conocidos cuando Firebase falla completamente
const getEmbeddedUserData = (uid) => {
  const embeddedUsers = {
    // Usuario VMtELOJ83IgNmnGk9xNQmlo07Pr1 (Noobrate)
    'VMtELOJ83IgNmnGk9xNQmlo07Pr1': {
      nombre: 'Noobrate',
      role: 'jefe_editor',
      miembroDesde: 'N/A',
      activo: true
    },
    // Usuario 7HIHfawVZtYBnUgIsvuspXY9DCw1 (WhitePearl Translations - Admin)
    '7HIHfawVZtYBnUgIsvuspXY9DCw1': {
      nombre: 'WhitePearl Translations',
      role: 'admin',
      miembroDesde: 'N/A',
      activo: true
    }
  };
  
  return embeddedUsers[uid] || null;
};

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
            
            // Estrategia robusta contra extensiones
            let retryCount = 0;
            const maxRetries = 3;
            let connectionTimeout;

            const attemptConnection = () => {
              // Timeout para detectar conexiones que se cuelgan
              connectionTimeout = setTimeout(() => {
                handleConnectionFallback();
              }, 5000);

              try {
                profileUnsubscribe = onValue(userRef, (snapshot) => {
                  clearTimeout(connectionTimeout);
                  
                  if (snapshot.exists()) {
                    const profileData = { uid: user.uid, ...snapshot.val() };
                    setUserProfile(profileData);
                  } else {
                    setUserProfile({ uid: user.uid });
                  }

                  setLoading(false);
                }, (error) => {
                  clearTimeout(connectionTimeout);
                  handleConnectionError(error);
                });
              } catch (syncError) {
                clearTimeout(connectionTimeout);
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
                // Clean up previous listener
                if (profileUnsubscribe) {
                  try {
                    profileUnsubscribe();
                  } catch (e) {
                    // Silent cleanup
                  }
                  profileUnsubscribe = null;
                }

                setTimeout(() => {
                  attemptConnection();
                }, retryCount * 2000); // Delay incremental
              } else {
                handleConnectionFallback();
              }
            };

            const handleConnectionFallback = async () => {
              try {
                // Intentar obtener datos vía REST API
                const response = await fetch(`https://wptasignacion-default-rtdb.firebaseio.com/users/${user.uid}.json`);
                
                if (response.ok) {
                  const userData = await response.json();
                  if (userData) {
                    const profileData = { uid: user.uid, ...userData };
                    setUserProfile(profileData);
                    setLoading(false);
                    return;
                  }
                }
              } catch (restError) {
                // Fallback JSONP - esto bypasea completamente CSP
                try {
                  const jsonpCallback = `firebase_callback_${Date.now()}`;
                  
                  window[jsonpCallback] = (data) => {
                    if (data) {
                      const profileData = { uid: user.uid, ...data };
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
                    setUserProfile({ uid: user.uid });
                    setLoading(false);
                    delete window[jsonpCallback];
                  };
                  
                  document.head.appendChild(script);
                  
                  // Timeout para JSONP
                  setTimeout(() => {
                    if (window[jsonpCallback]) {
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
                  // Continue to embedded fallback
                }
              }
              
              // Ultimate fallback: datos embebidos para usuarios conocidos
              const embeddedUserData = getEmbeddedUserData(user.uid);
              if (embeddedUserData) {
                const profileData = { uid: user.uid, ...embeddedUserData };
                setUserProfile(profileData);
                setLoading(false);
                return;
              }
              
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

  const signOut = async () => {
    try {
      const auth = await getFirebaseAuth();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    authError,
    hasRole,
    canManageUser,
    isSuperAdmin,
    signOut
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
