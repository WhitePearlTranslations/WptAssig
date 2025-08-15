import React, { useState } from 'react';
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
import { useAuth, ROLES } from '../contexts/AuthContext';
import NewUploadsPanel from '../components/NewUploadsPanel';
import UploadReportsPanel from '../components/UploadReportsPanel';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componente principal de la página de uploads
const Uploads = () => {
  const { userProfile } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Verificar si el usuario tiene permisos para uploads
  const hasUploadPermissions = userProfile?.role === ROLES.UPLOADER || 
                              userProfile?.role === ROLES.ADMIN || 
                              userProfile?.role === 'administrador';
  
  if (!hasUploadPermissions) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="warning">
          <Typography variant="h6">Acceso Restringido</Typography>
          <Typography>
            Esta sección es solo para usuarios con rol de Uploader o Administrador.
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
