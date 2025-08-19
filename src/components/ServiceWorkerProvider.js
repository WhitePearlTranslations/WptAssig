import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';
import { backgroundSyncService } from '../services/backgroundSyncService';

// Componente para inicializar Service Worker y notificaciones
const ServiceWorkerProvider = ({ children }) => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [swStatus, setSwStatus] = useState({
    isSupported: false,
    isRegistered: false,
    isActive: false
  });

  useEffect(() => {
    const initializeServiceWorker = async () => {
      console.log('[SW Provider] Inicializando Service Worker y notificaciones...');
      
      try {
        // Inicializar el servicio de notificaciones (que registra el SW)
        await notificationService.init();
        
        // Obtener el estado del Service Worker
        const status = notificationService.getServiceWorkerStatus();
        setSwStatus(status);
        
        console.log('[SW Provider] Estado del Service Worker:', status);
        
        // Si el usuario está logueado, inicializar background sync
        if (user && status.isActive) {
          await backgroundSyncService.init(user);
          
          // Actualizar datos del usuario en el Service Worker
          await notificationService.updateUserDataInSW(user);
          
          console.log('[SW Provider] Background sync inicializado para usuario:', user.uid);
        }
        
        setIsInitialized(true);
        
      } catch (error) {
        console.error('[SW Provider] Error inicializando Service Worker:', error);
        setIsInitialized(true); // Continuar sin SW
      }
    };

    // Inicializar cuando la aplicación cargue
    initializeServiceWorker();

    // Cleanup al desmontar
    return () => {
      backgroundSyncService.cleanup();
    };
  }, []); // Solo ejecutar una vez al montar

  useEffect(() => {
    // Cuando el usuario cambie, actualizar los servicios
    if (isInitialized && user) {
      console.log('[SW Provider] Usuario cambió, actualizando servicios...');
      
      // Actualizar background sync service
      backgroundSyncService.updateUserData(user);
      
      // Actualizar datos en el Service Worker
      if (notificationService.swRegistration) {
        notificationService.updateUserDataInSW(user);
      }
    } else if (isInitialized && !user) {
      // Usuario se deslogueó, limpiar servicios
      console.log('[SW Provider] Usuario deslogueado, limpiando servicios...');
      backgroundSyncService.cleanup();
    }
  }, [user, isInitialized]);

  // Registrar listeners para actualizaciones del Service Worker
  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const handleServiceWorkerUpdate = (registration) => {
      console.log('[SW Provider] Service Worker actualizado');
      
      // Mostrar notificación sobre la actualización disponible
      if (notificationService.hasPermission()) {
        notificationService.showNotification(
          '🔄 Actualización Disponible',
          {
            body: 'Hay una nueva versión de la aplicación disponible. Recarga para actualizarla.',
            tag: 'app-update',
            requireInteraction: true,
            actions: [
              {
                action: 'reload',
                title: 'Recargar'
              },
              {
                action: 'dismiss',
                title: 'Después'
              }
            ]
          }
        );
      }
      
      // Actualizar el estado
      setSwStatus(notificationService.getServiceWorkerStatus());
    };

    // Listener para actualizaciones encontradas
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Provider] Controller cambió - Service Worker actualizado');
      window.location.reload();
    });

    // Verificar actualizaciones del Service Worker cada 30 minutos
    const checkForUpdates = () => {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update();
        }
      });
    };

    const updateInterval = setInterval(checkForUpdates, 30 * 60 * 1000); // 30 minutos

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  // Manejar actualizaciones de la aplicación cuando la página se enfoca
  useEffect(() => {
    const handleFocus = () => {
      // Verificar actualizaciones cuando la ventana se enfoca
      if (navigator.serviceWorker) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update();
          }
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Debug: Exponer estado en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.swProvider = {
        status: swStatus,
        isInitialized,
        notificationService,
        backgroundSyncService,
        getStatus: () => ({
          sw: swStatus,
          notification: {
            hasPermission: notificationService.hasPermission(),
            isSupported: notificationService.isSupported,
            settings: notificationService.getUserNotificationSettings()
          },
          backgroundSync: backgroundSyncService.getStatus()
        })
      };
    }
  }, [swStatus, isInitialized]);

  return children;
};

export default ServiceWorkerProvider;
