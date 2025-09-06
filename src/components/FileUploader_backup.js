import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Description as FileIcon,
  Folder as FolderIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import Uppy from '@uppy/core';
import googleDriveService from '../services/googleDriveService';

// Importar estilos CSS de Uppy
import '@uppy/core/dist/style.css';

// Función helper para formatear tamaño de archivos
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUploader = ({ 
  assignment, 
  onUploadComplete, 
  onUploadError,
  open,
  onClose 
}) => {
  const [uppy, setUppy] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [error, setError] = useState(null);
  const [folderId, setFolderId] = useState(null);
  const [folderInfo, setFolderInfo] = useState(null);
  const [driveAuthenticated, setDriveAuthenticated] = useState(false);
  const [hasDirectoryStructure, setHasDirectoryStructure] = useState(false);
  const uppyRef = useRef(null);


  useEffect(() => {
    if (assignment) {
      const driveLink = assignment.driveLink || assignment.drive_link || assignment.googleDriveLink;
      
      if (driveLink) {
        const validation = validateFolderLink(driveLink);
        
        if (validation.isValid) {
          setFolderId(validation.folderId);
          setError(null);
          loadFolderInfo(validation.folderId);
        } else {
          setError(`${validation.error}. ${validation.details}`);
        }
      } else {
        setError(
          'Esta asignación no tiene un enlace de Google Drive configurado. ' +
          'Contacta al administrador para agregar el enlace a la carpeta de destino.'
        );
      }
    } else {
      setError('No se pudo cargar la información de la asignación.');
    }
  }, [assignment]);

  useEffect(() => {
    if (open && !uppy) {
      initializeUppy();
    }
    
    return () => {
      if (uppyRef.current) {
        try {
          uppyRef.current.destroy();
        } catch (error) {
          // Silently handle cleanup error
        }
        uppyRef.current = null;
        setUppy(null);
      }
    };
  }, [open]);

  const initializeUppy = () => {
    try {
      // Limpiar instancia previa si existe
      if (uppyRef.current) {
        try {
          uppyRef.current.destroy();
        } catch (error) {
          // Silently handle cleanup error
        }
      }

      const uppyInstance = new Uppy({
        id: `assignment-uploader-${Date.now()}`, // ID único
        autoProceed: false,
        restrictions: {
          maxFileSize: parseInt(process.env.REACT_APP_UPPY_MAX_FILE_SIZE) || 100000000, // 100MB
          maxNumberOfFiles: parseInt(process.env.REACT_APP_UPPY_MAX_FILES) || 50,
          allowedFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', '.rar', '.7z', '.psd', '.ai', '.eps', '.docx','.txt']
        },
        meta: {
          assignmentId: assignment?.id,
          assignmentType: assignment?.type,
          chapter: assignment?.chapter,
          manga: assignment?.mangaTitle || assignment?.manga
        }
      });

      // Configurar eventos de Uppy
      uppyInstance.on('file-added', (file) => {
        setError(null);
        
        if (file.data && file.data.webkitRelativePath && file.data.webkitRelativePath.includes('/')) {
          setHasDirectoryStructure(true);
        }
      });

      uppyInstance.on('file-removed', (file) => {
        const remainingFiles = uppyInstance.getFiles();
        const hasStructure = remainingFiles.some(f => 
          f.data && f.data.webkitRelativePath && f.data.webkitRelativePath.includes('/')
        );
        setHasDirectoryStructure(hasStructure);
      });

      uppyRef.current = uppyInstance;
      setUppy(uppyInstance);
    } catch (error) {
      setError('Error inicializando el componente de subida. Por favor, recarga la página.');
    }
  };

  const validateFolderLink = (driveLink) => {
    
    if (!driveLink || typeof driveLink !== 'string') {
      return {
        isValid: false,
        error: 'No se proporcionó un enlace de Google Drive',
        details: 'El campo driveLink está vacío o no es una cadena de texto'
      };
    }

    // Verificar que sea un enlace de Google Drive
    if (!driveLink.includes('drive.google.com') && !driveLink.includes('docs.google.com')) {
      return {
        isValid: false,
        error: 'El enlace no parece ser de Google Drive',
        details: `Enlace recibido: ${driveLink}`
      };
    }

    // Intentar extraer ID de carpeta
    const folderId = googleDriveService.extractFolderIdFromUrl(driveLink);
    
    if (!folderId) {
      return {
        isValid: false,
        error: 'No se pudo extraer el ID de la carpeta del enlace',
        details: `El enlace '${driveLink}' no tiene un formato válido para extraer el ID de carpeta`
      };
    }

    return {
      isValid: true,
      folderId: folderId,
      details: `ID de carpeta extraído correctamente: ${folderId}`
    };
  };

  const loadFolderInfo = async (folderId) => {
    try {
      // Verificar configuración antes de intentar cargar
      const apiKey = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      
      if (!apiKey || !clientId) {
        setError('Las credenciales de Google Drive no están configuradas correctamente. Contacta al administrador.');
        return;
      }
      
      const apiKeyWorks = await googleDriveService.testApiKey();
      if (!apiKeyWorks) {
        setError('La API Key de Google Drive no está configurada. Contacta al administrador.');
        return;
      }
      
      await googleDriveService.loadGapi();
      await googleDriveService.signIn();
      setDriveAuthenticated(true);
      
      const info = await googleDriveService.getFolderInfo(folderId);
      setFolderInfo(info);
      setError(null);
    } catch (error) {
      
      if (error.message.includes('API keys not configured')) {
        setError('Las credenciales de Google Drive no están configuradas. Contacta al administrador.');
      } else if (error.message.includes('Failed to sign in')) {
        setError('No se pudo autenticar con Google Drive. Por favor, permite el acceso e intenta de nuevo.');
      } else if (error.message.includes('HTTP error! status: 502')) {
        setError('Error temporal de los servidores de Google. Inténtalo de nuevo en unos minutos.');
      } else if (error.message.includes('API Key error')) {
        setError('Problema con la API Key de Google Drive. Contacta al administrador.');
      } else if (error.message.includes('404') || error.message.includes('File not found')) {
        setError('La carpeta de Google Drive no existe o no tienes acceso a ella. Verifica que el enlace sea correcto y que tengas permisos.');
      } else {
        setError(`Error conectando con Google Drive: ${error.message}`);
      }
    }
  };

  const handleStartUpload = async () => {
    if (!uppy || uppy.getFiles().length === 0) {
      setError('Por favor, selecciona al menos un archivo para subir.');
      return;
    }

    if (!folderId) {
      setError('No se pudo obtener la carpeta de destino. Verifica el enlace de Google Drive.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadResults(null);

      if (!driveAuthenticated) {
        await googleDriveService.signIn();
        setDriveAuthenticated(true);
      }

      const uppyFiles = uppy.getFiles();
      const files = uppyFiles.map(uppyFile => uppyFile.data);
      
      const results = await googleDriveService.uploadFilesWithStructure(
        files,
        folderId,
        (progress, fileName) => {
          setUploadProgress(progress);
        },
        hasDirectoryStructure
      );

      setUploadResults(results);
      
      // Verificar si todos los archivos se subieron correctamente
      const successfulUploads = results.filter(r => r.success);
      const failedUploads = results.filter(r => !r.success);

      if (successfulUploads.length > 0) {
        // Al menos algunos archivos se subieron exitosamente
        onUploadComplete({
          totalFiles: results.length,
          successfulUploads: successfulUploads.length,
          failedUploads: failedUploads.length,
          results: results
        });
      }

      if (failedUploads.length > 0) {
        setError(`${failedUploads.length} archivo(s) no se pudieron subir correctamente.`);
      }

    } catch (error) {
      setUploading(false);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error desconocido durante la subida';
      
      if (error.message) {
        errorMessage = `Error: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.status) {
        errorMessage = `Error HTTP ${error.status}: ${error.statusText || 'Error del servidor'}`;
      } else {
        errorMessage = `Error durante la subida: ${JSON.stringify(error)}`;
      }
      
      setError(errorMessage);
      onUploadError(error);
    }
  };

  const handleUploadComplete = (result) => {
    // Upload completed
  };

  const handleRetryAuthentication = async () => {
    try {
      setError(null);
      await googleDriveService.signIn();
      setDriveAuthenticated(true);
      
      if (folderId) {
        await loadFolderInfo(folderId);
      }
    } catch (error) {
      setError('Error al autenticar con Google Drive. Por favor, intenta de nuevo.');
    }
  };

  const handleClose = () => {
    if (uppyRef.current) {
      try {
        uppyRef.current.cancelAll();
        uppyRef.current.destroy();
      } catch (error) {
        // Silently handle cleanup error
      }
      uppyRef.current = null;
    }
    setUppy(null);
    setUploadProgress(0);
    setUploading(false);
    setUploadResults(null);
    setError(null);
    setHasDirectoryStructure(false); // Limpiar estado de estructura
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '500px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon color="primary" />
          <Typography variant="h6">
            Subir Archivos - {assignment?.type || 'Tarea'} 
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Información de la asignación o grupo */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {assignment?.isGroup ? 'Detalles del Grupo de Asignaciones' : 'Detalles de la Asignación'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Chip label={assignment?.mangaTitle || assignment?.manga} size="small" color="primary" />
            <Chip label={`Capítulo ${assignment?.chapter}`} size="small" />
            {assignment?.isGroup ? (
              <Chip label={`${assignment.totalTasks} tareas`} size="small" variant="outlined" color="secondary" />
            ) : (
              <Chip label={assignment?.type} size="small" variant="outlined" />
            )}
          </Box>
          
          {assignment?.isGroup && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
              {assignment.taskTypes?.map((taskType, index) => (
                <Chip key={index} label={taskType} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              ))}
            </Box>
          )}
          
          {folderInfo && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <FolderIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Destino: {folderInfo.name}
              </Typography>
            </Box>
          )}
          
          {/* Indicador de autenticación */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: driveAuthenticated ? '#10b981' : '#ef4444'
            }} />
            <Typography variant="caption" color="text.secondary">
              Google Drive: {driveAuthenticated ? 'Conectado' : 'Desconectado'}
              {driveAuthenticated && googleDriveService.isTokenValid() && 
                ' (sesión guardada)'
              }
            </Typography>
          </Box>
        </Paper>


        {/* Mensaje de éxito cuando todo está conectado */}
        {!error && folderInfo && driveAuthenticated && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              ✅ Conectado exitosamente a Google Drive. Listo para subir archivos.
            </Typography>
          </Alert>
        )}
        
        {/* Mensajes de error (solo si no tenemos carpeta válida) */}
        {error && !folderInfo && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                {!driveAuthenticated && (
                  <Button color="inherit" size="small" onClick={handleRetryAuthentication}>
                    <RefreshIcon sx={{ mr: 1 }} />
                    Reintentar
                  </Button>
                )}
              </Box>
            }
          >
            {error}
          </Alert>
        )}

        {/* Zona de arrastrar y soltar */}
        {uppy && !uploading && !uploadResults && (
          <Box sx={{ mb: 2 }}>
            {/* Selectores de archivos y carpetas */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              {/* Selector de archivos individuales */}
              <Paper 
                sx={{ 
                  p: 3, 
                  flex: 1,
                  textAlign: 'center', 
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.zip,.rar,.7z,.psd,.ai,.eps,.docx,.txt"
                  onChange={(e) => {
                    Array.from(e.target.files).forEach(file => {
                      uppy.addFile({
                        name: file.name,
                        type: file.type,
                        data: file,
                        source: 'Local',
                        isRemote: false
                      });
                    });
                  }}
                  style={{ display: 'none' }}
                  id="file-input"
                />
                <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
                  <FileIcon sx={{ fontSize: '2rem', color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" color="primary" sx={{ fontSize: '1rem' }}>
                    Archivos Individuales
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                    Selecciona archivos uno por uno
                  </Typography>
                </label>
              </Paper>
              
              {/* Selector de carpeta completa */}
              <Paper 
                sx={{ 
                  p: 3, 
                  flex: 1,
                  textAlign: 'center', 
                  border: '2px dashed #f59e0b',
                  borderRadius: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: '#d97706',
                    bgcolor: 'rgba(245, 158, 11, 0.05)'
                  }
                }}
              >
                <input
                  type="file"
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={(e) => {
                    const fileList = Array.from(e.target.files);
                    let hasStructure = false;
                    
                    fileList.forEach(file => {
                      // Filtrar solo archivos permitidos
                      const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', '.rar', '.7z', '.psd', '.ai', '.eps','.docx','.txt'];
                      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                      
                      if (allowedTypes.includes(fileExtension)) {
                        // Verificar si tiene estructura de carpetas
                        if (file.webkitRelativePath && file.webkitRelativePath.includes('/')) {
                          hasStructure = true;
                        }
                        
                        uppy.addFile({
                          name: file.name,
                          type: file.type,
                          data: file,
                          source: 'LocalFolder',
                          isRemote: false
                        });
                      }
                    });
                    
                    if (hasStructure) {
                      setHasDirectoryStructure(true);
                    }
                  }}
                  style={{ display: 'none' }}
                  id="folder-input"
                />
                <label htmlFor="folder-input" style={{ cursor: 'pointer', display: 'block' }}>
                  <FolderIcon sx={{ fontSize: '2rem', color: '#f59e0b', mb: 1 }} />
                  <Typography variant="h6" sx={{ color: '#f59e0b', fontSize: '1rem' }}>
                    Carpeta Completa
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                    Sube todos los archivos de una carpeta
                  </Typography>
                </label>
              </Paper>
            </Box>
            
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Soporta: JPG, PNG, PDF, ZIP, RAR, 7Z, PSD, AI, EPS | 
                Máximo: {Math.floor((parseInt(process.env.REACT_APP_UPPY_MAX_FILE_SIZE) || 100000000) / 1000000)}MB por archivo
              </Typography>
              {hasDirectoryStructure && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                  <FolderIcon fontSize="small" color="success" />
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                    Estructura de carpetas detectada - se preservará en Google Drive
                  </Typography>
                </Box>
              )}
            </Box>
            
            {uppy.getFiles().length > 0 && (
              <Paper sx={{ mt: 2, p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Archivos seleccionados ({uppy.getFiles().length})
                </Typography>
                <List dense>
                  {uppy.getFiles().map((file) => (
                    <ListItem key={file.id}>
                      <ListItemIcon>
                        <FileIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={file.name}
                        secondary={formatFileSize(file.size)}
                      />
                      <IconButton 
                        size="small" 
                        onClick={() => uppy.removeFile(file.id)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        )}

        {/* Progreso de subida */}
        {uploading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Subiendo archivos... {Math.round(uploadProgress)}%
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        {/* Resultados de la subida */}
        {uploadResults && (
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              Resultado de la Subida
            </Typography>
            <List>
              {uploadResults.map((result, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {result.success ? (
                      <SuccessIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.file}
                    secondary={
                      result.success 
                        ? 'Subido exitosamente' 
                        : `Error: ${result.error}`
                    }
                  />
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<SuccessIcon />}
                label={`${uploadResults.filter(r => r.success).length} exitosos`}
                color="success"
                size="small"
              />
              {uploadResults.filter(r => !r.success).length > 0 && (
                <Chip 
                  icon={<ErrorIcon />}
                  label={`${uploadResults.filter(r => !r.success).length} fallidos`}
                  color="error"
                  size="small"
                />
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {uploadResults ? 'Cerrar' : 'Cancelar'}
        </Button>
        
        {!uploading && !uploadResults && uppy && uppy.getFiles().length > 0 && (
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleStartUpload}
            disabled={!driveAuthenticated}
          >
            Subir Archivos
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FileUploader;
