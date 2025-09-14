import { useState, useEffect } from 'react';
import { getSystemConfigurations } from '../services/systemConfigService';
import { useAuth } from '../contexts/AuthContextSimple';
import { ref, onValue, off, get } from 'firebase/database';
import { getRealtimeDb } from '../services/firebase';

/**
 * Hook personalizado para verificar el estado del modo mantenimiento
 * @returns {Object} Estado del modo mantenimiento y función para refrescar
 */
export const useMaintenanceMode = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, isSuperAdmin } = useAuth();

  const checkMaintenanceMode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const database = await getRealtimeDb();
      const maintenanceStatusRef = ref(database, 'maintenanceStatus/isActive');
      const snapshot = await get(maintenanceStatusRef);
      
      const maintenanceMode = snapshot.val() || false;
      setIsMaintenanceMode(maintenanceMode);
    } catch (err) {
      console.error('❌ Error verificando modo mantenimiento:', err);
      // En caso de error, no activar mantenimiento para evitar bloquear el sistema
      setIsMaintenanceMode(false);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe;
    
    const setupRealtimeListener = async () => {
      if (!currentUser) {
        setIsMaintenanceMode(false);
        setLoading(false);
        return;
      }

      try {
        // Cargar configuración inicial
        await checkMaintenanceMode();
        
        // Configurar listener en tiempo real
        const database = await getRealtimeDb();
        const maintenanceStatusRef = ref(database, 'maintenanceStatus/isActive');
        unsubscribe = onValue(maintenanceStatusRef, (snapshot) => {
          const maintenanceMode = snapshot.val() || false;
          setIsMaintenanceMode(maintenanceMode);
        }, (error) => {
          console.error('❌ Error en listener de modo mantenimiento:', error);
          // En caso de error, mantener el estado actual y no bloquear el sistema
        });
      } catch (error) {
        console.error('❌ Error configurando listener:', error);
        setIsMaintenanceMode(false);
        setLoading(false);
      }
    };

    setupRealtimeListener();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  return {
    isMaintenanceMode,
    loading,
    error,
    refresh: checkMaintenanceMode
  };
};
