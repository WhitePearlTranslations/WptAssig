import { useState, useEffect, useRef, useCallback } from 'react';
import { realtimeService } from '../services/realtimeService';
import { useAuth } from '../contexts/AuthContextSimple';

/**
 * Hook personalizado para manejar la sincronización de asignaciones
 * con mejor control de estado
 */
export const useAssignmentsSync = (userFilter = null) => {
  const { userProfile } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  
  // Callback memoizado para manejar actualizaciones
  const handleAssignmentsUpdate = useCallback((newAssignments) => {
    // Verificar si hay cambios reales en los datos
    const hasChanges = JSON.stringify(newAssignments) !== JSON.stringify(assignments);
    if (hasChanges) {
      setAssignments(newAssignments);
      lastUpdateRef.current = Date.now();
    }
    
    setLoading(false);
    setError(null);
  }, [assignments, userFilter]);
  
  // Configurar suscripción
  useEffect(() => {
    if (!userProfile && userFilter) {
      setLoading(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Initialize async subscription
    const initSubscription = async () => {
      try {
        // Clear previous subscription if exists
        if (unsubscribeRef.current) {
          if (typeof unsubscribeRef.current === 'function') {
            unsubscribeRef.current();
          }
          unsubscribeRef.current = null;
        }
        
        // Create new subscription
        unsubscribeRef.current = await realtimeService.subscribeToAssignments(
          handleAssignmentsUpdate,
          userFilter
        );
        
      } catch (subscriptionError) {
        setError(subscriptionError);
        setLoading(false);
      }
    };
    
    initSubscription();
    
    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        if (typeof unsubscribeRef.current === 'function') {
          unsubscribeRef.current();
        }
        unsubscribeRef.current = null;
      }
    };
  }, [userProfile, userFilter, handleAssignmentsUpdate]);
  
  // Función para forzar actualización
  const forceRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const freshAssignments = await realtimeService.getAllAssignments();
      const filteredAssignments = userFilter 
        ? freshAssignments.filter(a => a.assignedTo === userFilter)
        : freshAssignments;
      
      setAssignments(filteredAssignments);
    } catch (refreshError) {
      setError(refreshError);
    } finally {
      setLoading(false);
    }
  }, [userFilter]);
  
  return {
    assignments,
    loading,
    error,
    forceRefresh
  };
};

export default useAssignmentsSync;
