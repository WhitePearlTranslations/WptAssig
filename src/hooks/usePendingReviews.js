import { useState, useEffect, useRef } from 'react';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { realtimeService } from '../services/realtimeService';
import { ASSIGNMENT_STATUS } from '../utils/constants';

/**
 * Hook personalizado para contar revisiones pendientes
 * Solo funciona para usuarios con roles de jefe (JEFE_EDITOR, JEFE_TRADUCTOR, ADMIN)
 * @returns {Object} { count, loading, error, assignments }
 */
export const usePendingReviews = () => {
  const { userProfile, hasRole } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const unsubscribeRef = useRef(null);

  // Verificar si el usuario puede ver revisiones
  const canAccessReviews = hasRole(ROLES.ADMIN) || hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR);

  useEffect(() => {
    // Solo inicializar si el usuario tiene permisos y está autenticado
    if (!userProfile || !canAccessReviews) {
      setCount(0);
      setAssignments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const initSubscription = async () => {
      try {
        // Obtener todas las asignaciones pendientes de aprobación
        unsubscribeRef.current = await realtimeService.subscribeToAssignments((allAssignments) => {
          
          // Filtrar solo asignaciones pendientes de aprobación
          const pendingApprovalAssignments = allAssignments.filter(assignment => 
            assignment.status === ASSIGNMENT_STATUS.PENDIENTE_APROBACION
          );

          // Filtrar según el rol del jefe actual
          const filteredAssignments = pendingApprovalAssignments.filter(assignment => {
            // Admins pueden ver todo
            if (hasRole(ROLES.ADMIN)) {
              return true;
            }

            // Jefes solo ven las asignaciones de su área
            const canReviewAsTraductor = hasRole(ROLES.JEFE_TRADUCTOR) && 
              ['traduccion', 'proofreading'].includes(assignment.type);
            
            const canReviewAsEditor = hasRole(ROLES.JEFE_EDITOR) && 
              ['cleanRedrawer', 'type'].includes(assignment.type);
            
            return canReviewAsTraductor || canReviewAsEditor;
          });

          setAssignments(filteredAssignments);
          setCount(filteredAssignments.length);
          setLoading(false);
        });

      } catch (err) {
        console.error('Error setting up pending reviews subscription:', err);
        setError(err.message || 'Error cargando revisiones pendientes');
        setLoading(false);
      }
    };

    initSubscription();

    // Cleanup
    return () => {
      if (typeof unsubscribeRef.current === 'function') {
        unsubscribeRef.current();
      }
    };
  }, [userProfile, canAccessReviews, hasRole]);

  // Función para obtener estadísticas detalladas
  const getDetailedStats = () => {
    if (!assignments.length) return null;

    const stats = {
      total: assignments.length,
      byType: {
        traduccion: assignments.filter(a => a.type === 'traduccion').length,
        proofreading: assignments.filter(a => a.type === 'proofreading').length,
        cleanRedrawer: assignments.filter(a => a.type === 'cleanRedrawer').length,
        type: assignments.filter(a => a.type === 'type').length
      },
      overdue: assignments.filter(a => {
        if (!a.dueDate) return false;
        return new Date(a.dueDate) < new Date();
      }).length,
      recent: assignments.filter(a => {
        if (!a.pendingApprovalSince) return false;
        const daysSince = (new Date() - new Date(a.pendingApprovalSince)) / (1000 * 60 * 60 * 24);
        return daysSince <= 1; // Últimas 24 horas
      }).length
    };

    return stats;
  };

  // Función para obtener texto descriptivo del rol
  const getRoleDescription = () => {
    if (hasRole(ROLES.ADMIN)) {
      return 'Todas las áreas';
    } else if (hasRole(ROLES.JEFE_TRADUCTOR)) {
      return 'Traducción y Proofreading';
    } else if (hasRole(ROLES.JEFE_EDITOR)) {
      return 'Edición y Typesetting';
    }
    return '';
  };

  return {
    count,
    loading,
    error,
    assignments,
    canAccess: canAccessReviews,
    detailedStats: getDetailedStats(),
    roleDescription: getRoleDescription(),
    refresh: () => {
      // Forzar refresco reconectando la suscripción
      if (typeof unsubscribeRef.current === 'function') {
        unsubscribeRef.current();
      }
      // La reconexión será manejada por el useEffect
    }
  };
};

/**
 * Hook simplificado que solo retorna el conteo
 * @returns {number} Número de revisiones pendientes
 */
export const usePendingReviewsCount = () => {
  const { count } = usePendingReviews();
  return count;
};

/**
 * Hook que incluye notificaciones toast para cambios
 * Requiere que react-hot-toast esté disponible
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.enableToast - Habilitar notificaciones toast
 * @param {number} options.toastDelay - Delay antes de mostrar toast (ms)
 * @returns {Object} Mismo objeto que usePendingReviews
 */
export const usePendingReviewsWithToast = (options = {}) => {
  const { enableToast = true, toastDelay = 2000 } = options;
  const result = usePendingReviews();
  const { count, loading } = result;
  const prevCountRef = useRef(count);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    // Solo proceder si no está cargando y hay cambios
    if (loading) return;

    const prevCount = prevCountRef.current;
    const hasIncreased = count > prevCount;

    // Actualizar referencia
    prevCountRef.current = count;

    // Mostrar toast solo si habilitado, hay un aumento, y no es la carga inicial
    if (enableToast && hasIncreased && prevCount !== 0) {
      // Limpiar timeout anterior si existe
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      // Configurar nuevo timeout
      toastTimeoutRef.current = setTimeout(async () => {
        try {
          const toast = await import('react-hot-toast');
          const difference = count - prevCount;
          
          toast.default(
            `📋 ${difference} nueva${difference > 1 ? 's' : ''} revisión${difference > 1 ? 'es' : ''} pendiente${difference > 1 ? 's' : ''}`,
            {
              duration: 4000,
              position: 'top-right',
              icon: '⏳',
              style: {
                background: 'rgba(245, 158, 11, 0.9)',
                color: 'white',
                fontWeight: '500'
              }
            }
          );
        } catch (error) {
          console.warn('react-hot-toast no disponible para notificaciones');
        }
      }, toastDelay);
    }

    // Cleanup
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [count, loading, enableToast, toastDelay]);

  return result;
};

export default usePendingReviews;
