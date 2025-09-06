import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Box,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import {
  Folder as FolderIcon,
  OpenInNew as OpenInNewIcon,
  Description as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { extractDriveFolderId } from '../utils/driveUtils';
import DriveFileList from './DriveFileList';

/**
 * Componente especializado para mostrar carpetas de Google Drive
 * Proporciona información útil y enlaces directos ya que las carpetas
 * no siempre se pueden embeber correctamente
 */
const DriveFolder = ({ assignment, folderId, folderUrl }) => {
  const id = folderId || extractDriveFolderId(assignment?.driveLink || folderUrl);
  const url = folderUrl || assignment?.driveLink;
  
  return (
    <Box>
      {/* Header con información de la carpeta */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FolderIcon sx={{ fontSize: '2.5rem', color: '#f59e0b' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f59e0b' }}>
                📁 {assignment?.mangaTitle || 'Carpeta de Archivos'}
                {assignment?.chapter && ` - Capítulo ${assignment.chapter}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Carpeta de Google Drive con archivos para revisión
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            href={url}
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
            Abrir en Drive
          </Button>
        </Box>
        
        <Alert severity="info" size="small">
          <Typography variant="body2">
            <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            <strong>Vista integrada:</strong> Puedes ver y navegar por todos los archivos directamente desde aquí sin salir de la página.
          </Typography>
        </Alert>
      </Paper>
      
      {/* Lista de archivos integrada */}
      <DriveFileList 
        assignment={assignment}
        folderId={id}
        folderUrl={url}
        showPreview={true}
        maxHeight="60vh"
      />
      
      {/* Nota para jefes */}
      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Para jefes:</strong> Puedes hacer clic en cualquier archivo para verlo directamente en la página, usar los controles de navegación para revisar múltiples archivos secuencialmente, y aprobar/rechazar desde el panel principal.
        </Typography>
      </Alert>
    </Box>
  );
};

export default DriveFolder;
