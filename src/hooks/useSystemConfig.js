import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../services/firebase';

export const useSystemConfig = () => {
  const [config, setConfig] = useState({
    general: {
      systemName: 'WPTAssig',
      systemVersion: '1.1',
      baseUrl: '',
      supportEmail: '',
      maxFileSize: 10,
      maxUsersPerProject: 10,
      maintenanceMode: false,
      registrationEnabled: true
    },
    firebase: {
      workerUrl: '',
      enableRealtimeSync: true,
      backupFrequency: 'daily',
      databaseRulesVersion: '',
      storageRulesVersion: ''
    },
    apis: {
      imagekitEnabled: false,
      googleDriveEnabled: false,
      cloudflareWorkerEnabled: false,
      notificationEmail: ''
    },
    security: {
      sessionTimeout: 24,
      passwordMinLength: 6,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      requireUppercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
      enableTwoFactor: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const publicInfoRef = ref(realtimeDb, 'publicSystemInfo');
    const systemConfigRef = ref(realtimeDb, 'systemConfig');
    let unsubscribers = [];
    
    // Definir función para manejar datos públicos
    const handlePublicData = (snapshot) => {
      if (snapshot.exists()) {
        const publicData = snapshot.val();
        console.log('✅ Información pública cargada:', publicData);
        setConfig(prevConfig => ({
          ...prevConfig,
          general: {
            ...prevConfig.general,
            systemName: publicData.systemName || prevConfig.general.systemName,
            systemVersion: publicData.systemVersion || prevConfig.general.systemVersion
          }
        }));
      } else {
        console.log('🔍 No hay información pública disponible');
      }
      setLoading(false);
    };
    
    // Intentar leer la configuración completa (solo admins)
    const unsubscribeSystemConfig = onValue(
      systemConfigRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setConfig(prevConfig => ({
            ...prevConfig,
            ...data
          }));
          setLoading(false);
          console.log('✅ Configuración completa cargada (admin)');
          return;
        }
        // Si no existe configuración completa, usar información pública
        const unsubscribePublic = onValue(publicInfoRef, handlePublicData);
        unsubscribers.push(unsubscribePublic);
      },
      (error) => {
        // Si no tiene permisos para systemConfig, usar información pública
        console.log('🔒 Sin permisos para configuración completa, usando información pública');
        const unsubscribePublic = onValue(publicInfoRef, handlePublicData);
        unsubscribers.push(unsubscribePublic);
      }
    );
    
    unsubscribers.push(unsubscribeSystemConfig);

    return () => {
      unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, []);

  return {
    config,
    loading,
    error,
    systemName: config?.general?.systemName || 'WPTAssig',
    systemVersion: config?.general?.systemVersion || '1.1'
  };
};

export default useSystemConfig;