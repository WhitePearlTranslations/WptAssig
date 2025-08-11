import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Schedule,
  Warning,
  PlayArrow,
  Link as LinkIcon,
  CalendarToday,
  TrendingUp,
  Work,
  TaskAlt,
  PriorityHigh,
  Add,
  Download
} from '@mui/icons-material';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const MyWorks = () => {
  const { userProfile, hasRole } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [mangas, setMangas] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [progressDialog, setProgressDialog] = useState(false);
  const [newProgress, setNewProgress] = useState(0);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [formData, setFormData] = useState({
    mangaId: '',
    chapter: '',
    tasks: ['traduccion'],
    assignedTo: '',
    driveLink: '',
    dueDate: '',
    priority: 'normal'
  });

  const TASK_TYPES = {
    traduccion: 'Traducción',
    proofreading: 'Proofreading',
    cleaning: 'Cleaning',
    typesetting: 'Typesetting'
  };

  useEffect(() => {
    if (!userProfile?.uid) return;

    // Obtener solo las asignaciones del usuario actual
    const unsubscribeAssignments = realtimeService.subscribeToAssignments(
      setAssignments, 
      userProfile.uid
    );

    // Obtener mangas para mostrar información completa
    const unsubscribeMangas = realtimeService.subscribeToMangas(setMangas);

    // Obtener usuarios si es jefe (para poder asignar)
    let unsubscribeUsers = () => {};
    if (hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR)) {
      unsubscribeUsers = realtimeService.subscribeToUsers(setUsers);
    }

    return () => {
      unsubscribeAssignments();
      unsubscribeMangas();
      unsubscribeUsers();
    };
  }, [userProfile]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completado': return 'success';
      case 'en_progreso': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completado': return <CheckCircle color="success" />;
      case 'en_progreso': return <Schedule color="warning" />;
      default: return <Assignment color="action" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta': return 'error';
      case 'media': return 'warning';
      default: return 'default';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 75) return 'success';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const handleUpdateProgress = async () => {
    try {
      const status = newProgress === 100 ? 'completado' : 'en_progreso';
      await realtimeService.updateAssignment(selectedAssignment.id, {
        progress: parseInt(newProgress),
        status
      });
      
      toast.success('Progreso actualizado exitosamente');
      setProgressDialog(false);
      setSelectedAssignment(null);
      setNewProgress(0);
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
      toast.error('Error al actualizar el progreso');
    }
  };

  const openProgressDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setNewProgress(assignment.progress || 0);
    setProgressDialog(true);
  };

  // Funciones para crear nueva asignación
  const handleSubmitAssignment = async () => {
    try {
      if (!formData.mangaId || !formData.chapter || !formData.assignedTo || !formData.driveLink) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      const manga = mangas.find(m => m.id === formData.mangaId);
      const assignedUser = users.find(u => (u.uid || u.id) === formData.assignedTo);

      const assignmentData = {
        ...formData,
        type: formData.tasks[0], // Mantener compatibilidad
        mangaTitle: manga?.title || 'Manga desconocido',
        assignedToName: assignedUser?.name || 'Usuario desconocido',
        status: 'pendiente',
        progress: 0,
        createdBy: userProfile.uid,
        createdAt: new Date().toISOString()
      };

      const result = await realtimeService.createAssignment(assignmentData);
      toast.success(`Asignación creada exitosamente. Link: ${window.location.origin}/shared/${result.shareableId}`);
      setOpenAssignDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error al crear asignación:', error);
      toast.error('Error al crear la asignación');
    }
  };

  const resetForm = () => {
    setFormData({
      mangaId: '',
      chapter: '',
      tasks: ['traduccion'],
      assignedTo: '',
      driveLink: '',
      dueDate: '',
      priority: 'normal'
    });
  };

  const filteredUsers = users.filter(user => {
    if (hasRole(ROLES.ADMIN)) return true;
    
    const hasTranslationTask = formData.tasks.includes('traduccion');
    const hasEditingTask = formData.tasks.some(task => ['proofreading', 'cleaning', 'typesetting'].includes(task));
    
    let canAssign = false;
    
    // Jefe Traductor puede asignar a traductores si hay tareas de traducción
    if (hasRole(ROLES.JEFE_TRADUCTOR) && hasTranslationTask) {
      canAssign = canAssign || (user.role === ROLES.TRADUCTOR || user.role === ROLES.JEFE_TRADUCTOR);
    }
    
    // Jefe Editor puede asignar a editores si hay tareas de edición
    if (hasRole(ROLES.JEFE_EDITOR) && hasEditingTask) {
      canAssign = canAssign || (user.role === ROLES.EDITOR || user.role === ROLES.JEFE_EDITOR);
    }
    
    // Si es jefe pero no hay tareas compatibles, mostrar mensaje
    console.log('🔍 Filtro de usuarios:', {
      userName: user.name,
      userRole: user.role,
      hasTranslationTask,
      hasEditingTask,
      isJefeTraductor: hasRole(ROLES.JEFE_TRADUCTOR),
      isJefeEditor: hasRole(ROLES.JEFE_EDITOR),
      canAssign
    });
    
    return canAssign;
  });
  
  // Debug: mostrar información del filtro
  console.log('📊 Estado del filtro:', {
    totalUsers: users.length,
    filteredUsers: filteredUsers.length,
    currentTasks: formData.tasks,
    userRole: userProfile?.role,
    isJefeEditor: hasRole(ROLES.JEFE_EDITOR),
    isJefeTraductor: hasRole(ROLES.JEFE_TRADUCTOR)
  });
  
  // Limpiar assignedTo si el usuario seleccionado ya no está disponible
  React.useEffect(() => {
    if (formData.assignedTo && !filteredUsers.some(user => (user.uid || user.id) === formData.assignedTo)) {
      setFormData(prev => ({ ...prev, assignedTo: '' }));
    }
  }, [filteredUsers, formData.assignedTo]);

  // Estadísticas del usuario
  const stats = {
    total: assignments.length,
    completed: assignments.filter(a => a.status === 'completado').length,
    inProgress: assignments.filter(a => a.status === 'en_progreso').length,
    pending: assignments.filter(a => a.status === 'pendiente').length,
    overdue: assignments.filter(a => isOverdue(a.dueDate) && a.status !== 'completado').length
  };

  // Agrupar asignaciones por estado
  const groupedAssignments = {
    pending: assignments.filter(a => a.status === 'pendiente'),
    inProgress: assignments.filter(a => a.status === 'en_progreso'),
    completed: assignments.filter(a => a.status === 'completado')
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Work color="primary" sx={{ fontSize: '2rem' }} />
            Mi Panel de Trabajo
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Gestiona tus asignaciones y progreso de trabajo
          </Typography>
        </Box>
        
        {/* Botón Nueva Asignación para Jefes */}
        {(hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR)) && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAssignDialog(true)}
            sx={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              px: 3
            }}
          >
            Nueva Asignación
          </Button>
        )}
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <CardContent>
              <TaskAlt sx={{ fontSize: '3rem', color: 'white', mb: 1 }} />
              <Typography variant="h4" color="white">{stats.total}</Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                Total Asignaciones
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <CardContent>
              <CheckCircle sx={{ fontSize: '3rem', color: 'white', mb: 1 }} />
              <Typography variant="h4" color="white">{stats.completed}</Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                Completadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <CardContent>
              <Schedule sx={{ fontSize: '3rem', color: 'white', mb: 1 }} />
              <Typography variant="h4" color="white">{stats.inProgress}</Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                En Progreso
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #64748b, #475569)' }}>
            <CardContent>
              <Assignment sx={{ fontSize: '3rem', color: 'white', mb: 1 }} />
              <Typography variant="h4" color="white">{stats.pending}</Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <CardContent>
              <Warning sx={{ fontSize: '3rem', color: 'white', mb: 1 }} />
              <Typography variant="h4" color="white">{stats.overdue}</Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                Vencidas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Asignaciones por estado */}
      <Grid container spacing={3}>
        {/* Pendientes */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '600px', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assignment color="action" />
                Pendientes ({groupedAssignments.pending.length})
              </Typography>
            </Box>
            <Box sx={{ height: 'calc(600px - 80px)', overflow: 'auto', p: 1 }}>
              {groupedAssignments.pending.map((assignment) => (
                <Card key={assignment.id} sx={{ mb: 2 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {assignment.mangaTitle}
                      </Typography>
                      {assignment.priority === 'alta' && (
                        <Chip size="small" label="Alta" color="error" />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      Capítulo {assignment.chapter}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {(assignment.tasks || [assignment.type]).map((task, index) => (
                        <Chip
                          key={index}
                          size="small"
                          label={TASK_TYPES[task] || task}
                          variant="outlined"
                        />
                      ))}
                    </Box>

                    {assignment.dueDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <CalendarToday sx={{ fontSize: '0.9rem', color: isOverdue(assignment.dueDate) ? 'error.main' : 'text.secondary' }} />
                        <Typography 
                          variant="caption" 
                          color={isOverdue(assignment.dueDate) ? 'error' : 'textSecondary'}
                        >
                          {new Date(assignment.dueDate).toLocaleDateString('es-ES')}
                          {isOverdue(assignment.dueDate) && ' (Vencida)'}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ pt: 0 }}>
                    <Button
                      size="small"
                      startIcon={<PlayArrow />}
                      onClick={() => openProgressDialog(assignment)}
                    >
                      Comenzar
                    </Button>
                    {assignment.driveLink && (
                      <Tooltip title="Abrir en Google Drive">
                        <IconButton 
                          size="small" 
                          onClick={() => window.open(assignment.driveLink, '_blank')}
                        >
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              ))}
              
              {groupedAssignments.pending.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Assignment sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
                  <Typography color="textSecondary">
                    No tienes asignaciones pendientes
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* En Progreso */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '600px', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule color="warning" />
                En Progreso ({groupedAssignments.inProgress.length})
              </Typography>
            </Box>
            <Box sx={{ height: 'calc(600px - 80px)', overflow: 'auto', p: 1 }}>
              {groupedAssignments.inProgress.map((assignment) => (
                <Card key={assignment.id} sx={{ mb: 2 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {assignment.mangaTitle}
                      </Typography>
                      {assignment.priority === 'alta' && (
                        <Chip size="small" label="Alta" color="error" />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      Capítulo {assignment.chapter}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {(assignment.tasks || [assignment.type]).map((task, index) => (
                        <Chip
                          key={index}
                          size="small"
                          label={TASK_TYPES[task] || task}
                          variant="outlined"
                        />
                      ))}
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Progreso</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {assignment.progress || 0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={assignment.progress || 0}
                        color={getProgressColor(assignment.progress || 0)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {assignment.dueDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: '0.9rem', color: isOverdue(assignment.dueDate) ? 'error.main' : 'text.secondary' }} />
                        <Typography 
                          variant="caption" 
                          color={isOverdue(assignment.dueDate) ? 'error' : 'textSecondary'}
                        >
                          {new Date(assignment.dueDate).toLocaleDateString('es-ES')}
                          {isOverdue(assignment.dueDate) && ' (Vencida)'}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ pt: 0 }}>
                    <Button
                      size="small"
                      startIcon={<TrendingUp />}
                      onClick={() => openProgressDialog(assignment)}
                    >
                      Actualizar
                    </Button>
                    {assignment.driveLink && (
                      <Tooltip title="Abrir en Google Drive">
                        <IconButton 
                          size="small" 
                          onClick={() => window.open(assignment.driveLink, '_blank')}
                        >
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              ))}
              
              {groupedAssignments.inProgress.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Schedule sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
                  <Typography color="textSecondary">
                    No tienes trabajo en progreso
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Completadas */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '600px', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="success" />
                Completadas ({groupedAssignments.completed.length})
              </Typography>
            </Box>
            <Box sx={{ height: 'calc(600px - 80px)', overflow: 'auto', p: 1 }}>
              {groupedAssignments.completed.map((assignment) => (
                <Card key={assignment.id} sx={{ mb: 2, opacity: 0.8 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {assignment.mangaTitle}
                      </Typography>
                      <CheckCircle color="success" sx={{ fontSize: '1.2rem' }} />
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      Capítulo {assignment.chapter}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(assignment.tasks || [assignment.type]).map((task, index) => (
                        <Chip
                          key={index}
                          size="small"
                          label={TASK_TYPES[task] || task}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
              
              {groupedAssignments.completed.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
                  <Typography color="textSecondary">
                    Aún no has completado ninguna asignación
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog para actualizar progreso */}
      <Dialog open={progressDialog} onClose={() => setProgressDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Actualizar Progreso
        </DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {selectedAssignment.mangaTitle} - Capítulo {selectedAssignment.chapter}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Tareas: {(selectedAssignment.tasks || [selectedAssignment.type]).map(task => TASK_TYPES[task] || task).join(', ')}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Progreso: {newProgress}%
                </Typography>
                <TextField
                  type="number"
                  fullWidth
                  value={newProgress}
                  onChange={(e) => setNewProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  inputProps={{ min: 0, max: 100 }}
                  helperText="Ingresa un porcentaje entre 0 y 100"
                />
              </Box>

              <LinearProgress
                variant="determinate"
                value={newProgress}
                color={getProgressColor(newProgress)}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpdateProgress} variant="contained">
            Actualizar Progreso
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear nueva asignación */}
      <Dialog 
        open={openAssignDialog} 
        onClose={() => { setOpenAssignDialog(false); resetForm(); }} 
        maxWidth="md" 
        fullWidth
        disableEnforceFocus={false}
        keepMounted={false}
      >
        <DialogTitle>
          Nueva Asignación
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Manga"
                value={formData.mangaId}
                onChange={(e) => setFormData({ ...formData, mangaId: e.target.value })}
                required
              >
                {mangas.map((manga) => (
                  <MenuItem key={manga.id} value={manga.id}>
                    {manga.title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Capítulo"
                type="number"
                value={formData.chapter}
                onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Prioridad"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="media">Media</MenuItem>
                <MenuItem value="alta">Alta</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tareas</InputLabel>
                <Select
                  multiple
                  value={formData.tasks}
                  onChange={(e) => setFormData({ ...formData, tasks: e.target.value })}
                  input={<OutlinedInput label="Tareas" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={TASK_TYPES[value]} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {Object.entries(TASK_TYPES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      <Checkbox checked={formData.tasks.indexOf(key) > -1} />
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Asignar a"
                value={filteredUsers.some(user => (user.uid || user.id) === formData.assignedTo) ? formData.assignedTo : ''}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                required
                helperText={filteredUsers.length === 0 ? "No hay usuarios disponibles para las tareas seleccionadas" : ""}
                error={filteredUsers.length === 0}
              >
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <MenuItem key={user.uid || user.id} value={user.uid || user.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {user.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{user.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {user.role}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    <Typography color="textSecondary">
                      No hay usuarios disponibles
                    </Typography>
                  </MenuItem>
                )}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Link de Drive del capítulo"
                value={formData.driveLink}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                InputProps={{
                  startAdornment: <LinkIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                placeholder="https://drive.google.com/..."
                helperText="Enlace al capítulo en Google Drive (requerido)"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fecha límite"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                helperText="Fecha límite para completar la asignación"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenAssignDialog(false); resetForm(); }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitAssignment} 
            variant="contained"
            disabled={!formData.mangaId || !formData.chapter || !formData.assignedTo || !formData.driveLink}
          >
            Crear Asignación
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyWorks;
