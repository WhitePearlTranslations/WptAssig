import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Avatar,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Fade,
  Paper,
} from '@mui/material';
import {
  CloudUpload,
  PhotoCamera,
  Delete as DeleteIcon,
  Edit,
  Edit as EditIcon,
  History as HistoryIcon,
  CheckCircle,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ImageSearch,
  BrokenImage,
} from '@mui/icons-material';
import imagekitService from '../services/imagekitService';
import toast from 'react-hot-toast';

const ImageUploader = ({
  userId,
  imageType = 'profile', // 'profile' o 'banner'
  currentImage = null,
  onImageUpdate = null,
  disabled = false,
  showHistory = true,
  maxWidth = 300,
  maxHeight = 300,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [imageHistory, setImageHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [uppyInstance, setUppyInstance] = useState(null);
  const fileInputRef = useRef(null);

  const isProfile = imageType === 'profile';
  const isBanner = imageType === 'banner';

  // Cargar historial de imágenes
  useEffect(() => {
    if (userId && showHistory) {
      loadImageHistory();
    }
  }, [userId, imageType, showHistory]);

  const loadImageHistory = async () => {
    if (!userId) return;

    setLoadingHistory(true);
    try {
      const result = await imagekitService.getUserImageHistory(userId, imageType, 3);
      if (result.success) {
        setImageHistory(result.images);
      }
    } catch (error) {
      console.error('Error cargando historial de imágenes:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Limpiar errores previos
    setValidationError(null);

    // Validar archivo con Uppy/ImageKit
    const validation = imagekitService.validateFile(file, imageType);
    
    if (!validation.isValid) {
      setValidationError(validation.error);
      toast.error(`⚠️ ${validation.error}`, {
        duration: 5000,
        icon: '🚫'
      });
      // Limpiar archivo seleccionado si es inválido
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }

    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.onerror = () => {
      setValidationError('Error al leer el archivo');
      toast.error('Error al generar vista previa del archivo');
      setSelectedFile(null);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) {
      toast.error('No hay archivo seleccionado');
      return;
    }

    if (!imagekitService.isConfigured()) {
      toast.error('ImageKit no está configurado. Contacta al administrador.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Usar el método actualizado con Uppy
      const result = await imagekitService.uploadImage(
        selectedFile,
        imageType,
        userId,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (result.success) {
        // Guardar en historial
        const saveResult = await imagekitService.saveImageToHistory(
          userId,
          result.data,
          imageType
        );

        if (saveResult.success) {
          toast.success(
            `✨ ${isProfile ? 'Imagen de perfil' : 'Banner'} subido exitosamente con Uppy`,
            {
              duration: 4000,
              icon: '🎉'
            }
          );
          
          // Actualizar componente padre con datos completos
          if (onImageUpdate) {
            onImageUpdate(result.data.url, result.data);
          }

          // Limpiar y recargar historial
          setSelectedFile(null);
          setPreviewUrl('');
          await loadImageHistory();
        } else {
          toast.warning('Imagen subida pero error al guardar en historial');
        }
      }
    } catch (error) {
      console.error('Error en subida con Uppy:', error);
      toast.error(error.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSelectFromHistory = async (imageId, imageUrl) => {
    try {
      const result = await imagekitService.setActiveImage(userId, imageId, imageType);
      
      if (result.success) {
        toast.success(`${isProfile ? 'Imagen de perfil' : 'Banner'} actualizado`);
        
        if (onImageUpdate) {
          onImageUpdate(result.url);
        }
        
        setShowHistoryDialog(false);
        await loadImageHistory();
      } else {
        toast.error(result.error || 'Error al seleccionar imagen');
      }
    } catch (error) {
      toast.error('Error al seleccionar imagen del historial');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getImageDimensions = () => {
    if (isProfile) {
      // Para perfil, usar dimensiones cuadradas para que se vea circular
      const size = Math.min(maxWidth, maxHeight, 200);
      return { width: size, height: size };
    } else {
      // Para banner, usar las dimensiones pasadas
      return { width: maxWidth, height: maxHeight };
    }
  };

  const { width, height } = getImageDimensions();

  return (
    <Box sx={{ width: '100%', maxWidth: 500 }}>
      {/* Área principal de imagen */}
      <Card 
        sx={{ 
          mb: 2,
          border: dragOver ? '2px dashed' : '1px solid',
          borderColor: dragOver ? 'primary.main' : 'grey.300',
          transition: 'all 0.3s ease',
          bgcolor: dragOver ? 'primary.50' : 'background.paper'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent sx={{ textAlign: 'center', p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            {isProfile ? '📷 Imagen de Perfil' : '🎨 Banner'}
          </Typography>

          {/* Preview de imagen actual o nueva */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            mb: 2,
            minHeight: 180 // Altura mínima consistente para ambos tipos
          }}>
            {previewUrl ? (
              <Box sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Preview"
                  sx={{
                    width,
                    height,
                    objectFit: 'cover',
                    borderRadius: isProfile ? '50%' : 2,
                    border: '3px solid',
                    borderColor: 'primary.main'
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleRemoveFile}
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : currentImage ? (
              <Box
                component="img"
                src={currentImage}
                alt={`${isProfile ? 'Perfil' : 'Banner'} actual`}
                sx={{
                  width,
                  height,
                  objectFit: 'cover',
                  borderRadius: isProfile ? '50%' : 2,
                  border: '2px solid',
                  borderColor: 'grey.300'
                }}
              />
            ) : (
              <Box
                sx={{
                  width,
                  height,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: isProfile ? '50%' : 2,
                  border: '2px dashed',
                  borderColor: 'grey.300'
                }}
              >
                <PhotoCamera sx={{ fontSize: 48, color: 'grey.500' }} />
              </Box>
            )}
          </Box>

          {/* Error de validación */}
          {validationError && (
            <Alert severity="error" sx={{ mb: 2 }} icon={<BrokenImage />}>
              <Typography variant="body2">
                {validationError}
              </Typography>
            </Alert>
          )}

          {/* Información del archivo seleccionado */}
          {selectedFile && !validationError && (
            <Alert severity="success" sx={{ mb: 2 }} icon={<ImageSearch />}>
              <Typography variant="body2">
                <strong>{selectedFile.name}</strong><br />
                Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB<br />
                <Chip 
                  label="✨ Optimizado con Uppy" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              </Typography>
            </Alert>
          )}

          {/* Barra de progreso */}
          {uploading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" sx={{ mt: 1 }}>
                Subiendo... {uploadProgress}%
              </Typography>
            </Box>
          )}

          {/* Botones de acción */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* Input oculto */}
            <input
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              style={{ display: 'none' }}
              ref={fileInputRef}
              disabled={disabled || uploading}
            />

            {/* Botón seleccionar archivo */}
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              Seleccionar
            </Button>

            {/* Botón subir */}
            {selectedFile && !validationError && (
              <Button
                variant="contained"
                startIcon={uploading ? <CircularProgress size={16} /> : <CheckCircle />}
                onClick={handleUpload}
                disabled={disabled || uploading || validationError}
              >
                {uploading ? 'Subiendo...' : 'Subir'}
              </Button>
            )}


            {/* Botón historial */}
            {showHistory && imageHistory.length > 0 && (
              <Tooltip title={disabled ? '' : 'Ver imágenes anteriores'}>
                <span>
                  <IconButton
                    onClick={() => setShowHistoryDialog(true)}
                    disabled={disabled}
                    sx={{
                      bgcolor: 'secondary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'secondary.dark' }
                    }}
                  >
                    <HistoryIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* Botón refrescar historial */}
            {showHistory && (
              <Tooltip title={disabled || loadingHistory ? '' : 'Actualizar historial'}>
                <span>
                  <IconButton
                    onClick={loadImageHistory}
                    disabled={disabled || loadingHistory}
                  >
                    {loadingHistory ? <CircularProgress size={20} /> : <RefreshIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>

          {/* Mensaje cuando está deshabilitado */}
          {disabled && (
            <Alert severity="info" sx={{ mt: 2 }} icon={<Edit />}>
              <Typography variant="body2">
                🔒 Para subir imágenes, haz clic en <strong>"Editar Perfil"</strong> en la esquina superior derecha
              </Typography>
            </Alert>
          )}
          
          {/* Información de configuración y ayuda */}
          {!disabled && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                💡 Arrastra y suelta una imagen aquí o haz clic en "Seleccionar"
              </Typography>
              
              {!imagekitService.isConfigured() && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Typography variant="caption">
                    ⚠️ ImageKit no está configurado. Contacta al administrador.
                  </Typography>
                </Alert>
              )}
              
              {imagekitService.isConfigured() && (
                <Chip 
                  label="✅ ImageKit + Uppy Configurado" 
                  size="small" 
                  color="success" 
                  variant="filled"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de historial */}
      <Dialog
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Historial de {isProfile ? 'Imágenes de Perfil' : 'Banners'}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {loadingHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : imageHistory.length === 0 ? (
            <Alert severity="info">
              No hay imágenes en el historial
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {imageHistory.map((image, index) => (
                <Grid item xs={4} key={image.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: image.isActive ? '2px solid' : '1px solid',
                      borderColor: image.isActive ? 'primary.main' : 'grey.300',
                      '&:hover': {
                        borderColor: 'primary.light',
                        transform: 'scale(1.02)',
                        transition: 'all 0.2s ease'
                      }
                    }}
                    onClick={() => handleSelectFromHistory(image.id, image.url)}
                  >
                    <Box
                      component="img"
                      src={image.thumbnailUrl || image.url}
                      alt={`${imageType} ${index + 1}`}
                      sx={{
                        width: '100%',
                        height: isProfile ? 120 : 60,
                        objectFit: 'cover'
                      }}
                    />
                    <CardContent sx={{ p: 1, textAlign: 'center' }}>
                      <Typography variant="caption" display="block">
                        {new Date(image.uploadedAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(image.size / 1024).toFixed(0)} KB
                      </Typography>
                      {image.isActive && (
                        <Chip
                          label="Actual"
                          size="small"
                          color="primary"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowHistoryDialog(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageUploader;
