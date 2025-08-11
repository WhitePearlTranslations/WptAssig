import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Button,
  Typography,
} from '@mui/material';
import SeriesManagement from './SeriesManagement';

// Estados de asignación
const ASSIGNMENT_STATUS = {
  SIN_ASIGNAR: 'sin_asignar',
  ASIGNADO: 'asignado',
  LISTO: 'listo',
  PUBLICADO: 'publicado',
  RETRASADO: 'retrasado'
};

const STATUS_CONFIG = {
  [ASSIGNMENT_STATUS.SIN_ASIGNAR]: {
    label: 'Sin Asignar',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
  },
  [ASSIGNMENT_STATUS.ASIGNADO]: {
    label: 'Asignado',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  [ASSIGNMENT_STATUS.LISTO]: {
    label: 'Listo',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  [ASSIGNMENT_STATUS.PUBLICADO]: {
    label: 'Publicado',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  [ASSIGNMENT_STATUS.RETRASADO]: {
    label: 'Retrasado',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  }
};

const ROLE_CONFIG = {
  traductor: { label: 'Traductor', color: '#6366f1' },
  proofreading: { label: 'Proofreading', color: '#ec4899' },
  type: { label: 'Type', color: '#f59e0b' },
  cleanRedrawer: { label: 'Clean y Redrawer', color: '#10b981' }
};

// Componente de diálogo de asignación
const AssignmentDialog = ({ 
  open, 
  onClose, 
  onSave, 
  chapter = null, 
  users = [],
}) => {
  const [formData, setFormData] = useState({
    manga: '',
    chapter: '',
    status: ASSIGNMENT_STATUS.SIN_ASIGNAR,
    traductor: { userId: '', fecha: null, completed: false },
    proofreading: { userId: '', fecha: null, completed: false },
    type: { userId: '', fecha: null, completed: false },
    cleanRedrawer: { userId: '', fecha: null, completed: false },
    fechaSubida: null,
    linkCapitulo: '',
    fechaRevisionRaw: null,
  });

  useEffect(() => {
    if (chapter && open) {
      setFormData({
        manga: chapter.manga || '',
        chapter: chapter.chapter || '',
        status: chapter.status || ASSIGNMENT_STATUS.SIN_ASIGNAR,
        traductor: chapter.traductor || { userId: '', fecha: null, completed: false },
        proofreading: chapter.proofreading || { userId: '', fecha: null, completed: false },
        type: chapter.type || { userId: '', fecha: null, completed: false },
        cleanRedrawer: chapter.cleanRedrawer || { userId: '', fecha: null, completed: false },
        fechaSubida: chapter.fechaSubida || null,
        linkCapitulo: chapter.linkCapitulo || '',
        fechaRevisionRaw: chapter.fechaRevisionRaw || null,
      });
    } else if (!chapter && open) {
      // Nuevo capítulo
      setFormData({
        manga: '',
        chapter: '',
        status: ASSIGNMENT_STATUS.SIN_ASIGNAR,
        traductor: { userId: '', fecha: null, completed: false },
        proofreading: { userId: '', fecha: null, completed: false },
        type: { userId: '', fecha: null, completed: false },
        cleanRedrawer: { userId: '', fecha: null, completed: false },
        fechaSubida: null,
        linkCapitulo: '',
        fechaRevisionRaw: null,
      });
    }
  }, [chapter, open]);

  const handleSubmit = () => {
    onSave({ ...formData, id: chapter?.id || Date.now().toString() });
  };

  const updateRoleData = (role, field, value) => {
    setFormData(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value
      }
    }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        className: 'glass-morphism animate-scale-in',
        sx: {
          background: 'rgba(15, 15, 25, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #6366f1, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontWeight: 700,
      }}>
        {chapter ? `Editar Capítulo ${chapter.chapter}` : 'Nuevo Capítulo'}
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Info */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Manga"
              value={formData.manga}
              onChange={(e) => setFormData({ ...formData, manga: e.target.value })}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Capítulo"
              value={formData.chapter}
              onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                label="Estado"
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    {config.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Roles Assignment */}
          {Object.entries(ROLE_CONFIG).map(([roleKey, roleConfig]) => (
            <Grid item xs={12} key={roleKey}>
              <Box sx={{ 
                p: 2, 
                border: '1px solid rgba(148, 163, 184, 0.2)', 
                borderRadius: '12px',
                background: 'rgba(148, 163, 184, 0.05)',
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: roleConfig.color, fontWeight: 600 }}>
                  {roleConfig.label}
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Asignar a</InputLabel>
                      <Select
                        value={formData[roleKey]?.userId || ''}
                        onChange={(e) => updateRoleData(roleKey, 'userId', e.target.value)}
                        label="Asignar a"
                      >
                        <MenuItem value="">Sin asignar</MenuItem>
                        {users.map(user => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Fecha de entrega"
                      type="date"
                      value={formData[roleKey]?.fecha ? new Date(formData[roleKey].fecha).toISOString().split('T')[0] : ''}
                      onChange={(e) => updateRoleData(roleKey, 'fecha', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Estado</InputLabel>
                      <Select
                        value={formData[roleKey]?.completed ? 'completed' : 'pending'}
                        onChange={(e) => updateRoleData(roleKey, 'completed', e.target.value === 'completed')}
                        label="Estado"
                      >
                        <MenuItem value="pending">Pendiente</MenuItem>
                        <MenuItem value="completed">Completado</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          ))}

          {/* Additional Fields */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Fecha de subida"
              type="date"
              value={formData.fechaSubida ? new Date(formData.fechaSubida).toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, fechaSubida: e.target.value ? new Date(e.target.value).toISOString() : null })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Última revisión del raw"
              type="date"
              value={formData.fechaRevisionRaw ? new Date(formData.fechaRevisionRaw).toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, fechaRevisionRaw: e.target.value ? new Date(e.target.value).toISOString() : null })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Link del capítulo publicado"
              value={formData.linkCapitulo}
              onChange={(e) => setFormData({ ...formData, linkCapitulo: e.target.value })}
              variant="outlined"
              placeholder="https://..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} sx={{ mr: 1 }}>
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          sx={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5b5bf1, #7c3aed)',
            },
          }}
        >
          {chapter ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente principal que maneja ambas vistas
const SeriesAssignmentManager = () => {
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);

  // Mock users
  const users = [
    { id: '1', name: 'Ryu 龍' },
    { id: '2', name: 'Z0mb1e' },
    { id: '3', name: 'Eddie' },
    { id: '4', name: 'Vitocko' },
    { id: '5', name: 'Suki' },
    { id: '6', name: 'Kayden' },
    { id: '7', name: 'Noobrate' },
    { id: '8', name: 'Quaza' },
    { id: '9', name: 'Nimo' },
  ];

  const handleOpenAssignment = (chapter) => {
    setSelectedChapter(chapter);
    setAssignmentDialogOpen(true);
  };

  const handleCloseAssignment = () => {
    setAssignmentDialogOpen(false);
    setSelectedChapter(null);
  };

  const handleSaveAssignment = (assignmentData) => {
    // Aquí puedes manejar la lógica para guardar la asignación
    console.log('Guardando asignación:', assignmentData);
    
    // Cerrar el diálogo
    handleCloseAssignment();
    
    // TODO: Actualizar los datos en el componente SeriesManagement
    // Esto se podría hacer con un estado compartido o context
  };

  const handleOpenChapterDialog = (data) => {
    // Manejar creación de nuevo capítulo
    console.log('Abriendo diálogo para nuevo capítulo:', data);
    setSelectedChapter({ seriesId: data.seriesId, manga: '', chapter: '' });
    setAssignmentDialogOpen(true);
  };

  return (
    <Box>
      <SeriesManagement
        onOpenAssignment={handleOpenAssignment}
        onOpenChapterDialog={handleOpenChapterDialog}
      />
      
      <AssignmentDialog
        open={assignmentDialogOpen}
        onClose={handleCloseAssignment}
        onSave={handleSaveAssignment}
        chapter={selectedChapter}
        users={users}
      />
    </Box>
  );
};

export default SeriesAssignmentManager;
