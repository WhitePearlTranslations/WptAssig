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
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';

/**
 * Componente especializado para mostrar imágenes de Google Drive
 * Utiliza múltiples estrategias de carga y fallbacks
 */
const ImageViewer = ({ 
  file, 
  maxWidth = '100%', 
  maxHeight = '75vh',
  showControls = true 
}) => {
  const [currentUrl, setCurrentUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [urlIndex, setUrlIndex] = useState(0);
  const [zoom, setZoom] = useState(100);

  // URLs alternativas para intentar cargar la imagen
  // Usar las URLs generadas por el servicio si están disponibles
  const imageUrls = file.imageUrls && file.imageUrls.length > 0 
    ? file.imageUrls
    : [
        file.directViewUrl,
        file.thumbnailLink,
        `https://drive.google.com/uc?id=${file.id}`,
        `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`,
        file.previewUrl
      ].filter(Boolean);

  useEffect(() => {
    if (imageUrls.length > 0) {
      setCurrentUrl(imageUrls[0]);
      setUrlIndex(0);
      setLoading(true);
      setError(false);
    }
  }, [file.id]);

  const handleImageError = () => {
    // Intentar con la siguiente URL disponible
    const nextIndex = urlIndex + 1;
    if (nextIndex < imageUrls.length) {
      setUrlIndex(nextIndex);
      setCurrentUrl(imageUrls[nextIndex]);
      setLoading(true);
    } else {
      setError(true);
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleRetry = () => {
    setUrlIndex(0);
    setCurrentUrl(imageUrls[0]);
    setLoading(true);
    setError(false);
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
            La imagen "{file.name}" requiere permisos adicionales o no está disponible públicamente.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Posibles soluciones:</strong><br/>
              • Verificar que la imagen esté compartida públicamente<br/>
              • Abrir en Google Drive para ver permisos<br/>
              • Descargar la imagen si tienes acceso
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
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            {file.name} • {file.formattedSize}
          </Typography>
          
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
        background: 'linear-gradient(135deg, #0f0f17 0%, #1e1b4b 50%, #0f0f23 100%)',
        borderRadius: 2,
        position: 'relative',
        overflow: 'auto',
        minHeight: maxHeight
      }}>
        {loading && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <CircularProgress size={60} />
            <Typography variant="body2" color="text.secondary">
              Cargando imagen...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Método {urlIndex + 1} de {imageUrls.length}
            </Typography>
          </Box>
        )}

        {currentUrl && (
          <img
            src={currentUrl}
            alt={file.name}
            style={{
              maxWidth: maxWidth,
              maxHeight: maxHeight,
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center',
              transition: 'transform 0.3s ease',
              display: loading ? 'none' : 'block'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </Box>

      {/* Información de depuración en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ 
          mt: 1, 
          p: 1, 
          background: 'rgba(0,0,0,0.3)', 
          borderRadius: 1,
          fontSize: '0.75rem'
        }}>
          <Typography variant="caption" color="text.secondary">
            Debug: URL {urlIndex + 1}/{imageUrls.length} - {currentUrl?.substring(0, 60)}...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ImageViewer;
