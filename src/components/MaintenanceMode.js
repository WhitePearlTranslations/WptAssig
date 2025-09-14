import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  Button,
  Avatar,
  Divider
} from '@mui/material';
import {
  Construction as ConstructionIcon,
  Schedule as ScheduleIcon,
  AdminPanelSettings as AdminIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContextSimple';

/**
 * Componente que se muestra cuando el sistema está en modo mantenimiento
 * Solo los administradores pueden seguir usando el sistema
 */
const MaintenanceMode = ({ onAdminOverride }) => {
  const { userProfile, signOut, isSuperAdmin } = useAuth();
  
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleAdminAccess = () => {
    if (isSuperAdmin() && onAdminOverride) {
      onAdminOverride();
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1e1b4b 50%, #0f0f23 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        }
      }}
    >
      {/* Contenido principal en layout horizontal */}
      <Container 
        maxWidth={false} 
        sx={{ 
          position: 'relative', 
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          maxWidth: '1200px',
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr' },
            gap: { xs: 3, lg: 6 },
            alignItems: 'center',
            width: '100%',
            maxHeight: '90vh'
          }}
        >
          {/* Sección izquierda - Icono y título */}
          <Box sx={{ textAlign: { xs: 'center', lg: 'left' } }}>
            {/* Icono principal */}
            <Box
              sx={{
                mb: { xs: 2, lg: 3 },
                position: 'relative',
                display: 'inline-block'
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 120, sm: 140, lg: 160 },
                  height: { xs: 120, sm: 140, lg: 160 },
                  bgcolor: 'transparent',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 25px 50px rgba(245, 158, 11, 0.4)',
                  animation: 'pulse 3s ease-in-out infinite',
                  mx: { xs: 'auto', lg: 0 }
                }}
              >
                <ConstructionIcon sx={{ fontSize: { xs: 60, sm: 70, lg: 80 }, color: 'white' }} />
              </Avatar>
              
              {/* Efectos decorativos */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: 160, sm: 180, lg: 200 },
                  height: { xs: 160, sm: 180, lg: 200 },
                  border: '2px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: '50%',
                  animation: 'spin 20s linear infinite'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: 200, sm: 220, lg: 240 },
                  height: { xs: 200, sm: 220, lg: 240 },
                  border: '1px solid rgba(245, 158, 11, 0.08)',
                  borderRadius: '50%',
                  animation: 'spin 30s linear infinite reverse'
                }}
              />
            </Box>

            {/* Título */}
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', sm: '3rem', lg: '3.5rem' },
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: { xs: 2, lg: 3 },
                letterSpacing: '-0.02em',
                lineHeight: 1.1
              }}
            >
              Sistema en<br />Mantenimiento
            </Typography>

            {/* Descripción */}
            <Typography
              variant="h6"
              sx={{ 
                lineHeight: 1.5,
                color: 'rgba(241, 245, 249, 0.9)',
                fontWeight: 400,
                fontSize: { xs: '1.1rem', lg: '1.25rem' },
                mb: { xs: 3, lg: 0 }
              }}
            >
              Estamos realizando mejoras importantes.
              <Box component="span" sx={{ color: '#f59e0b', fontWeight: 600, display: 'block', mt: 0.5 }}>
                Volvemos pronto
              </Box>
            </Typography>
          </Box>

          {/* Sección derecha - Información y acciones */}
          <Paper
            elevation={30}
            sx={{
              p: { xs: 3, sm: 4, lg: 5 },
              background: 'rgba(15, 15, 25, 0.95)',
              backdropFilter: 'blur(25px)',
              borderRadius: 4,
              border: '1px solid rgba(148, 163, 184, 0.15)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              color: 'white',
              textAlign: 'center'
            }}
          >
            {/* Información del proceso - Compacta */}
            <Box
              sx={{
                mb: 3,
                p: 3,
                bgcolor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 3,
                textAlign: 'left'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <ScheduleIcon sx={{ color: '#60a5fa', mr: 1, fontSize: 20 }} />
                <Typography variant="body1" fontWeight={600} sx={{ color: '#60a5fa' }}>
                  Proceso de Actualización
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(241, 245, 249, 0.9)', lineHeight: 1.4, fontSize: '0.9rem' }}>
                • Optimizando velocidad del sistema<br />
                • Nuevas funcionalidades
              </Typography>
            </Box>

            {/* Información del usuario - Compacta */}
            {userProfile && (
              <Box
                sx={{
                  mb: 3,
                  p: 2.5,
                  bgcolor: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 3,
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.main',
                      width: 40,
                      height: 40,
                      fontSize: '1.1rem',
                      fontWeight: 600
                    }}
                  >
                    {userProfile.name?.charAt(0) || '?'}
                  </Avatar>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" fontWeight={600} sx={{ color: 'white' }}>
                      {userProfile.name || 'Usuario'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(241, 245, 249, 0.7)' }}>
                      {userProfile.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Botones de acción */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
              {isSuperAdmin() && (
                <Button
                  variant="contained"
                  startIcon={<AdminIcon />}
                  onClick={handleAdminAccess}
                  sx={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      transform: 'translateY(-1px)',
                    },
                    boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)',
                    borderRadius: 2,
                    px: 3,
                    py: 1.2,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                    textTransform: 'none'
                  }}
                >
                  Acceder como Admin
                </Button>
              )}
              
              <Button
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{
                  borderColor: 'rgba(148, 163, 184, 0.3)',
                  color: 'rgba(241, 245, 249, 0.9)',
                  '&:hover': {
                    borderColor: 'rgba(148, 163, 184, 0.5)',
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    transform: 'translateY(-1px)',
                  },
                  borderRadius: 2,
                  px: 3,
                  py: 1.2,
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  textTransform: 'none'
                }}
              >
                Cerrar Sesión
              </Button>
            </Box>

            {/* Footer compacto */}
            <Box sx={{ pt: 2, borderTop: '1px solid rgba(148, 163, 184, 0.15)' }}>
              <Typography 
                variant="body2" 
                fontWeight={600}
                sx={{ 
                  color: 'white',
                  mb: 0.5,
                  fontSize: '1rem'
                }}
              >
                WhitePearl Translations
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(241, 245, 249, 0.6)',
                  fontSize: '0.8rem'
                }}
              >
                © 2025 • Nos vemos pronto!
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
      
      {/* CSS para animaciones mejoradas */}
      <style>{`
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 25px 50px rgba(245, 158, 11, 0.4);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 30px 60px rgba(245, 158, 11, 0.6);
          }
        }
        
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        body {
          overflow: hidden;
        }
      `}</style>
    </Box>
  );
};

export default MaintenanceMode;
