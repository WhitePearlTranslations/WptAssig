import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

/**
 * Componente alternativo para mostrar imágenes en desarrollo
 * Cuando las URLs de Google Drive fallan en localhost
 */
const DevelopmentImageFallback = ({ file, onRetry }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // URLs para probar en desarrollo
  const developmentUrls = [
    `https://drive.google.com/file/d/${file.id}/view`,
    `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`,
    `https://lh3.googleusercontent.com/d/${file.id}=w1000`,
    file.webViewLink,
    file.thumbnailLink
  ].filter(Boolean);
  
  return (
    <Card sx={{
      minHeight: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
      border: '2px dashed rgba(245, 158, 11, 0.3)'
    }}>
      <CardContent sx={{ textAlign: 'center', maxWidth: '600px' }}>
        <ImageIcon sx={{ fontSize: '4rem', color: '#f59e0b', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#f59e0b' }}>
          🏠 Modo Desarrollo
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          La imagen <strong>"{file.name}"</strong> no se puede cargar directamente en localhost
          debido a las restricciones de CORS de Google Drive.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="body2">
            <strong>¿Por qué pasa esto?</strong><br/>
            • Google Drive bloquea solicitudes desde localhost por seguridad<br/>
            • En producción (dominio real), esto funcionará correctamente<br/>
            • Es un comportamiento normal en desarrollo local
          </Typography>
        </Alert>

        <Stack direction="column" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<OpenInNewIcon />}
            href={`https://drive.google.com/file/d/${file.id}/view`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              backgroundColor: '#f59e0b',
              '&:hover': { backgroundColor: '#d97706' }
            }}
          >
            Ver Imagen en Google Drive
          </Button>
          
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              sx={{
                borderColor: '#f59e0b',
                color: '#f59e0b'
              }}
            >
              Reintentar Carga
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CodeIcon />}
              onClick={() => setShowDetails(!showDetails)}
              sx={{
                borderColor: '#6b7280',
                color: '#6b7280'
              }}
            >
              {showDetails ? 'Ocultar' : 'Ver'} Detalles
            </Button>
          </Stack>
        </Stack>

        {showDetails && (
          <Card sx={{ mt: 3, bgcolor: 'rgba(0,0,0,0.05)', textAlign: 'left' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                URLs intentadas:
              </Typography>
              {developmentUrls.map((url, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.8rem',
                      color: 'text.secondary',
                      wordBreak: 'break-all'
                    }}
                  >
                    {index + 1}. {url}
                  </Typography>
                  <Tooltip title="Probar esta URL">
                    <IconButton
                      size="small"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ ml: 1 }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
              
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>✅ En producción:</strong> Estas URLs funcionarán automáticamente
                  sin necesidad de abrir enlaces externos.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        )}
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          ID de archivo: {file.id}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DevelopmentImageFallback;