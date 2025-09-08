import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Stack,
  Card,
  CardContent
} from '@mui/material';
import {
  Image as ImageIcon,
  OpenInNew as OpenInNewIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { googleDriveService } from '../services/googleDriveService';

/**
 * Componente mejorado para mostrar imágenes de Google Drive
 * Incluye manejo de autenticación y múltiples estrategias de carga
 */
const AuthenticatedImageViewer = ({ 
  file, 
  maxWidth = '100%', 
  maxHeight = '75vh',
  showControls = true 
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadStrategy, setLoadStrategy] = useState('public'); // 'public', 'authenticated', 'dataurl'
  const [zoom, setZoom] = useState(100);

  // URLs públicas para intentar primero
  const publicUrls = file.imageUrls || [
    `https://drive.google.com/uc?id=${file.id}`,
    `https://drive.google.com/uc?id=${file.id}&export=view`,
    `https://lh3.googleusercontent.com/d/${file.id}`,
    file.thumbnailLink,
    `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`
  ].filter(Boolean);

  useEffect(() => {
    loadImage();
  }, [file.id]);

  const loadImage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Estrategia 1: Intentar URLs públicas
      if (loadStrategy === 'public') {
        await tryPublicUrls();
      }
      // Estrategia 2: Usar token de autenticación para obtener blob
      else if (loadStrategy === 'authenticated') {
        await tryAuthenticatedUrl();
      }
      // Estrategia 3: Usar Data URL (base64)
      else if (loadStrategy === 'dataurl') {
        await tryDataUrl();
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const tryPublicUrls = async () => {
    return new Promise((resolve, reject) => {
      let urlIndex = 0;
      
      const tryNextUrl = () => {
        if (urlIndex >= publicUrls.length) {
          // Si todas las URLs públicas fallan, intentar con autenticación
          setLoadStrategy('authenticated');
          loadImage();
          return;
        }

        const url = publicUrls[urlIndex];

        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          setImageUrl(url);
          setLoading(false);
          resolve();
        };
        
        img.onerror = () => {
          urlIndex++;
          tryNextUrl();
        };
        
        img.src = url;
      };

      tryNextUrl();
    });
  };

  const tryAuthenticatedUrl = async () => {
    try {
      const authenticatedUrl = await googleDriveService.getAuthenticatedImageUrl(file.id);
      setImageUrl(authenticatedUrl);
      setLoading(false);
    } catch (err) {
      setLoadStrategy('dataurl');
      loadImage();
    }
  };

  const tryDataUrl = async () => {
    try {
      const dataUrl = await googleDriveService.getImageAsDataUrl(file.id);
      setImageUrl(dataUrl);
      setLoading(false);
    } catch (err) {
      setError('No se pudo cargar la imagen. Verifica los permisos de acceso.');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setLoadStrategy('public'); // Reiniciar con estrategia pública
    loadImage();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  if (loading) {
    return (
      <Card sx={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 15, 25, 0.8)'
      }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Cargando imagen...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loadStrategy === 'public' && 'Intentando URLs públicas'}
            {loadStrategy === 'authenticated' && 'Usando autenticación'}
            {loadStrategy === 'dataurl' && 'Convirtiendo a Data URL'}
          </Typography>
          {loadStrategy !== 'public' && (
            <Stack direction="row" alignItems="center" justifyContent="center" sx={{ mt: 2 }}>
              <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body2" color="primary.main">
                Accediendo con credenciales
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ef4444 0.1%, #1e1b4b 50%, #0f0f23 100%)',
        border: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <CardContent sx={{ textAlign: 'center', maxWidth: '500px' }}>
          <ImageIcon sx={{ fontSize: '4rem', color: '#ef4444', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2, color: '#ef4444' }}>
            No se puede mostrar la imagen
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Posibles soluciones:</strong><br/>
              • Verificar que la imagen esté compartida públicamente<br/>
              • Asegurarse de estar autenticado en Google Drive<br/>
              • Verificar permisos de la carpeta contenedora<br/>
              • La imagen podría estar en una carpeta privada
            </Typography>
          </Alert>
          
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              color="error"
            >
              Reintentar
            </Button>
            <Button
              variant="contained"
              startIcon={<OpenInNewIcon />}
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                backgroundColor: '#ef4444',
                '&:hover': { backgroundColor: '#dc2626' }
              }}
            >
              Ver en Google Drive
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ 
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Controles superiores */}
      {showControls && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 1,
          px: 2,
          py: 1,
          background: 'rgba(0,0,0,0.7)',
          borderRadius: 1
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {file.name} • {file.formattedSize}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Método: {loadStrategy === 'public' ? 'Público' : loadStrategy === 'authenticated' ? 'Autenticado' : 'Data URL'}
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 25}>
              <ZoomOutIcon />
            </IconButton>
            <Button
              size="small"
              onClick={handleResetZoom}
              sx={{ minWidth: '60px', fontSize: '0.7rem' }}
            >
              {zoom}%
            </Button>
            <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 300}>
              <ZoomInIcon />
            </IconButton>
          </Stack>
        </Box>
      )}

      {/* Contenedor de imagen */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        borderRadius: 1,
        background: 'rgba(0,0,0,0.1)'
      }}>
        <img
          src={imageUrl}
          alt={file.name}
          style={{
            maxWidth: maxWidth,
            maxHeight: maxHeight,
            width: 'auto',
            height: 'auto',
            transform: `scale(${zoom / 100})`,
            transition: 'transform 0.2s ease',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
          onError={(e) => {
            console.error('Error final cargando imagen:', e);
          }}
        />
      </Box>

      {/* Indicador de método de carga */}
      {loadStrategy !== 'public' && (
        <Box sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(0,0,0,0.7)',
          borderRadius: 1,
          px: 1,
          py: 0.5
        }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <SecurityIcon sx={{ fontSize: '0.8rem', color: 'primary.main' }} />
            <Typography variant="caption" color="primary.main">
              Seguro
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default AuthenticatedImageViewer;
