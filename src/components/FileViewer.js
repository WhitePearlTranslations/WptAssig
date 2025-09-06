import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Grid,
  Avatar,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Description as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Archive as ArchiveIcon,
  InsertDriveFile as DriveFileIcon,
  OpenInNew as OpenIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Folder as FolderIcon,
  CloudDownload as CloudIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import googleDriveService from '../services/googleDriveService';
import { getDriveFileInfo, parseDriveUrls, detectFileType } from '../utils/driveUtils';

const FileViewer = ({ 
  assignment, 
  open, 
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [folderInfo, setFolderInfo] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (open && assignment && assignment.driveLink) {
      loadFiles();
    }
  }, [open, assignment]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Autenticar con Google Drive
      await googleDriveService.loadGapi();
      await googleDriveService.signIn();
      setAuthenticated(true);

      // Extraer ID de carpeta desde el enlace
      const folderId = googleDriveService.extractFolderIdFromUrl(assignment.driveLink);
      
      if (!folderId) {
        throw new Error('No se pudo extraer el ID de la carpeta del enlace de Drive');
      }

      // Obtener información de la carpeta
      const folderData = await googleDriveService.getFolderInfo(folderId);
      setFolderInfo(folderData);

      // Listar archivos en la carpeta
      const filesList = await googleDriveService.listFilesInFolder(folderId, 100);
      
      // Procesar y organizar archivos
      const processedFiles = filesList.map(file => ({
        ...file,
        fileType: getFileType(file.mimeType, file.name),
        formattedSize: formatFileSize(parseInt(file.size) || 0),
        formattedDate: file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('es-ES') : 'N/A'
      })).sort((a, b) => a.name.localeCompare(b.name));

      setFiles(processedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      setError(`Error al cargar los archivos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (mimeType, fileName) => {
    if (!mimeType && !fileName) return 'unknown';
    
    const extension = fileName ? fileName.split('.').pop().toLowerCase() : '';
    
    // Tipos de imagen
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
      return 'image';
    }
    
    // Tipos de documento
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return 'pdf';
    }
    
    // Tipos de archivo comprimido
    if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('7z') ||
        ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return 'archive';
    }
    
    // Archivos de Google Drive
    if (mimeType?.includes('google-apps')) {
      return 'google-doc';
    }
    
    return 'document';
  };

  const getFileIcon = (fileType, size = 'medium') => {
    const iconProps = { fontSize: size };
    
    switch (fileType) {
      case 'image':
        return <ImageIcon {...iconProps} color="primary" />;
      case 'pdf':
        return <PdfIcon {...iconProps} color="error" />;
      case 'archive':
        return <ArchiveIcon {...iconProps} color="warning" />;
      case 'google-doc':
        return <DriveFileIcon {...iconProps} color="info" />;
      default:
        return <FileIcon {...iconProps} color="action" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleOpenFile = (file) => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadFile = (file) => {
    if (file.id) {
      // Crear enlace de descarga directo
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const getFileTypeChip = (fileType) => {
    const configs = {
      image: { label: 'Imagen', color: 'primary' },
      pdf: { label: 'PDF', color: 'error' },
      archive: { label: 'Archivo', color: 'warning' },
      'google-doc': { label: 'Google Doc', color: 'info' },
      document: { label: 'Documento', color: 'default' },
      unknown: { label: 'Desconocido', color: 'default' }
    };
    
    const config = configs[fileType] || configs.unknown;
    return (
      <Chip 
        label={config.label} 
        size="small" 
        color={config.color} 
        variant="outlined"
      />
    );
  };

  const handleClose = () => {
    setFiles([]);
    setError(null);
    setFolderInfo(null);
    setAuthenticated(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ViewIcon color="primary" />
          <Typography variant="h6">
            Archivos de la Asignación
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Información de la asignación */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Detalles de la Asignación
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={assignment?.mangaTitle || assignment?.manga} 
                  size="small" 
                  color="primary" 
                />
                <Chip 
                  label={`Capítulo ${assignment?.chapter}`} 
                  size="small" 
                />
                <Chip 
                  label={assignment?.type} 
                  size="small" 
                  variant="outlined" 
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              {folderInfo && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FolderIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Carpeta: {folderInfo.name}
                  </Typography>
                </Box>
              )}
              {assignment?.assignedToName && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>
                    {assignment.assignedToName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Asignado a: {assignment.assignedToName}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Estado de carga y errores */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button 
              size="small" 
              onClick={loadFiles}
              sx={{ ml: 1 }}
              variant="outlined"
              color="inherit"
            >
              Reintentar
            </Button>
          </Alert>
        )}

        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Cargando archivos de Google Drive...
            </Typography>
          </Box>
        )}

        {/* Lista de archivos */}
        {!loading && !error && files.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Archivos Subidos ({files.length})
            </Typography>
            
            <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
              {files.map((file, index) => (
                <React.Fragment key={file.id}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>
                      {getFileIcon(file.fileType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body1" component="span">
                            {file.name}
                          </Typography>
                          {getFileTypeChip(file.fileType)}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Tamaño: {file.formattedSize} • Modificado: {file.formattedDate}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenFile(file)}
                          title="Ver archivo"
                        >
                          <OpenIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDownloadFile(file)}
                          title="Descargar archivo"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < files.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {/* Sin archivos */}
        {!loading && !error && files.length === 0 && authenticated && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CloudIcon sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No se encontraron archivos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              La carpeta de Google Drive está vacía o no contiene archivos visibles.
            </Typography>
          </Box>
        )}

        {/* Skeleton loading */}
        {loading && (
          <Box>
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} sx={{ mb: 1 }}>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cerrar
        </Button>
        {assignment?.driveLink && (
          <Button
            variant="outlined"
            startIcon={<FolderIcon />}
            href={assignment.driveLink}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ textTransform: 'none' }}
          >
            Abrir Carpeta en Drive
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FileViewer;
