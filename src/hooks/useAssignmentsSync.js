import { useState, useEffect, useRef, useCallback } from 'react';
import { realtimeService } from '../services/realtimeService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado para manejar la sincronización de asignaciones
 * con mejor control de estado y debugging
 */
export const useAssignmentsSync = (userFilter = null, debugKey = 'unknown') => {
  const { userProfile } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  
  // Callback memoizado para manejar actualizaciones
  const handleAssignmentsUpdate = useCallback((newAssignments) => {
    const timestamp = Date.now();
    // Debug message removed for production
    
    // Verificar si hay cambios reales en los datos
    const hasChanges = JSON.stringify(newAssignments) !== JSON.stringify(assignments);
    if (hasChanges) {
      //  message removed for production
      setAssignments(newAssignments);
      lastUpdateRef.current = timestamp;
    } else {
      //  message removed for production
    }
    
    setLoading(false);
    setError(null);
  }, [assignments, userFilter, debugKey]);
  
  // Configurar suscripción
  useEffect(() => {
    if (!userProfile && userFilter) {
      //  message removed for production
      setLoading(true);
      return;
    }
    
    // Debug message removed for production
    
    setLoading(true);
    setError(null);
    
    // Initialize async subscription
    const initSubscription = async () => {
      try {
        // Clear previous subscription if exists
        if (unsubscribeRef.current) {
          //  message removed for production
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
        
        //  message removed for production
        
      } catch (subscriptionError) {
        //  message removed for production
        setError(subscriptionError);
        setLoading(false);
      }
    };
    
    initSubscription();
    
    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        //  message removed for production
        if (typeof unsubscribeRef.current === 'function') {
          unsubscribeRef.current();
        }
        unsubscribeRef.current = null;
      }
    };
  }, [userProfile, userFilter, debugKey, handleAssignmentsUpdate]);
  
  // Función para forzar actualización
  const forceRefresh = useCallback(async () => {
    //  message removed for production
    setLoading(true);
    try {
      const freshAssignments = await realtimeService.getAllAssignments();
      const filteredAssignments = userFilter 
        ? freshAssignments.filter(a => a.assignedTo === userFilter)
        : freshAssignments;
      
      // Debug message removed for production
      
      setAssignments(filteredAssignments);
    } catch (refreshError) {
      //  message removed for production
      setError(refreshError);
    } finally {
      setLoading(false);
    }
  }, [userFilter, debugKey]);
  
  return {
    assignments,
    loading,
    error,
    forceRefresh,
    // Debug info
    debugInfo: {
      key: debugKey,
      userFilter,
      lastUpdate: lastUpdateRef.current,
      subscriptionActive: !!unsubscribeRef.current
    }
  };
};

export default useAssignmentsSync;
