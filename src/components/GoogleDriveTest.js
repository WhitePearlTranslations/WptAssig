import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import googleDriveService from '../services/googleDriveService';

const GoogleDriveTest = () => {
  const [status, setStatus] = useState('No probado');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testGoogleDrive = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificar configuración
      const apiKey = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      
      console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NO CONFIGURADO');
      console.log('🆔 Client ID:', clientId ? `${clientId.substring(0, 20)}...` : 'NO CONFIGURADO');
      
      if (!apiKey || !clientId) {
        throw new Error('Credenciales no configuradas en .env');
      }
      
      setStatus('Cargando GAPI...');
      await googleDriveService.loadGapi();
      
      setStatus('Iniciando sesión...');
      await googleDriveService.signIn();
      
      setStatus('✅ Google Drive conectado exitosamente!');
      
    } catch (error) {
      console.error('❌ Error en prueba de Google Drive:', error);
      setError(error.message);
      setStatus('❌ Error en la conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom>
        🧪 Prueba de Google Drive API
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>API Key:</strong> {process.env.REACT_APP_GOOGLE_DRIVE_API_KEY ? 
            `${process.env.REACT_APP_GOOGLE_DRIVE_API_KEY.substring(0, 15)}...` : 
            '❌ NO CONFIGURADO'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Client ID:</strong> {process.env.REACT_APP_GOOGLE_CLIENT_ID ? 
            `${process.env.REACT_APP_GOOGLE_CLIENT_ID.substring(0, 20)}...` : 
            '❌ NO CONFIGURADO'}
        </Typography>
      </Box>

      <Button 
        variant="contained" 
        onClick={testGoogleDrive} 
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Probando...' : 'Probar Conexión Google Drive'}
      </Button>

      <Typography variant="body1" sx={{ mb: 2 }}>
        <strong>Estado:</strong> {status}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <strong>Error:</strong> {error}
        </Alert>
      )}
    </Box>
  );
};

export default GoogleDriveTest;
