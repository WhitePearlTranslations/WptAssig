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

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Detect mobile device and set timeout
  useEffect(() => {
    // Enhanced mobile detection
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);
      const isMobileScreen = screenWidth < 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      const mobile = isMobileUserAgent || (isMobileScreen && isTouchDevice);
      
      setIsMobile(mobile);
      console.log('[Auth] Mobile detection:', {
        mobile,
        isMobileUserAgent,
        isMobileScreen,
        isTouchDevice,
        screenWidth,
        userAgent: userAgent.substring(0, 150)
      });
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Set a timeout for loading state (especially important for mobile)
    const timeoutDuration = isMobile ? 15000 : 10000; // 15s for mobile, 10s for desktop
    console.log('[Auth] Setting loading timeout for', timeoutDuration, 'ms');
    
    const loadingTimer = setTimeout(() => {
      console.warn('[Auth] Loading timeout reached, forcing render');
      setLoadingTimeout(true);
      setLoading(false);
      setAuthError('Authentication timeout - please refresh the page');
    }, timeoutDuration);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(loadingTimer);
    };
  }, [isMobile]);

  useEffect(() => {
    let userProfileUnsubscribe = null;
    let unsubscribe = null;
    let initializationAttempts = 0;
    let isInitializing = false;
    const maxAttempts = 3;
    
    console.log('[Auth] Initializing authentication, mobile:', isMobile);
    
    // Prevent duplicate initialization
    if (isInitializing) {
      console.log('[Auth] Already initializing, skipping...');
      return;
    }
    
    // Initialize Firebase and set up auth listener with retry logic
    const initializeAuth = async (attempt = 1) => {
      if (isInitializing) {
        console.log('[Auth] Already initializing, aborting duplicate attempt');
        return;
      }
      
      isInitializing = true;
      console.log(`[Auth] Initialization attempt ${attempt}/${maxAttempts}`);
      initializationAttempts = attempt;
      
      try {
        console.log('[Auth] Getting Firebase auth...');
        const auth = await getFirebaseAuth();
        console.log('[Auth] Getting Realtime DB...');
        const realtimeDb = await getRealtimeDb();
        console.log('[Auth] Firebase services initialized, setting up auth listener...');
        
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log('[Auth] Auth state changed:', {
            hasUser: !!user,
            uid: user?.uid,
            email: user?.email,
            emailVerified: user?.emailVerified,
            timestamp: new Date().toISOString()
          });
          
          if (user) {
            console.log('[Auth] User logged in, setting up profile listener...');
            setCurrentUser(user);
            
            // Limpiar listener anterior si existe
            if (userProfileUnsubscribe) {
              userProfileUnsubscribe();
            }
            
            // Configurar nuevo listener en tiempo real para el perfil del usuario
            const userRef = ref(realtimeDb, `users/${user.uid}`);
            console.log('[Auth] Setting up profile listener for user:', user.uid);
            
            userProfileUnsubscribe = onValue(userRef, (snapshot) => {
              console.log('[Auth] Profile data received:', {
                exists: snapshot.exists(),
                hasData: !!snapshot.val(),
                timestamp: new Date().toISOString()
              });
              
              if (snapshot.exists()) {
                const profileData = { uid: user.uid, ...snapshot.val() };
                console.log('[Auth] Profile data:', {
                  uid: profileData.uid,
                  email: profileData.email,
                  role: profileData.role,
                  status: profileData.status,
                  name: profileData.name
                });
                
                // DEBUGGING: Check for auto-logout bypass
                const bypassAutoLogout = localStorage.getItem('debug_bypass_auto_logout') === 'true';
                
                // Verificar si el usuario está suspendido o inactivo
                // IMPORTANTE: No desconectar administradores para evitar problemas al gestionar usuarios
                const isAdmin = profileData.role === 'admin';
                const isSuperAdmin = user.uid === '7HIHfawVZtYBnUgIsvuspXY9DCw1' && user.email === 'whitepearltranslations@gmail.com';
                
                if (profileData.status === 'suspended' && !bypassAutoLogout && !isAdmin && !isSuperAdmin) {
                  console.warn('[Auth] User is suspended, signing out...');
                  // Cerrar sesión automáticamente si está suspendido
                  getFirebaseAuth().then(auth => {
                    auth.signOut().then(() => {
                      // Redirigir a login con parámetro de estado suspendido
                      window.location.href = '/login?status=suspended';
                    }).catch(error => {
                      console.error('[Auth] Error signing out suspended user:', error);
                      window.location.href = '/login?status=suspended';
                    });
                  });
                  return;
                } else if (profileData.status === 'inactive' && !bypassAutoLogout && !isAdmin && !isSuperAdmin) {
                  console.warn('[Auth] User is inactive, signing out...');
                  // Cerrar sesión automáticamente si está inactivo
                  getFirebaseAuth().then(auth => {
                    auth.signOut().then(() => {
                      // Redirigir a login con parámetro de estado inactivo
                      window.location.href = '/login?status=inactive';
                    }).catch(error => {
                      console.error('[Auth] Error signing out inactive user:', error);
                      window.location.href = '/login?status=inactive';
                    });
                  });
                  return;
                } else if ((isAdmin || isSuperAdmin) && (profileData.status === 'suspended' || profileData.status === 'inactive')) {
                  console.warn('[Auth] Admin/SuperAdmin status changed to suspended/inactive but not logging out to prevent lockout');
                } else if (bypassAutoLogout && (profileData.status === 'suspended' || profileData.status === 'inactive')) {
                  console.warn('[Auth] DEBUG MODE: Bypassing auto-logout for status:', profileData.status);
                }
                
                console.log('[Auth] User profile is valid, setting profile data...');
                setUserProfile(profileData);
              } else {
                console.log('[Auth] No profile data found, creating basic profile...');
                setUserProfile({ uid: user.uid });
              }
              console.log('[Auth] Setting loading to false...');
              setLoading(false);
            }, (error) => {
              console.error('[Auth] Error loading user profile:', error.message);
              setLoading(false);
            });
          } else {
            console.log('[Auth] User logged out, cleaning up...');
            // Limpiar listener si existe
            if (userProfileUnsubscribe) {
              userProfileUnsubscribe();
              userProfileUnsubscribe = null;
            }
            setCurrentUser(null);
            setUserProfile(null);
            console.log('[Auth] Setting loading to false after logout...');
            setLoading(false);
          }
      });
      } catch (error) {
        console.error(`[Auth] Initialization attempt ${attempt} failed:`, error.message);
        setAuthError(`Authentication failed (attempt ${attempt}/${maxAttempts}): ${error.message}`);
        
        if (attempt < maxAttempts) {
          const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.log(`[Auth] Retrying in ${retryDelay}ms...`);
          setTimeout(() => initializeAuth(attempt + 1), retryDelay);
        } else {
          console.error('[Auth] All initialization attempts failed');
          setLoading(false);
          setAuthError('Failed to connect to authentication service. Please check your internet connection and refresh the page.');
        }
      }
    };
    
    // Add a small delay before starting to allow the page to stabilize
    const initDelay = isMobile ? 1000 : 500;
    console.log(`[Auth] Starting initialization in ${initDelay}ms...`);
    setTimeout(() => initializeAuth(), initDelay);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (userProfileUnsubscribe) {
        userProfileUnsubscribe();
      }
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

  // Función para verificar si es el superusuario
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
    isMobile,
    loadingTimeout,
    hasRole,
    canManageUser,
    isSuperAdmin
  };

  // Render loading screen or error state if needed
  if (loading && !loadingTimeout) {
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
            {isMobile ? 'Cargando aplicación...' : 'Inicializando...'}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.7, textAlign: 'center' }}>
            {isMobile ? 'Esto puede tomar unos segundos en dispositivos móviles' : 'Conectando con el servidor'}
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

  // Render error screen if loading timed out
  if (loadingTimeout && authError) {
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
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '10px' }}>
            Error de Conexión
          </div>
          <div style={{ fontSize: '16px', opacity: 0.8, marginBottom: '30px', maxWidth: '500px' }}>
            No se pudo conectar con el servidor de autenticación. 
            Por favor, verifica tu conexión a internet y recarga la página.
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            Recargar Página
          </button>
          {authError && (
            <div style={{
              marginTop: '20px',
              padding: '12px 16px',
              background: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: '8px',
              color: '#ff6b6b',
              fontSize: '12px',
              maxWidth: '500px',
              fontFamily: 'monospace'
            }}>
              Error: {authError}
            </div>
          )}
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
