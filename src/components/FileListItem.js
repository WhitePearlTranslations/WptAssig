import React, { memo } from 'react';
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Chip,
  Stack
} from '@mui/material';
import {
  Folder as FolderIcon,
  OpenInNew as OpenInNewIcon,
  Visibility as VisibilityIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon,
  Description as DocumentIcon,
  TableChart as SpreadsheetIcon,
  Slideshow as PresentationIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';

const FileListItem = memo(({ 
  file, 
  index, 
  onFileClick, 
  style 
}) => {
  const getFileIcon = (file) => {
    const iconProps = { sx: { color: file.color } };
    
    // Carpetas tienen prioridad
    if (file.type === 'folder' || file.category === 'folder' || file.isFolder) {
      return <FolderIcon sx={{ color: '#f59e0b', fontSize: '1.5rem' }} />;
    }
    
    switch (file.category) {
      case 'image':
        return <ImageIcon {...iconProps} />;
      case 'media':
        return file.type === 'video' ? <VideoIcon {...iconProps} /> : <AudioIcon {...iconProps} />;
      case 'document':
        if (file.type === 'pdf') return <PdfIcon {...iconProps} />;
        if (file.type === 'google-doc') return <DocumentIcon {...iconProps} />;
        if (file.type === 'spreadsheet' || file.type === 'google-sheet') return <SpreadsheetIcon {...iconProps} />;
        if (file.type === 'presentation' || file.type === 'google-slide') return <PresentationIcon {...iconProps} />;
        return <DocumentIcon {...iconProps} />;
      case 'archive':
        return <ArchiveIcon {...iconProps} />;
      default:
        return <FileIcon {...iconProps} />;
    }
  };

  return (
    <div style={style}>
      <ListItem
        button
        onClick={() => onFileClick(file, index)}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            transform: 'translateX(4px)',
            transition: 'transform 0.15s ease'
          },
          py: 1.5,
          transition: 'none' // Optimización: remover transiciones costosas
        }}
      >
        <ListItemIcon>
          <Avatar 
            sx={{ 
              backgroundColor: `${file.color}20`, 
              width: 40, 
              height: 40 
            }}
          >
            {getFileIcon(file)}
          </Avatar>
        </ListItemIcon>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 500,
                  // Optimización: truncar texto largo
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '250px'
                }}
              >
                {file.name}
              </Typography>
              {(file.type === 'folder' || file.category === 'folder' || file.isFolder) && (
                <Chip
                  label="📁 Carpeta"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#f59e0b',
                    fontSize: '0.65rem',
                    height: '18px',
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              )}
            </Box>
          }
          secondary={
            <Box sx={{ mt: 0.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={file.icon + ' ' + file.type.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: `${file.color}20`,
                    color: file.color,
                    fontSize: '0.7rem',
                    height: '20px'
                  }}
                />
                {file.formattedSize !== '0 Bytes' && (
                  <Typography variant="caption" color="text.secondary">
                    {file.formattedSize}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {file.formattedDate}
                </Typography>
              </Stack>
            </Box>
          }
        />
        
        <ListItemSecondaryAction>
          <Stack direction="row" spacing={1}>
            {(file.type === 'folder' || file.category === 'folder' || file.isFolder) ? (
              // Botones para carpetas - optimizados
              <>
                <Tooltip title="Explorar carpeta">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileClick(file, index);
                    }}
                    sx={{ color: '#f59e0b' }}
                  >
                    <FolderIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Abrir en Drive">
                  <IconButton
                    size="small"
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ color: '#10b981' }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              // Botones para archivos - optimizados
              <>
                {file.canPreview && (
                  <Tooltip title="Vista previa">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileClick(file, index);
                      }}
                      sx={{ color: '#6366f1' }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title="Abrir en Drive">
                  <IconButton
                    size="small"
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ color: '#10b981' }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        </ListItemSecondaryAction>
      </ListItem>
    </div>
  );
});

// Agregar displayName para debugging
FileListItem.displayName = 'FileListItem';

export default FileListItem;
