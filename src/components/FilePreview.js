import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { getDriveFileInfo, parseDriveUrls } from '../utils/driveUtils';
import DriveFolder from './DriveFolder';

const FilePreview = ({ 
  url, 
  urls = [], 
  assignment = null,
  onClose = null,
  maxHeight = '70vh',
  showControls = true,
  autoDetectMultiple = true
}) => {
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileInfos, setFileInfos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  // Procesar URLs al montar el componente
  useEffect(() => {
    const processUrls = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let urlsToProcess = [];
        
        // Si se proporciona una URL individual
        if (url) {
          urlsToProcess.push(url);
        }
        
        // Si se proporciona un array de URLs
        if (urls && urls.length > 0) {
          urlsToProcess.push(...urls);
        }
        
        // Auto-detectar URLs múltiples desde assignment
        if (autoDetectMultiple && assignment) {
          // Buscar en driveLink
          if (assignment.driveLink) {
            const detectedUrls = parseDriveUrls(assignment.driveLink);
            if (detectedUrls.length > 0) {
              urlsToProcess.push(...detectedUrls.map(info => info.originalUrl));
            }
          }
          
          // Buscar en comentarios o notas adicionales si existen
          if (assignment.comments) {
            const detectedUrls = parseDriveUrls(assignment.comments);
            urlsToProcess.push(...detectedUrls.map(info => info.originalUrl));
          }
          
          // Si no hay URLs detectadas pero hay driveLink, usar como URL directa
          if (urlsToProcess.length === 0 && assignment.driveLink) {
            urlsToProcess.push(assignment.driveLink);
          }
        }
        
        // Eliminar duplicados
        urlsToProcess = [...new Set(urlsToProcess)];
        
        if (urlsToProcess.length === 0) {
          setError('No se encontraron archivos para mostrar');
          setLoading(false);
          return;
        }
        
        // Procesar información de cada archivo
        const processedFiles = urlsToProcess
          .map(fileUrl => {
            const info = getDriveFileInfo(fileUrl);
            return info;
          })
          .filter(info => {
            const isValid = info.fileId;
            return isValid;
          });
        
        if (processedFiles.length === 0) {
          setError('No se pudieron procesar los archivos proporcionados. Verifica que las URLs sean de Google Drive válidas.');
          setLoading(false);
          return;
        }
        
        setFileInfos(processedFiles);
        setCurrentFileIndex(0);
        setLoading(false);
        
      } catch (err) {
        setError(`Error al procesar los archivos: ${err.message}`);
        setLoading(false);
      }
    };
    
    processUrls();
  }, [url, urls, assignment, autoDetectMultiple]);

  const currentFile = fileInfos[currentFileIndex];
  
  const handlePrevFile = () => {
    setCurrentFileIndex((prev) => 
      prev > 0 ? prev - 1 : fileInfos.length - 1
    );
    setIframeLoading(true);
  };
  
  const handleNextFile = () => {
    setCurrentFileIndex((prev) => 
      prev < fileInfos.length - 1 ? prev + 1 : 0
    );
    setIframeLoading(true);
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
  
  const getFileIcon = (fileInfo) => {
    switch (fileInfo.category) {
      case 'image': return <ImageIcon />;
      case 'document': return fileInfo.type === 'pdf' ? <PdfIcon /> : <FileIcon />;
      case 'media': return fileInfo.type === 'video' ? <VideoIcon /> : <AudioIcon />;
      case 'folder': return <FolderIcon sx={{ color: '#f59e0b' }} />;
      default: return <FileIcon />;
    }
  };
  
  const renderFilePreview = () => {
    if (!currentFile) return null;
    
    // Si es una carpeta, usar el componente especializado
    if (currentFile.type === 'folder') {
      return (
        <DriveFolder 
          assignment={assignment}
          folderId={currentFile.fileId}
          folderUrl={currentFile.originalUrl}
        />
      );
    }
    
    // Si no se puede embeber, mostrar info del archivo
    if (!currentFile.canEmbed) {
      return (
        <Card sx={{ 
          minHeight: '400px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(99, 102, 241, 0.05)',
          border: '2px dashed rgba(99, 102, 241, 0.2)'
        }}>
          <CardContent sx={{ textAlign: 'center' }}>
            {getFileIcon(currentFile)}
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              {currentFile.icon} Archivo no embebible
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Este tipo de archivo no se puede mostrar directamente.
              Puedes descargarlo o abrirlo en una nueva pestaña.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                href={currentFile.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir en Drive
              </Button>
              {currentFile.downloadUrl && (
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  href={currentFile.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Descargar
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      );
    }
    
    // Para archivos que se pueden embeber
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        {iframeLoading && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 1,
            borderRadius: 2
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Cargando archivo desde Google Drive...
              </Typography>
              <LinearProgress sx={{ width: 200, mt: 2 }} />
            </Box>
          </Box>
        )}
        
        <iframe
          src={currentFile.embedUrl}
          style={{
            width: '100%',
            height: maxHeight,
            border: 'none',
            borderRadius: '8px',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            transition: 'transform 0.3s ease'
          }}
          onLoad={() => setIframeLoading(false)}
          onError={() => {
            setIframeLoading(false);
            setError('Error al cargar el archivo');
          }}
          title={`Vista previa - ${assignment?.mangaTitle || 'Archivo'}`}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        py: 4,
        minHeight: '300px'
      }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Procesando archivos...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Preparando vista previa desde Google Drive
        </Typography>
      </Box>
    );
  }
  
  if (error || !currentFile) {
    return (
      <Card sx={{ 
        minHeight: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'rgba(239, 68, 68, 0.05)',
        border: '2px dashed rgba(239, 68, 68, 0.2)'
      }}>
        <CardContent sx={{ textAlign: 'center', maxWidth: '600px' }}>
          <WarningIcon sx={{ fontSize: '4rem', color: '#ef4444', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#ef4444' }}>
            No se pudo cargar la vista previa
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error || 'Error desconocido al procesar el archivo'}
          </Typography>
          
          {assignment?.driveLink && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                URL proporcionada:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(0,0,0,0.1)', 
                  borderRadius: 1, 
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  mb: 2
                }}
              >
                {assignment.driveLink}
              </Typography>
            </Box>
          )}
          
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Posibles soluciones:
            </Typography>
            <Typography variant="body2" component="div">
              • Verifica que el archivo esté compartido públicamente<br/>
              • Asegúrate de que la URL sea de Google Drive<br/>
              • Si es una carpeta, comparte archivos individuales<br/>
              • Intenta abrir el enlace directamente en Drive
            </Typography>
          </Alert>
          
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
            {assignment?.driveLink && (
              <Button
                variant="contained"
                startIcon={<OpenInNewIcon />}
                href={assignment.driveLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir en Drive
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Paper sx={{ 
      p: 2, 
      borderRadius: 3,
      background: 'rgba(15, 15, 25, 0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(148, 163, 184, 0.1)'
    }}>
      {/* Header con controles */}
      {showControls && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 2,
          pb: 2,
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
          {/* Info del archivo actual */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {getFileIcon(currentFile)}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {assignment?.mangaTitle || 'Vista previa'}
                {assignment?.chapter && ` - Capítulo ${assignment.chapter}`}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Chip 
                  label={`${currentFile.type.toUpperCase()} ${currentFile.icon}`} 
                  size="small"
                  sx={{ fontSize: '0.7rem' }}
                />
                {fileInfos.length > 1 && (
                  <Chip 
                    label={`${currentFileIndex + 1} de ${fileInfos.length}`} 
                    size="small" 
                    color="primary"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Stack>
            </Box>
          </Box>
          
          {/* Controles */}
          <Stack direction="row" spacing={0.5}>
            {/* Navegación entre archivos */}
            {fileInfos.length > 1 && (
              <>
                <Tooltip title="Archivo anterior">
                  <IconButton onClick={handlePrevFile} size="small">
                    <PrevIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Siguiente archivo">
                  <IconButton onClick={handleNextFile} size="small">
                    <NextIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            
            {/* Controles de zoom */}
            {currentFile.canEmbed && (
              <>
                <Tooltip title="Alejar">
                  <IconButton onClick={handleZoomOut} size="small" disabled={zoom <= 25}>
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={`Zoom: ${zoom}%`}>
                  <Button
                    onClick={handleResetZoom}
                    size="small"
                    sx={{ minWidth: '60px', fontSize: '0.7rem' }}
                  >
                    {zoom}%
                  </Button>
                </Tooltip>
                <Tooltip title="Acercar">
                  <IconButton onClick={handleZoomIn} size="small" disabled={zoom >= 300}>
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            
            {/* Abrir en nueva pestaña */}
            <Tooltip title="Abrir en Google Drive">
              <IconButton 
                href={currentFile.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: 'primary.main' }}
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
            
            {/* Descargar */}
            <Tooltip title="Descargar archivo">
              <IconButton 
                href={currentFile.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: 'success.main' }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            
            {/* Cerrar si es modal */}
            {onClose && (
              <Tooltip title="Cerrar">
                <IconButton onClick={onClose} size="small" sx={{ color: 'error.main' }}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>
      )}
      
      {/* Vista previa del archivo */}
      <Box sx={{ position: 'relative' }}>
        {renderFilePreview()}
      </Box>
      
      {/* Advertencia si el archivo no es público */}
      {currentFile && !currentFile.isPublic && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Este archivo podría requerir permisos adicionales para visualizarse correctamente.
            Si no puedes ver el contenido, verifica que el archivo esté compartido públicamente.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};

export default FilePreview;
