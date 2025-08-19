import React, { useState, useEffect } from 'react';
import {
  Fab,
  Tooltip,
  Box,
  Zoom,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Help as HelpIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTour } from '../hooks/useTour';

const TourFloatingButton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { startTour, isTourAvailable } = useTour();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostrar el botón después de unos segundos si el tour está disponible
    if (isTourAvailable) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isTourAvailable]);

  const handleClick = async () => {
    await startTour();
    setVisible(false); // Ocultar después de usar
  };

  const handleClose = () => {
    setVisible(false);
  };

  if (!isTourAvailable || !visible) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 80, sm: 20 },
        right: { xs: 20, sm: 20 },
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {/* Botón de cerrar */}
      <Zoom in={visible} timeout={500}>
        <Tooltip 
          title="Cerrar sugerencia" 
          placement="left"
          arrow
        >
          <Fab
            size="small"
            color="default"
            onClick={handleClose}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              alignSelf: 'flex-end',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </Fab>
        </Tooltip>
      </Zoom>

      {/* Botón principal del tour */}
      <Zoom in={visible} timeout={300}>
        <Tooltip 
          title="¿Necesitas ayuda? Haz clic para un tour guiado de la aplicación" 
          placement="left"
          arrow
        >
          <Fab
            color="primary"
            onClick={handleClick}
            sx={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
              animation: 'pulse 2s infinite',
              '&:hover': {
                background: 'linear-gradient(135deg, #5b5bf1, #7c3aed)',
                transform: 'scale(1.1)',
                boxShadow: '0 12px 40px rgba(99, 102, 241, 0.5)',
              },
              '@keyframes pulse': {
                '0%': { 
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                  transform: 'scale(1)'
                },
                '50%': { 
                  boxShadow: '0 12px 40px rgba(99, 102, 241, 0.6)',
                  transform: 'scale(1.05)'
                },
                '100%': { 
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                  transform: 'scale(1)'
                },
              },
            }}
          >
            <HelpIcon />
          </Fab>
        </Tooltip>
      </Zoom>

      {/* Texto de sugerencia en móviles */}
      {isMobile && (
        <Zoom in={visible} timeout={700}>
          <Box
            sx={{
              backgroundColor: 'rgba(15, 15, 25, 0.9)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              maxWidth: '150px',
              alignSelf: 'center',
            }}
          >
            ¿Primera vez? ¡Prueba el tour!
          </Box>
        </Zoom>
      )}
    </Box>
  );
};

export default TourFloatingButton;
