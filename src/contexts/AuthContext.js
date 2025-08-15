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

  useEffect(() => {
    let userProfileUnsubscribe = null;
    let unsubscribe = null;
    
    // Initialize Firebase and set up auth listener
    const initializeAuth = async () => {
      try {
        const auth = await getFirebaseAuth();
        const realtimeDb = await getRealtimeDb();
        
        unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Limpiar listener anterior si existe
        if (userProfileUnsubscribe) {
          userProfileUnsubscribe();
        }
        
        // Configurar nuevo listener en tiempo real para el perfil del usuario
        const userRef = ref(realtimeDb, `users/${user.uid}`);
        userProfileUnsubscribe = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const profileData = { uid: user.uid, ...snapshot.val() };
            
            // Verificar si el usuario está suspendido o inactivo
            if (profileData.status === 'suspended') {
              // Cerrar sesión automáticamente si está suspendido
              getFirebaseAuth().then(auth => {
                auth.signOut().then(() => {
                  // Redirigir a login con parámetro de estado suspendido
                  window.location.href = '/login?status=suspended';
                }).catch(error => {
                  //  message removed for production
                  window.location.href = '/login?status=suspended';
                });
              });
              return;
            } else if (profileData.status === 'inactive') {
              // Cerrar sesión automáticamente si está inactivo
              getFirebaseAuth().then(auth => {
                auth.signOut().then(() => {
                  // Redirigir a login con parámetro de estado inactivo
                  window.location.href = '/login?status=inactive';
                }).catch(error => {
                  //  message removed for production
                  window.location.href = '/login?status=inactive';
                });
              });
              return;
            }
            
            setUserProfile(profileData);
          } else {
            setUserProfile({ uid: user.uid });
          }
          setLoading(false);
        }, (error) => {
          //  message removed for production
          setLoading(false);
        });
        } else {
          // Limpiar listener si existe
          if (userProfileUnsubscribe) {
            userProfileUnsubscribe();
            userProfileUnsubscribe = null;
          }
          setCurrentUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      });
      } catch (error) {
        //  message removed for production
        setLoading(false);
      }
    };
    
    initializeAuth();

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
    hasRole,
    canManageUser,
    isSuperAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
