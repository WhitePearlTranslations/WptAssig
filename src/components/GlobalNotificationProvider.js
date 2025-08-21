import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePendingReviewsWithToast } from '../hooks/usePendingReviews';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';

/**
 * Componente global para manejar notificaciones toast
 * Se debe montar una vez en la aplicación (por ejemplo en App.js)
 */
const GlobalNotificationProvider = ({ children }) => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  
  // Solo activar notificaciones para jefes
  const isChief = hasRole(ROLES.ADMIN) || hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR);
  
  // Hook que incluye notificaciones automáticas
  const { count, detailedStats, roleDescription } = usePendingReviewsWithToast({
    enableToast: isChief, // Solo habilitar para jefes
    toastDelay: 1000 // 1 segundo de delay
  });

  // Función para mostrar notificación personalizada con botón de acción
  const showCustomNotification = (pendingCount) => {
    if (!isChief || pendingCount === 0) return;

    // Crear toast personalizado con acción
    toast(
      (t) => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 4px',
          maxWidth: '400px'
        }}>
          <div style={{
            fontSize: '24px',
            minWidth: '32px'
          }}>
            ⏳
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151',
              marginBottom: '4px'
            }}>
              {pendingCount} revisión{pendingCount > 1 ? 'es' : ''} pendiente{pendingCount > 1 ? 's' : ''}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              {roleDescription} • Toca para revisar
            </div>
          </div>
          <button
            onClick={() => {
              navigate('/reviews');
              toast.dismiss(t.id);
            }}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: '70px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
          >
            Revisar
          </button>
        </div>
      ),
      {
        duration: 6000,
        position: 'top-right',
        style: {
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          backdropFilter: 'blur(8px)',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(245, 158, 11, 0.15)',
          maxWidth: '420px'
        }
      }
    );
  };

  // Mostrar notificación especial para revisiones vencidas
  useEffect(() => {
    if (!isChief || !detailedStats || detailedStats.overdue === 0) return;

    // Solo mostrar notificación de vencidas si hay bastantes (más de 2)
    if (detailedStats.overdue >= 2) {
      toast(
        (t) => (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 4px',
            maxWidth: '400px'
          }}>
            <div style={{
              fontSize: '24px',
              minWidth: '32px'
            }}>
              ⚠️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: '600',
                fontSize: '14px',
                color: '#dc2626',
                marginBottom: '4px'
              }}>
                {detailedStats.overdue} revisiones vencidas
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Requieren atención urgente
              </div>
            </div>
            <button
              onClick={() => {
                navigate('/reviews');
                toast.dismiss(t.id);
              }}
              style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                minWidth: '70px'
              }}
            >
              Ver ahora
            </button>
          </div>
        ),
        {
          duration: 8000,
          position: 'top-right',
          style: {
            borderRadius: '12px',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            backgroundColor: 'rgba(220, 38, 38, 0.05)',
            backdropFilter: 'blur(8px)',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(220, 38, 38, 0.15)',
            maxWidth: '420px'
          }
        }
      );
    }
  }, [detailedStats?.overdue, isChief, navigate]);

  // Función para mostrar notificación de bienvenida para nuevos jefes (solo la primera vez)
  useEffect(() => {
    if (!isChief || count === 0) return;

    // Solo mostrar si hay pocas revisiones (primera vez como jefe posiblemente)
    const isFirstTime = localStorage.getItem('wpt_chief_welcome') !== 'shown';
    
    if (isFirstTime && count > 0 && count <= 3) {
      localStorage.setItem('wpt_chief_welcome', 'shown');
      
      setTimeout(() => {
        toast(
          (t) => (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 4px',
              maxWidth: '400px'
            }}>
              <div style={{
                fontSize: '24px',
                minWidth: '32px'
              }}>
                👋
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Panel de Revisión disponible
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  Tienes {count} revisión{count > 1 ? 'es' : ''} esperando tu aprobación
                </div>
              </div>
              <button
                onClick={() => {
                  navigate('/reviews');
                  toast.dismiss(t.id);
                }}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '80px'
                }}
              >
                Explorar
              </button>
            </div>
          ),
          {
            duration: 5000,
            position: 'top-right',
            style: {
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              backgroundColor: 'rgba(99, 102, 241, 0.05)',
              backdropFilter: 'blur(8px)',
              padding: '16px',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15)',
              maxWidth: '420px'
            }
          }
        );
      }, 3000); // 3 segundos después del login
    }
  }, [isChief, count, navigate]);

  return <>{children}</>;
};

/**
 * Hook para mostrar notificaciones manuales desde cualquier componente
 */
export const useGlobalNotifications = () => {
  const navigate = useNavigate();
  
  const showPendingReviewNotification = (count, options = {}) => {
    const {
      message = `Tienes ${count} revisión${count > 1 ? 'es' : ''} pendiente${count > 1 ? 's' : ''}`,
      duration = 4000,
      type = 'info' // 'info', 'success', 'warning', 'error'
    } = options;

    const colors = {
      info: { bg: '#f59e0b', border: '#f59e0b' },
      success: { bg: '#10b981', border: '#10b981' },
      warning: { bg: '#f59e0b', border: '#f59e0b' },
      error: { bg: '#ef4444', border: '#ef4444' }
    };

    const color = colors[type];
    
    toast(
      (t) => (
        <div onClick={() => {
          navigate('/reviews');
          toast.dismiss(t.id);
        }} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          padding: '4px'
        }}>
          <div style={{ fontSize: '18px' }}>📋</div>
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
          }}>
            {message}
          </div>
        </div>
      ),
      {
        duration,
        position: 'top-right',
        style: {
          borderRadius: '12px',
          border: `1px solid ${color.border}40`,
          backgroundColor: `${color.bg}10`,
          backdropFilter: 'blur(8px)',
          padding: '12px'
        }
      }
    );
  };

  const showSuccessNotification = (message, onClick) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        borderRadius: '12px',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        color: '#059669'
      }
    });
  };

  return {
    showPendingReviewNotification,
    showSuccessNotification
  };
};

export default GlobalNotificationProvider;
