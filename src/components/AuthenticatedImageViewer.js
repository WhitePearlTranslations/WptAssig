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
import DevelopmentImageFallback from './DevelopmentImageFallback';

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

  // URLs públicas para intentar primero - optimizadas para evitar CORS
  const publicUrls = file.imageUrls || [
    // Primero intentar con la URL de thumbnail si está disponible
    file.thumbnailLink,
    // URLs con mejor compatibilidad de CORS
    `https://drive.google.com/thumbnail?id=${file.id}&sz=w2000`,
    `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`,
    `https://lh3.googleusercontent.com/d/${file.id}=w1000`,
    `https://lh3.googleusercontent.com/d/${file.id}=s1000`,
    // Como último recurso, las URLs tradicionales
    `https://drive.google.com/uc?id=${file.id}&export=view`,
    `https://drive.google.com/uc?id=${file.id}`
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
      let retryCount = 0;
      const maxRetries = 2; // Reducir reintentos para desarrollo
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      const tryNextUrl = () => {
        if (urlIndex >= publicUrls.length) {
          // En localhost, mostrar directamente el componente de desarrollo
          if (isLocalhost) {
            console.log('🏠 Localhost detectado - todas las URLs públicas fallaron');
            setError('desarrollo - URLs públicas no funcionan en localhost');
            setLoading(false);
            return;
          } else {
            // En producción, intentar con autenticación
            setLoadStrategy('authenticated');
            loadImage();
            return;
          }
        }

        const url = publicUrls[urlIndex];
        if (!url) {
          urlIndex++;
          tryNextUrl();
          return;
        }

        const img = new Image();
        
        // Configuración especial para localhost
        if (isLocalhost) {
          // En localhost, no usar crossOrigin para evitar problemas
          img.crossOrigin = null;
          
          // Agregar un timeout más corto para localhost
          const timeout = setTimeout(() => {
            console.log(`⏰ Timeout en localhost para ${url}`);
            urlIndex++;
            tryNextUrl();
          }, 3000); // 3 segundos timeout
          
          img.onload = () => {
            clearTimeout(timeout);
            setImageUrl(url);
            setLoading(false);
            resolve();
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            console.warn(`🏠 Error localhost cargando imagen desde ${url}`);
            // En localhost, avanzar rápidamente a la siguiente URL
            urlIndex++;
            tryNextUrl();
          };
          
        } else {
          // Configuración para producción (comportamiento original)
          if (url.includes('lh3.googleusercontent.com') || url.includes('thumbnail')) {
            img.crossOrigin = null;
          } else {
            img.crossOrigin = 'anonymous';
          }
          
          img.onload = () => {
            setImageUrl(url);
            setLoading(false);
            resolve();
          };
          
          img.onerror = (e) => {
            console.warn(`📇 Error cargando imagen desde ${url}:`, e);
            
            // Si el error podría ser de rate limiting, esperar antes de continuar
            if (retryCount < maxRetries && (url.includes('drive.google.com') || url.includes('googleapis.com'))) {
              retryCount++;
              const delay = Math.pow(2, retryCount) * 1000;
              console.log(`⏱️ Esperando ${delay}ms antes de reintentar...`);
              setTimeout(() => {
                tryNextUrl(); // Reintentar la misma URL
              }, delay);
            } else {
              // Avanzar a la siguiente URL
              retryCount = 0;
              urlIndex++;
              tryNextUrl();
            }
          };
        }
        
        img.src = url;
      };

      tryNextUrl();
    });
  };

  const tryAuthenticatedUrl = async () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    try {
      console.log(`🔐 Intentando autenticación para imagen ${file.id}${isLocalhost ? ' (localhost)' : ''}`);
      const authenticatedUrl = await googleDriveService.getAuthenticatedImageUrl(file.id);
      setImageUrl(authenticatedUrl);
      setLoading(false);
    } catch (err) {
      console.warn(`🔐 Error en autenticación: ${err.message}`);
      
      if (isLocalhost) {
        // En localhost, mostrar el componente de desarrollo directamente
        setError('desarrollo - autenticación fallida');
        setLoading(false);
      } else {
        // En producción, intentar con DataURL
        setLoadStrategy('dataurl');
        loadImage();
      }
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
            {loadStrategy === 'public' && (window.location.hostname === 'localhost' 
              ? 'Cargando imagen desde Google Drive (desarrollo)...' 
              : 'Probando diferentes URLs de imagen...')}
            {loadStrategy === 'authenticated' && 'Accediendo con credenciales de Google Drive...'}
            {loadStrategy === 'dataurl' && 'Descargando y convirtiendo imagen...'}
          </Typography>
          {loadStrategy === 'public' && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {window.location.hostname === 'localhost' 
                ? 'En desarrollo, Google Drive puede requerir autenticación'
                : 'Si esto toma mucho tiempo, puede ser un problema temporal de Google Drive'}
            </Typography>
          )}
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
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // En localhost, mostrar el componente de desarrollo especial
    if (isLocalhost && (error.includes('desarrollo') || error.includes('localhost') || loadStrategy === 'public')) {
      return (
        <DevelopmentImageFallback 
          file={file} 
          onRetry={handleRetry}
        />
      );
    }
    
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
              <strong>Posibles causas y soluciones:</strong><br/>
              {error.includes('429') || error.includes('Too Many Requests') ? (
                <>
                  • 🕰️ <strong>Demasiadas solicitudes:</strong> Google Drive está limitando las peticiones<br/>
                  • Espera unos minutos e intenta nuevamente<br/>
                  • El problema suele resolverse automáticamente
                </>
              ) : error.includes('403') || error.includes('Forbidden') ? (
                <>
                  • 🔒 <strong>Permisos insuficientes:</strong> La imagen no está compartida públicamente<br/>
                  • Verifica que el archivo tenga permisos de "Cualquiera con el enlace"<br/>
                  • Asegúrate de estar autenticado con la cuenta correcta
                </>
              ) : error.includes('CORS') || error.includes('cors') ? (
                <>
                  • 🌐 <strong>Restricciones de seguridad:</strong> Google Drive bloqueó la carga<br/>
                  • Esto es temporal y puede resolverse actualizando<br/>
                  • Usa el botón "Ver en Google Drive" como alternativa
                </>
              ) : (
                <>
                  • Verificar que la imagen esté compartida públicamente<br/>
                  • Asegurarse de estar autenticado en Google Drive<br/>
                  • Verificar permisos de la carpeta contenedora<br/>
                  • La imagen podría estar en una carpeta privada
                </>
              )}
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
              href={file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                backgroundColor: '#ef4444',
                '&:hover': { backgroundColor: '#dc2626' }
              }}
            >
              Ver en Google Drive
            </Button>
            {/* Botón especial para desarrollo */}
            {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                href={`https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderColor: '#f59e0b',
                  color: '#f59e0b',
                  '&:hover': {
                    backgroundColor: 'rgba(245, 158, 11, 0.1)'
                  }
                }}
              >
                Abrir Imagen Directa
              </Button>
            )}
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
