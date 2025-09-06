import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Tooltip,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon,
  Description as DocumentIcon,
  TableChart as SpreadsheetIcon,
  Slideshow as PresentationIcon,
  Archive as ArchiveIcon,
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Refresh as RefreshIcon,
  Login as LoginIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import googleDriveService from '../services/googleDriveService';
import { extractDriveFolderId } from '../utils/driveUtils';
import ImageViewer from './ImageViewer';
import AuthenticatedImageViewer from './AuthenticatedImageViewer';
import FileListItem from './FileListItem';

const DriveFileList = ({ 
  assignment, 
  folderId: propFolderId, 
  folderUrl,
  onFileSelect = null,
  showPreview = true,
  maxHeight = '70vh'
}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewDialog, setPreviewDialog] = useState({ open: false, file: null });
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [authNeeded, setAuthNeeded] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const folderId = propFolderId || extractDriveFolderId(assignment?.driveLink || folderUrl);

  // Función simple para iconos - definida temprano para evitar problemas de scope
  const getFileIcon = useCallback((file) => {
    if (!file) return <FileIcon sx={{ color: '#6b7280' }} />;
    if (file.type === 'folder' || file.category === 'folder' || file.isFolder) {
      return <FolderIcon sx={{ color: '#f59e0b' }} />;
    }
    if (file.category === 'image') return <ImageIcon sx={{ color: '#10b981' }} />;
    if (file.type === 'pdf') return <PdfIcon sx={{ color: '#ef4444' }} />;
    return <FileIcon sx={{ color: file.color || '#6b7280' }} />;
  }, []);

  useEffect(() => {
    if (folderId) {
      // Inicializar breadcrumb con carpeta raíz
      setBreadcrumb([{
        id: folderId,
        name: assignment?.mangaTitle || 'Carpeta principal',
        isRoot: true
      }]);
      setCurrentFolderId(folderId);
      loadFiles();
    }
  }, [folderId]);

  const loadFiles = async (targetFolderId = null, folderName = null) => {
    const folderIdToUse = targetFolderId || currentFolderId || folderId;
    setLoading(true);
    setError(null);
    setAuthNeeded(false);

    try {
      console.log('📂 Cargando archivos de carpeta:', folderIdToUse);
      
      // Verificar autenticación
      if (!googleDriveService.isSignedIn || !googleDriveService.isTokenValid()) {
        setAuthNeeded(true);
        setLoading(false);
        return;
      }

      const result = await googleDriveService.listFolderFiles(folderIdToUse, 50);
      setFiles(result.files || []);
      console.log('✅ Archivos cargados:', result.files?.length || 0);
      
      // Actualizar estado de navegación
      setCurrentFolderId(folderIdToUse);
      
      // Si navegamos a una subcarpeta, actualizar breadcrumb
      if (targetFolderId && folderName) {
        setBreadcrumb(prev => {
          // Verificar si ya existe para evitar duplicados
          const exists = prev.some(item => item.id === targetFolderId);
          if (!exists) {
            return [...prev, { id: targetFolderId, name: folderName, isRoot: false }];
          }
          return prev;
        });
        console.log('📍 Navegando a subcarpeta:', targetFolderId, folderName);
      }
      
    } catch (err) {
      console.error('💥 Error cargando archivos:', err);
      if (err.message.includes('autenticado') || err.message.includes('Sesión expirada')) {
        setAuthNeeded(true);
      } else {
        setError(err.message || 'Error cargando archivos de la carpeta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await googleDriveService.signIn();
      await loadFiles();
    } catch (err) {
      setError('Error al iniciar sesión en Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = useCallback((file, index) => {
    setCurrentFileIndex(index);
    if (onFileSelect) {
      onFileSelect(file);
    }
    
    // Si es una carpeta, cargar su contenido
    if (file.type === 'folder' || file.category === 'folder' || file.isFolder) {
      console.log('📁 Clic en carpeta:', file.name);
      // Navegar a la subcarpeta
      loadFiles(file.id, file.name);
      return;
    }
    
    if (showPreview && file.canPreview) {
      setPreviewDialog({ open: true, file });
    }
  }, [onFileSelect, showPreview, loadFiles]);

  const handleClosePreview = () => {
    setPreviewDialog({ open: false, file: null });
  };

  const handleBreadcrumbClick = (breadcrumbItem, index) => {
    console.log('🍞 Navegando a:', breadcrumbItem.name);
    
    // Actualizar breadcrumb quitando elementos posteriores
    setBreadcrumb(prev => prev.slice(0, index + 1));
    
    // Cargar contenido de la carpeta seleccionada
    setCurrentFolderId(breadcrumbItem.id);
    loadFiles(breadcrumbItem.id);
  };

  const handleNextFile = () => {
    if (currentFileIndex < files.length - 1) {
      const nextIndex = currentFileIndex + 1;
      const nextFile = files[nextIndex];
      setCurrentFileIndex(nextIndex);
      if (nextFile.canPreview) {
        setPreviewDialog({ open: true, file: nextFile });
      }
    }
  };

  const handlePrevFile = () => {
    if (currentFileIndex > 0) {
      const prevIndex = currentFileIndex - 1;
      const prevFile = files[prevIndex];
      setCurrentFileIndex(prevIndex);
      if (prevFile.canPreview) {
        setPreviewDialog({ open: true, file: prevFile });
      }
    }
  };

  // Configuración de virtualización
  const itemHeight = 80;
  const overscan = 5;

  // Cálculos de virtualización memoizados
  const virtualizedData = useMemo(() => {
    const maxHeightValue = parseInt(maxHeight.replace('vh', ''));
    const containerHeight = Math.min(
      maxHeightValue * window.innerHeight / 100 - 200,
      600
    );
    
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const totalHeight = files.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(files.length - 1, startIndex + visibleCount + overscan * 2);
    const visibleItems = files.slice(startIndex, endIndex + 1);

    return {
      containerHeight,
      totalHeight,
      startIndex,
      endIndex,
      visibleItems,
      offsetY: startIndex * itemHeight
    };
  }, [files, scrollTop, maxHeight]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);


  // Componente de autenticación
  if (authNeeded) {
    return (
      <Card sx={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(99, 102, 241, 0.05)',
        border: '2px dashed rgba(99, 102, 241, 0.2)'
      }}>
        <CardContent sx={{ textAlign: 'center', maxWidth: '500px' }}>
          <LoginIcon sx={{ fontSize: '4rem', color: '#6366f1', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#6366f1' }}>
            Autenticación requerida
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Para mostrar el contenido de la carpeta, necesitas autenticarte con Google Drive.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={handleSignIn}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              px: 4,
              py: 1.5,
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Conectando...' : 'Conectar con Google Drive'}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Esto te permitirá ver los archivos de la carpeta sin salir de la página.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Estado de carga
  if (loading) {
    return (
      <Card sx={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">Cargando archivos...</Typography>
          <Typography variant="body2" color="text.secondary">
            Conectando con Google Drive
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Estado de error
  if (error) {
    return (
      <Alert severity="error" sx={{ minHeight: '200px', display: 'flex', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Error cargando archivos
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadFiles}
            color="inherit"
          >
            Reintentar
          </Button>
        </Box>
      </Alert>
    );
  }

  // Sin archivos
  if (files.length === 0) {
    return (
      <Card sx={{
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <FolderIcon sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Carpeta vacía
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No se encontraron archivos en esta carpeta
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header con estadísticas */}
      <Paper sx={{ p: 2, mb: 3, background: 'rgba(15, 15, 25, 0.8)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FolderIcon color="warning" />
              Archivos de la carpeta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {files.length} archivo{files.length !== 1 ? 's' : ''} encontrado{files.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadFiles}
            disabled={loading}
            size="small"
          >
            Actualizar
          </Button>
        </Box>
      </Paper>

      {/* Breadcrumb Navigation */}
      {breadcrumb.length > 1 && (
        <Paper sx={{ p: 2, mb: 2, background: 'rgba(15, 15, 25, 0.8)' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            🍞 Navegación:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
            {breadcrumb.map((item, index) => (
              <React.Fragment key={item.id}>
                <Button
                  size="small"
                  variant={index === breadcrumb.length - 1 ? "contained" : "text"}
                  color="primary"
                  onClick={() => handleBreadcrumbClick(item, index)}
                  sx={{ 
                    textTransform: 'none',
                    minWidth: 'auto',
                    fontSize: '0.875rem'
                  }}
                >
                  {item.name}
                </Button>
                {index < breadcrumb.length - 1 && (
                  <Typography variant="body2" color="text.secondary">
                    /
                  </Typography>
                )}
              </React.Fragment>
            ))}
          </Box>
        </Paper>
      )}

      {/* Lista de archivos virtualizada - Optimizada */}
      <Paper sx={{ 
        background: 'rgba(15, 15, 25, 0.8)', 
        borderRadius: 2, 
        overflow: 'hidden'
      }}>
        <Box 
          sx={{ 
            height: virtualizedData.containerHeight, 
            overflow: 'auto',
            width: '100%'
          }}
          onScroll={handleScroll}
        >
          <Box sx={{ height: virtualizedData.totalHeight, position: 'relative' }}>
            <Box 
              sx={{ 
                transform: `translateY(${virtualizedData.offsetY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0
              }}
            >
              {virtualizedData.visibleItems.map((file, index) => {
                const actualIndex = virtualizedData.startIndex + index;
                return (
                  <FileListItem
                    key={file.id}
                    file={file}
                    index={actualIndex}
                    onFileClick={handleFileClick}
                    style={{ height: itemHeight }}
                  />
                );
              })}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Dialog de vista previa */}
      <Dialog
        open={previewDialog.open}
        onClose={handleClosePreview}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '95vh',
            height: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {previewDialog.file && getFileIcon(previewDialog.file)}
              <Box>
                <Typography variant="h6" component="span">
                  {previewDialog.file?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                  {previewDialog.file?.formattedSize} • {previewDialog.file?.formattedDate}
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1}>
              {files.length > 1 && (
                <>
                  <Tooltip title="Archivo anterior">
                    <span>
                      <IconButton
                        onClick={handlePrevFile}
                        disabled={currentFileIndex === 0}
                        size="small"
                      >
                        <PrevIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                    {currentFileIndex + 1} de {files.length}
                  </Typography>
                  <Tooltip title="Siguiente archivo">
                    <span>
                      <IconButton
                        onClick={handleNextFile}
                        disabled={currentFileIndex === files.length - 1}
                        size="small"
                      >
                        <NextIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
              <IconButton onClick={handleClosePreview} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {previewDialog.file && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {previewDialog.file.category === 'image' ? (
                // Usar AuthenticatedImageViewer especializado para imágenes
                <AuthenticatedImageViewer 
                  file={previewDialog.file}
                  maxHeight="75vh"
                  showControls={true}
                />
              ) : (
                // Visor con iframe para otros tipos de archivo
                <Box sx={{ position: 'relative', height: '75vh' }}>
                  <iframe
                    src={previewDialog.file.previewUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    title={`Vista previa - ${previewDialog.file.name}`}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    onLoad={(e) => {
                      // Ocultar el loading cuando carga
                      const loadingEl = e.target.previousElementSibling;
                      if (loadingEl) loadingEl.style.display = 'none';
                    }}
                    onError={(e) => {
                      // Mostrar mensaje de error si el iframe falla
                      const errorEl = e.target.nextElementSibling;
                      if (errorEl) {
                        errorEl.style.display = 'flex';
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                  
                  {/* Loading indicator */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.8)'
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <CircularProgress size={60} sx={{ mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Cargando vista previa...
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Error fallback para iframe */}
                  <Box sx={{
                    display: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <WarningIcon sx={{ fontSize: '4rem', color: '#ef4444' }} />
                    <Typography variant="h6" color="error">
                      No se puede mostrar la vista previa
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: '400px' }}>
                      Este archivo requiere permisos adicionales o no está disponible para vista previa embebida.
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        startIcon={<OpenInNewIcon />}
                        href={previewDialog.file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver en Google Drive
                      </Button>
                      {previewDialog.file.webContentLink && (
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          href={previewDialog.file.webContentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Descargar
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          {previewDialog.file && (
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                href={previewDialog.file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir en Drive
              </Button>
              {previewDialog.file.webContentLink && (
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  href={previewDialog.file.webContentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Descargar
                </Button>
              )}
            </Stack>
          )}
          <Button onClick={handleClosePreview}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriveFileList;
