import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  TextField,
  IconButton
} from '@mui/material';
import {
  BugReport as DebugIcon,
  ExpandMore as ExpandMoreIcon,
  Link as LinkIcon,
  CheckCircle as ValidIcon,
  Error as InvalidIcon,
  Search as SearchIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import googleDriveService from '../services/googleDriveService';

const DriveLinksDebugger = ({ open, onClose, assignments }) => {
  const [testLink, setTestLink] = useState('');
  const [testResult, setTestResult] = useState(null);
  
  const validateLink = (link) => {
    if (!link) return { isValid: false, error: 'Enlace vacío' };
    
    try {
      const folderId = googleDriveService.extractFolderIdFromUrl(link);
      return {
        isValid: !!folderId,
        folderId: folderId,
        error: folderId ? null : 'No se pudo extraer ID'
      };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  };

  const testLinkExtraction = () => {
    if (!testLink) return;
    
    const result = validateLink(testLink);
    setTestResult(result);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const assignmentsWithDriveLinks = assignments ? assignments.filter(a => a.driveLink) : [];
  const assignmentsWithoutDriveLinks = assignments ? assignments.filter(a => !a.driveLink) : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DebugIcon color="primary" />
        <Typography variant="h6">
          Debugger de Enlaces de Google Drive
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Probador de enlaces */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🔧 Probador de Enlaces
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Enlace de Google Drive a probar"
              value={testLink}
              onChange={(e) => setTestLink(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
            />
            <Button
              variant="contained"
              onClick={testLinkExtraction}
              startIcon={<SearchIcon />}
            >
              Probar
            </Button>
          </Box>
          
          {testResult && (
            <Alert 
              severity={testResult.isValid ? 'success' : 'error'}
              action={
                testResult.folderId && (
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(testResult.folderId)}
                    title="Copiar ID"
                  >
                    <CopyIcon />
                  </IconButton>
                )
              }
            >
              <Typography variant="body2">
                <strong>Resultado:</strong> {testResult.isValid ? '✅ Válido' : '❌ Inválido'}
              </Typography>
              {testResult.folderId && (
                <Typography variant="body2">
                  <strong>ID extraído:</strong> {testResult.folderId}
                </Typography>
              )}
              {testResult.error && (
                <Typography variant="body2">
                  <strong>Error:</strong> {testResult.error}
                </Typography>
              )}
            </Alert>
          )}
        </Paper>

        {/* Estadísticas */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip
            icon={<LinkIcon />}
            label={`${assignmentsWithDriveLinks.length} con enlaces`}
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<InvalidIcon />}
            label={`${assignmentsWithoutDriveLinks.length} sin enlaces`}
            color="warning"
            variant="outlined"
          />
        </Box>

        {/* Lista de asignaciones con enlaces */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              📋 Asignaciones con Enlaces ({assignmentsWithDriveLinks.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {assignmentsWithDriveLinks.map((assignment, index) => {
                const validation = validateLink(assignment.driveLink);
                return (
                  <ListItem key={assignment.id || index} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle2">
                            {assignment.mangaTitle || assignment.manga} - Cap. {assignment.chapter}
                          </Typography>
                          <Chip 
                            label={assignment.type} 
                            size="small" 
                            variant="outlined" 
                          />
                          {validation.isValid ? (
                            <ValidIcon color="success" fontSize="small" />
                          ) : (
                            <InvalidIcon color="error" fontSize="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace', 
                              fontSize: '0.8rem',
                              wordBreak: 'break-all',
                              mb: 1
                            }}
                          >
                            <strong>Enlace:</strong> {assignment.driveLink}
                          </Typography>
                          {validation.folderId && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontFamily: 'monospace', 
                                fontSize: '0.8rem',
                                color: 'success.main'
                              }}
                            >
                              <strong>ID:</strong> {validation.folderId}
                            </Typography>
                          )}
                          {validation.error && (
                            <Typography 
                              variant="body2" 
                              sx={{ color: 'error.main' }}
                            >
                              <strong>Error:</strong> {validation.error}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Asignado a: {assignment.assignedToName || 'Sin asignar'} | 
                            Estado: {assignment.status || 'Sin estado'} |
                            ID: {assignment.id || 'Sin ID'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
            {assignmentsWithDriveLinks.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No hay asignaciones con enlaces de Google Drive configurados
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Lista de asignaciones sin enlaces */}
        {assignmentsWithoutDriveLinks.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                ⚠️ Asignaciones sin Enlaces ({assignmentsWithoutDriveLinks.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {assignmentsWithoutDriveLinks.slice(0, 10).map((assignment, index) => (
                  <ListItem key={assignment.id || index} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {assignment.mangaTitle || assignment.manga} - Cap. {assignment.chapter}
                          </Typography>
                          <Chip 
                            label={assignment.type} 
                            size="small" 
                            variant="outlined" 
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Asignado a: {assignment.assignedToName || 'Sin asignar'} | 
                          Estado: {assignment.status || 'Sin estado'} |
                          ID: {assignment.id || 'Sin ID'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
                {assignmentsWithoutDriveLinks.length > 10 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                          ... y {assignmentsWithoutDriveLinks.length - 10} más
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Consejos */}
        <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.light' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'info.contrastText' }}>
            💡 Consejos para solucionar problemas:
          </Typography>
          <Typography variant="body2" sx={{ color: 'info.contrastText' }}>
            1. Los enlaces deben ser de carpetas, no de archivos individuales<br />
            2. Verifica que las carpetas existan en Google Drive<br />
            3. Asegúrate de que las carpetas tengan permisos de edición<br />
            4. Los enlaces deben incluir el ID completo de la carpeta
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DriveLinksDebugger;
