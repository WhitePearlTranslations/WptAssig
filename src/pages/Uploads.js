import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Alert,
  Typography,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContextSimple';
import NewUploadsPanel from '../components/NewUploadsPanel';
import UploadReportsPanel from '../components/UploadReportsPanel';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componente principal de la página de uploads
const Uploads = () => {
  const { currentUser, userProfile, checkPermission } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [canManageUploads, setCanManageUploads] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Effect para verificar permisos
  useEffect(() => {
    const checkUploadsPermission = async () => {
      if (currentUser && userProfile) {
        try {
          const hasPermission = await checkPermission('canManageUploads');
          setCanManageUploads(hasPermission);
        } catch (error) {
          console.error('Error verificando permiso canManageUploads:', error);
          setCanManageUploads(false);
        }
      } else {
        setCanManageUploads(false);
      }
      setIsLoading(false);
    };
    
    checkUploadsPermission();
  }, [currentUser, userProfile, checkPermission]);

  // Mostrar loading mientras se verifican permisos
  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography>Verificando permisos...</Typography>
      </Container>
    );
  }
  
  if (!canManageUploads) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="warning">
          <Typography variant="h6">Acceso Restringido</Typography>
          <Typography>
            No tienes permisos para gestionar uploads. Contacta a un administrador si necesitas acceso.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Tu rol actual: {userProfile?.role || 'No definido'}
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Box>
      {/* Tabs de navegación */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="xl">
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="uploader tabs">
            <Tab 
              icon={<CloudUploadIcon />} 
              label="Nuevo Sistema de Uploads" 
              sx={{ textTransform: 'none' }}
            />
            <Tab 
              icon={<AnalyticsIcon />} 
              label="Reportes de Uploads" 
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
        </Container>
      </Box>

      {/* Contenido de las tabs */}
      <Box sx={{ mt: 0 }}>
        {currentTab === 0 && <NewUploadsPanel />}
        {currentTab === 1 && <UploadReportsPanel />}
      </Box>
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Box>
  );
};

export default Uploads;
