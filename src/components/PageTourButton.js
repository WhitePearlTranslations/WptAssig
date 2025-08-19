import React, { useState } from 'react';
import {
  Fab,
  Tooltip,
  Box,
  useTheme,
  useMediaQuery,
  Zoom
} from '@mui/material';
import {
  Help as HelpIcon
} from '@mui/icons-material';
import { usePageTour } from '../hooks/usePageTour';

const PageTourButton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { startTour, isTourAvailable, currentPath } = usePageTour({ 
    autoStart: false // No iniciamos automáticamente desde este componente
  });
  
  const [isVisible, setIsVisible] = useState(true);

  const handleStartTour = () => {
    startTour();
    setIsVisible(false); // Ocultar después de usar
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Solo mostrar si hay tour disponible para esta página
  if (!isTourAvailable || !isVisible) {
    return null;
  }

  // Obtener texto específico según la página
  const getPageTitle = (path) => {
    const pageTitles = {
      '/profile': 'tu Perfil',
      '/assignments': 'las Asignaciones',
      '/myworks': 'tus Trabajos',
      '/reviews': 'las Revisiones',
      '/series-management': 'la Gestión de Series'
    };
    return pageTitles[path] || 'esta página';
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 90, sm: 80 },
        right: { xs: 20, sm: 20 },
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      <Zoom in={isVisible} timeout={300}>
        <Tooltip 
          title={`¿Necesitas ayuda con ${getPageTitle(currentPath)}? ¡Inicia el tour!`}
          placement="left"
          arrow
        >
          <Fab
            size={isMobile ? "medium" : "large"}
            onClick={handleStartTour}
            sx={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4)',
              animation: 'bounce 2s infinite',
              '&:hover': {
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                transform: 'scale(1.1)',
                boxShadow: '0 12px 40px rgba(34, 197, 94, 0.5)',
              },
              '@keyframes bounce': {
                '0%, 20%, 50%, 80%, 100%': { 
                  transform: 'translateY(0)' 
                },
                '40%': { 
                  transform: 'translateY(-10px)' 
                },
                '60%': { 
                  transform: 'translateY(-5px)' 
                },
              },
            }}
          >
            <HelpIcon fontSize={isMobile ? "medium" : "large"} />
          </Fab>
        </Tooltip>
      </Zoom>

      {/* Indicador de página específica */}
      {!isMobile && (
        <Zoom in={isVisible} timeout={500}>
          <Box
            sx={{
              backgroundColor: 'rgba(34, 197, 94, 0.9)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 500,
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              maxWidth: '160px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(34, 197, 94, 1)',
                transform: 'scale(1.05)',
              }
            }}
            onClick={handleStartTour}
          >
            Tour de {getPageTitle(currentPath)}
          </Box>
        </Zoom>
      )}
    </Box>
  );
};

export default PageTourButton;
