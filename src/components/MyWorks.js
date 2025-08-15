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
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
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
  Download,
  ViewKanban,
  ViewModule,
  FilterList,
  Book as BookIcon,
  Upload as UploadIcon,
  AccountCircle as AccountCircleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Componente para mostrar un capítulo agrupado con todas sus tareas (del SeriesManagement)
const ChapterCard = ({ chapterGroup, userRole, onMarkComplete, onMarkUploaded }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const ASSIGNMENT_TYPES = {
    traduccion: { label: 'Traducción', color: '#6366f1', short: 'T' },
    proofreading: { label: 'Proofreading', color: '#ec4899', short: 'P' },
    cleanRedrawer: { label: 'Clean/Redrawer', color: '#10b981', short: 'C' },
    type: { label: 'Typesetting', color: '#f59e0b', short: 'Ty' }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'pendiente':
        return 'warning';
      case 'completed':
      case 'completado':
        return 'success';
      case 'uploaded':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      case 'completed':
      case 'completado':
        return 'Completado';
      case 'uploaded':
        return 'Subido';
      default:
        return 'Desconocido';
    }
  };

  const canMarkComplete = (assignment) => {
    return assignment.status === 'pending' || assignment.status === 'pendiente';
  };

  const canMarkUploaded = (assignment) => {
    return userRole === 'uploader' && (assignment.status === 'completed' || assignment.status === 'completado');
  };

  // Determinar si alguna tarea está atrasada
  const hasOverdueTask = chapterGroup.assignments.some(assignment => 
    assignment.dueDate && new Date(assignment.dueDate) < new Date() &&
    (assignment.status === 'pending' || assignment.status === 'pendiente')
  );

  // Calcular progreso general del capítulo
  const completedTasks = chapterGroup.assignments.filter(a => a.status === 'completed' || a.status === 'completado').length;
  const totalTasks = chapterGroup.assignments.length;
  const chapterProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isChapterCompleted = completedTasks === totalTasks;
  
  // Determinar si el capítulo está en progreso
  const isChapterInProgress = totalTasks > 1 && completedTasks > 0 && completedTasks < totalTasks;

  return (
    <>
      <Card 
        sx={{ 
          mb: 2,
          border: hasOverdueTask ? '2px solid #ef4444' : 
                  isChapterCompleted ? '2px solid #10b981' : 
                  isChapterInProgress ? '2px solid #f59e0b' : 
                  '1px solid rgba(148, 163, 184, 0.1)',
          position: 'relative',
          backgroundColor: hasOverdueTask ? 'inherit' :
                          isChapterCompleted ? 'rgba(16, 185, 129, 0.05)' : 
                          isChapterInProgress ? 'rgba(245, 158, 11, 0.05)' : 
                          'inherit',
          '&::before': hasOverdueTask ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#ef4444',
          } : isChapterCompleted ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#10b981',
          } : isChapterInProgress ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#f59e0b',
          } : {},
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              {/* Header del capítulo */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BookIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  {chapterGroup.mangaTitle}
                </Typography>
                <Chip
                  label={`Cap. ${chapterGroup.chapter}`}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
                {isChapterCompleted && (
                  <Chip
                    label="Completado"
                    size="small"
                    sx={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                )}
                {isChapterInProgress && (
                  <Chip
                    label="En Progreso"
                    size="small"
                    sx={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                )}
              </Box>
              
              {/* Lista de tareas */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
                  Tareas asignadas ({chapterGroup.assignments.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {chapterGroup.assignments.map((assignment, index) => {
                    const taskTypeConfig = ASSIGNMENT_TYPES[assignment.type] || ASSIGNMENT_TYPES.traduccion;
                    return (
                      <Chip
                        key={index}
                        label={taskTypeConfig.label}
                        size="small"
                        color={getStatusColor(assignment.status)}
                        sx={{
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setSelectedTask(assignment);
                          setDetailsOpen(true);
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>

              {/* Fecha límite más próxima */}
              {(() => {
                const nextDueDate = chapterGroup.assignments
                  .filter(a => a.dueDate && (a.status === 'pending' || a.status === 'pendiente'))
                  .map(a => new Date(a.dueDate))
                  .sort((a, b) => a - b)[0];
                
                if (nextDueDate) {
                  const isOverdue = nextDueDate < new Date();
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {isOverdue ? <Warning sx={{ color: '#ef4444', fontSize: '1rem' }} /> : <Schedule sx={{ fontSize: '1rem', color: 'textSecondary' }} />}
                      <Typography 
                        variant="body2" 
                        color={isOverdue ? 'error' : 'textSecondary'}
                        sx={{ fontWeight: isOverdue ? 600 : 400 }}
                      >
                        Próxima fecha límite: {nextDueDate.toLocaleDateString('es-ES')}
                        {isOverdue && ' (Atrasada)'}
                      </Typography>
                    </Box>
                  );
                }
                return null;
              })()}

              {/* Progreso del capítulo */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Progreso del capítulo
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {completedTasks}/{totalTasks} tareas ({Math.round(chapterProgress)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={chapterProgress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(148, 163, 184, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      background: isChapterCompleted ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Acciones */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedTask(null);
                  setDetailsOpen(true);
                }}
              >
                Ver Capítulo
              </Button>

              {chapterGroup.driveLink && (
                <Button
                  size="small"
                  startIcon={<LinkIcon />}
                  href={chapterGroup.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textTransform: 'none' }}
                >
                  Abrir en Drive
                </Button>
              )}

              {/* Botones de acción rápida para tareas pendientes */}
              {chapterGroup.assignments.filter(a => canMarkComplete(a)).length > 0 && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<CheckCircle />}
                  onClick={() => {
                    // Marcar todas las tareas pendientes como completadas
                    const pendingTasks = chapterGroup.assignments.filter(a => canMarkComplete(a));
                    pendingTasks.forEach(task => onMarkComplete(task.id));
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669, #047857)',
                    },
                  }}
                >
                  Completar Todo
                </Button>
              )}

              {chapterGroup.assignments.filter(a => canMarkUploaded(a)).length > 0 && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => {
                    // Marcar todas las tareas completadas como subidas
                    const completedTasks = chapterGroup.assignments.filter(a => canMarkUploaded(a));
                    completedTasks.forEach(task => onMarkUploaded(task.id));
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    },
                  }}
                >
                  Marcar Subido
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog con detalles del capítulo o tarea específica */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTask ? 'Detalles de la Tarea' : 'Detalles del Capítulo'}
        </DialogTitle>
        <DialogContent>
          {selectedTask ? (
            // Detalles de una tarea específica
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedTask.mangaTitle || selectedTask.manga} - Capítulo {selectedTask.chapter}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Tarea:</strong> {ASSIGNMENT_TYPES[selectedTask.type]?.label || selectedTask.taskType || selectedTask.type}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Estado:</strong> {getStatusLabel(selectedTask.status)}
                </Typography>
              </Grid>
              {selectedTask.assignedDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Asignado:</strong> {new Date(selectedTask.assignedDate).toLocaleDateString('es-ES')}
                  </Typography>
                </Grid>
              )}
              {selectedTask.dueDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Fecha límite:</strong> {new Date(selectedTask.dueDate).toLocaleDateString('es-ES')}
                  </Typography>
                </Grid>
              )}
              {(selectedTask.description || selectedTask.notes) && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Descripción:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {selectedTask.description || selectedTask.notes}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  {canMarkComplete(selectedTask) && (
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        onMarkComplete(selectedTask.id);
                        setDetailsOpen(false);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669, #047857)',
                        },
                      }}
                    >
                      Marcar Completado
                    </Button>
                  )}
                  {canMarkUploaded(selectedTask) && (
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => {
                        onMarkUploaded(selectedTask.id);
                        setDetailsOpen(false);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        },
                      }}
                    >
                      Marcar Subido
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          ) : (
            // Detalles del capítulo completo
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {chapterGroup.mangaTitle} - Capítulo {chapterGroup.chapter}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Progreso general:</strong> {completedTasks}/{totalTasks} tareas completadas ({Math.round(chapterProgress)}%)
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Tareas asignadas:</strong>
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tarea</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Fecha límite</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chapterGroup.assignments.map((assignment, index) => (
                      <TableRow key={index}>
                        <TableCell>{ASSIGNMENT_TYPES[assignment.type]?.label || assignment.type}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(assignment.status)}
                            color={getStatusColor(assignment.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('es-ES') : '-'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {canMarkComplete(assignment) && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  onMarkComplete(assignment.id);
                                }}
                              >
                                Completar
                              </Button>
                            )}
                            {canMarkUploaded(assignment) && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  onMarkUploaded(assignment.id);
                                }}
                              >
                                Subir
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const MyWorks = () => {
  const { userProfile, hasRole } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [mangas, setMangas] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [progressDialog, setProgressDialog] = useState(false);
  const [newProgress, setNewProgress] = useState(0);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' o 'grouped'
  const [staffFilter, setStaffFilter] = useState('all');
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
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completado': return <CheckCircle color="success" />;
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
      // Directly mark as completed when progress is updated
      await realtimeService.updateAssignment(selectedAssignment.id, {
        progress: 100,
        status: 'completado',
        completedDate: new Date().toISOString(),
        completedBy: userProfile.uid
      });
      
      toast.success('Tarea marcada como completada exitosamente');
      setProgressDialog(false);
      setSelectedAssignment(null);
      setNewProgress(0);
    } catch (error) {
      //  message removed for production
      toast.error('Error al completar la tarea');
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
      //  message removed for production
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
    // Debug message removed for production
    
    return canAssign;
  });
  
  // Debug: mostrar información del filtro
  // Debug message removed for production
  
  // Limpiar assignedTo si el usuario seleccionado ya no está disponible
  React.useEffect(() => {
    if (formData.assignedTo && !filteredUsers.some(user => (user.uid || user.id) === formData.assignedTo)) {
      setFormData(prev => ({ ...prev, assignedTo: '' }));
    }
  }, [filteredUsers, formData.assignedTo]);

  // Funciones para manejar el marcado como completado y subido
  const handleMarkComplete = async (assignmentId) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      const assignmentInfo = assignment 
        ? `${assignment.mangaTitle} Cap.${assignment.chapter} - ${TASK_TYPES[assignment.type] || assignment.type}`
        : 'Asignación';
      
      await realtimeService.updateAssignment(assignmentId, {
        status: 'completado',
        progress: 100,
        completedDate: new Date().toISOString(),
        completedBy: userProfile.uid
      });
      
      toast.success(
        `✅ Completada: ${assignmentInfo}`,
        {
          duration: 3000,
          icon: '🎉'
        }
      );
    } catch (error) {
      //  message removed for production
      toast.error(`❌ Error al marcar como completada: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleMarkUploaded = async (assignmentId) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      const assignmentInfo = assignment 
        ? `${assignment.mangaTitle} Cap.${assignment.chapter} - ${TASK_TYPES[assignment.type] || assignment.type}`
        : 'Asignación';
      
      await realtimeService.updateAssignment(assignmentId, {
        status: 'uploaded',
        uploadedDate: new Date().toISOString(),
        uploadedBy: userProfile.uid
      });
      
      toast.success(
        `📤 Subida: ${assignmentInfo}`,
        {
          duration: 3000,
          icon: '🚀'
        }
      );
    } catch (error) {
      //  message removed for production
      toast.error(`❌ Error al marcar como subida: ${error.message || 'Error desconocido'}`);
    }
  };

  // Estadísticas del usuario ampliadas
  const stats = {
    total: assignments.length,
    completed: assignments.filter(a => a.status === 'completado').length,
    pending: assignments.filter(a => a.status === 'pendiente').length,
    uploaded: assignments.filter(a => a.status === 'uploaded').length,
    overdue: assignments.filter(a => isOverdue(a.dueDate) && a.status !== 'completado' && a.status !== 'uploaded').length
  };

  // Filtrar asignaciones según el filtro de staff
  const getFilteredAssignments = () => {
    switch (staffFilter) {
      case 'pending':
      case 'pendiente':
        return assignments.filter(a => a.status === 'pending' || a.status === 'pendiente');
      case 'completed':
      case 'completado':
        return assignments.filter(a => a.status === 'completed' || a.status === 'completado');
      case 'uploaded':
        return assignments.filter(a => a.status === 'uploaded');
      case 'overdue':
        return assignments.filter(a => 
          isOverdue(a.dueDate) && 
          a.status !== 'completado' && 
          a.status !== 'completed' && 
          a.status !== 'uploaded'
        );
      default:
        return assignments;
    }
  };

  // Agrupar asignaciones por manga-capítulo para vista agrupada
  const getGroupedUserAssignments = () => {
    const filteredAssignments = getFilteredAssignments();
    
    const groups = {};
    filteredAssignments.forEach(assignment => {
      const key = `${assignment.mangaId}-${assignment.chapter}`;
      if (!groups[key]) {
        groups[key] = {
          mangaId: assignment.mangaId,
          mangaTitle: assignment.mangaTitle || assignment.manga,
          chapter: assignment.chapter,
          assignments: [],
          driveLink: assignment.driveLink
        };
      }
      groups[key].assignments.push(assignment);
      // Actualizar el drive link si no existe pero la nueva asignación sí tiene uno
      if (!groups[key].driveLink && assignment.driveLink) {
        groups[key].driveLink = assignment.driveLink;
      }
    });

    // Convertir a array y ordenar por manga y capítulo
    return Object.values(groups).sort((a, b) => {
      if (a.mangaTitle !== b.mangaTitle) {
        return a.mangaTitle.localeCompare(b.mangaTitle);
      }
      return parseInt(a.chapter) - parseInt(b.chapter);
    });
  };

  // Agrupar asignaciones por estado para vista kanban
  const groupedAssignments = {
    pending: assignments.filter(a => a.status === 'pendiente'),
    completed: assignments.filter(a => a.status === 'completado')
  };

  // Función para agrupar asignaciones por capítulo en vista Kanban
  const getKanbanGroupedAssignments = (assignments) => {
    const groups = {};
    assignments.forEach(assignment => {
      const key = `${assignment.mangaId}-${assignment.chapter}`;
      if (!groups[key]) {
        groups[key] = {
          mangaId: assignment.mangaId,
          mangaTitle: assignment.mangaTitle || assignment.manga,
          chapter: assignment.chapter,
          assignments: [],
          driveLink: assignment.driveLink,
          earliestDueDate: assignment.dueDate,
          hasOverdue: false,
          priority: 'normal'
        };
      }
      groups[key].assignments.push(assignment);
      
      // Actualizar el drive link si no existe
      if (!groups[key].driveLink && assignment.driveLink) {
        groups[key].driveLink = assignment.driveLink;
      }
      
      // Encontrar la fecha límite más temprana
      if (assignment.dueDate) {
        if (!groups[key].earliestDueDate || new Date(assignment.dueDate) < new Date(groups[key].earliestDueDate)) {
          groups[key].earliestDueDate = assignment.dueDate;
        }
      }
      
      // Verificar si hay tareas atrasadas
      if (assignment.dueDate && isOverdue(assignment.dueDate)) {
        groups[key].hasOverdue = true;
      }
      
      // Obtener la prioridad más alta
      if (assignment.priority === 'alta' || groups[key].priority !== 'alta') {
        if (assignment.priority === 'alta') groups[key].priority = 'alta';
        else if (assignment.priority === 'media' && groups[key].priority === 'normal') {
          groups[key].priority = 'media';
        }
      }
    });
    
    return Object.values(groups).sort((a, b) => {
      // Ordenar por prioridad, luego por fecha
      const priorityOrder = { alta: 3, media: 2, normal: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      
      if (a.earliestDueDate && b.earliestDueDate) {
        return new Date(a.earliestDueDate) - new Date(b.earliestDueDate);
      }
      
      return a.mangaTitle.localeCompare(b.mangaTitle) || parseInt(a.chapter) - parseInt(b.chapter);
    });
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

      {/* Controles de vista y filtros avanzados */}
      <Card sx={{ mb: 4, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FilterList sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Vista y Filtros
            </Typography>
          </Box>
          
          {/* Selector de vista */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newView) => newView && setViewMode(newView)}
            size="small"
          >
            <ToggleButton value="kanban">
              <ViewKanban sx={{ mr: 1 }} />
              Kanban
            </ToggleButton>
            <ToggleButton value="grouped">
              <ViewModule sx={{ mr: 1 }} />
              Agrupado
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        {/* Filtro por estado (solo para vista agrupada) */}
        {viewMode === 'grouped' && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filtrar por estado</InputLabel>
                <Select
                  value={staffFilter}
                  label="Filtrar por estado"
                  onChange={(e) => setStaffFilter(e.target.value)}
                >
                  <MenuItem value="all">Todas las asignaciones</MenuItem>
                  <MenuItem value="pending">Pendientes ({stats.pending})</MenuItem>
                  <MenuItem value="completed">Completadas ({stats.completed})</MenuItem>
                  <MenuItem value="uploaded">Subidas ({stats.uploaded || 0})</MenuItem>
                  <MenuItem value="overdue">Atrasadas ({stats.overdue})</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Chip 
                  label={`${getGroupedUserAssignments().length} capítulos mostrados`}
                  size="small" 
                  color="primary" 
                />
                <Chip 
                  label={`${getFilteredAssignments().length} tareas mostradas`}
                  size="small" 
                  color="info" 
                />
                <Chip 
                  label={`${assignments.length} tareas totales`}
                  size="small" 
                  color="secondary" 
                />
              </Box>
            </Grid>
          </Grid>
        )}
      </Card>

      {/* Información del usuario para vista agrupada */}
      {viewMode === 'grouped' && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar 
              src={userProfile?.profileImage || userProfile?.photoURL || userProfile?.avatar}
              sx={{ 
                width: 48, 
                height: 48,
                border: '2px solid #6366f1',
              }}
            >
              {!(userProfile?.profileImage || userProfile?.photoURL || userProfile?.avatar) && 
                userProfile?.name?.substring(0, 1).toUpperCase()
              }
            </Avatar>
            <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
              {userProfile?.name || 'Usuario'}
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3, p: 1.5, fontSize: '0.875rem' }}>
            <Typography variant="body2" sx={{ m: 0 }}>
              Tienes {stats.total} asignaciones activas. Vista agrupada por capítulos.
            </Typography>
          </Alert>
        </>
      )}

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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


        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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

      {/* Contenido principal basado en el modo de vista */}
      {viewMode === 'grouped' ? (
        // Vista agrupada por capítulos
        <>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Mis Asignaciones Agrupadas
          </Typography>
          
          {getGroupedUserAssignments().length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 8 }}>
              <Assignment sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                {staffFilter === 'all' ? 'No tienes asignaciones actualmente' : `No tienes asignaciones ${staffFilter === 'pending' ? 'pendientes' : staffFilter === 'completed' ? 'completadas' : staffFilter === 'overdue' ? 'atrasadas' : 'subidas'} actualmente`}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {staffFilter === 'all' ? 'Las nuevas asignaciones aparecerán aquí cuando te sean otorgadas' : 'Cambia el filtro para ver otras asignaciones'}
              </Typography>
            </Card>
          ) : (
            <Box>
              {getGroupedUserAssignments().map((chapterGroup, index) => (
                <Box
                  key={`${chapterGroup.mangaId}-${chapterGroup.chapter}`}
                  sx={{
                    animation: `fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`,
                  }}
                >
                  <ChapterCard
                    chapterGroup={chapterGroup}
                    userRole={userProfile?.role}
                    onMarkComplete={handleMarkComplete}
                    onMarkUploaded={handleMarkUploaded}
                  />
                </Box>
              ))}
            </Box>
          )}
        </>
      ) : (
        // Vista Kanban por estado
        <Grid container spacing={3}>
        {/* Pendientes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ height: '600px', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assignment color="action" />
                Pendientes ({groupedAssignments.pending.length})
              </Typography>
            </Box>
            <Box sx={{ height: 'calc(600px - 80px)', overflow: 'auto', p: 1 }}>
              {getKanbanGroupedAssignments(groupedAssignments.pending).map((chapterGroup) => (
                <Card 
                  key={`${chapterGroup.mangaId}-${chapterGroup.chapter}`} 
                  sx={{ 
                    mb: 2,
                    border: chapterGroup.hasOverdue ? '2px solid #ef4444' : 
                            chapterGroup.priority === 'alta' ? '2px solid #f59e0b' :
                            '1px solid rgba(148, 163, 184, 0.2)',
                    background: chapterGroup.hasOverdue ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.02))' :
                               chapterGroup.priority === 'alta' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02))' :
                               'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.02))',
                    position: 'relative',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: chapterGroup.hasOverdue ? 'linear-gradient(90deg, #ef4444, #dc2626)' :
                                 chapterGroup.priority === 'alta' ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                                 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                      borderRadius: '6px 6px 0 0'
                    }
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    {/* Header con título y badges */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 0.5 }}>
                          {chapterGroup.mangaTitle}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`Capítulo ${chapterGroup.chapter}`}
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              color: 'white',
                              fontWeight: 500,
                              fontSize: '0.75rem'
                            }}
                          />
                          {chapterGroup.assignments.length > 1 && (
                            <Chip
                              label={`${chapterGroup.assignments.length} tareas`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {/* Badges de estado */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                        {chapterGroup.hasOverdue && (
                          <Chip 
                            size="small" 
                            label="Atrasada" 
                            color="error"
                            sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                            icon={<Warning sx={{ fontSize: '0.9rem !important' }} />}
                          />
                        )}
                        {chapterGroup.priority === 'alta' && !chapterGroup.hasOverdue && (
                          <Chip 
                            size="small" 
                            label="Prioridad Alta" 
                            color="warning"
                            sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                            icon={<PriorityHigh sx={{ fontSize: '0.9rem !important' }} />}
                          />
                        )}
                        {chapterGroup.priority === 'media' && !chapterGroup.hasOverdue && (
                          <Chip 
                            size="small" 
                            label="Prioridad Media" 
                            color="info"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Lista de tareas */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500, fontSize: '0.8rem' }}>
                        Tareas asignadas:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {chapterGroup.assignments.map((assignment, index) => (
                          <Chip
                            key={index}
                            size="small"
                            label={TASK_TYPES[assignment.type] || assignment.type}
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: '24px',
                              backgroundColor: 'rgba(99, 102, 241, 0.08)',
                              borderColor: 'rgba(99, 102, 241, 0.3)',
                              color: '#4f46e5',
                              fontWeight: 500
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Fecha límite */}
                    {chapterGroup.earliestDueDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1, borderRadius: 1, backgroundColor: 'rgba(148, 163, 184, 0.05)' }}>
                        {chapterGroup.hasOverdue ? 
                          <Warning sx={{ fontSize: '1rem', color: '#ef4444' }} /> : 
                          <Schedule sx={{ fontSize: '1rem', color: '#6366f1' }} />
                        }
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: chapterGroup.hasOverdue ? '#ef4444' : '#374151',
                            fontWeight: chapterGroup.hasOverdue ? 600 : 500,
                            fontSize: '0.85rem'
                          }}
                        >
                          {chapterGroup.hasOverdue ? 'Vencida: ' : 'Fecha límite: '}
                          {new Date(chapterGroup.earliestDueDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={() => {
                          // Completar todas las tareas del capítulo
                          chapterGroup.assignments.forEach(assignment => {
                            handleMarkComplete(assignment.id);
                          });
                        }}
                        sx={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669, #047857)',
                          },
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        Completar {chapterGroup.assignments.length > 1 ? 'Todo' : 'Tarea'}
                      </Button>
                      
                      {chapterGroup.driveLink && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<LinkIcon />}
                          onClick={() => window.open(chapterGroup.driveLink, '_blank')}
                          sx={{
                            minWidth: 'auto',
                            borderColor: 'rgba(99, 102, 241, 0.3)',
                            color: '#6366f1',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            px: 1,
                            '&:hover': {
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              borderColor: '#6366f1'
                            }
                          }}
                        >
                          Drive
                        </Button>
                      )}
                    </Box>
                  </CardActions>
                </Card>
              ))}
              
              {getKanbanGroupedAssignments(groupedAssignments.pending).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Assignment sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                    No tienes asignaciones pendientes
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Las nuevas tareas aparecerán aquí cuando te sean asignadas
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>


        {/* Completadas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ height: '600px', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="success" />
                Completadas ({groupedAssignments.completed.length})
              </Typography>
            </Box>
            <Box sx={{ height: 'calc(600px - 80px)', overflow: 'auto', p: 1 }}>
              {getKanbanGroupedAssignments(groupedAssignments.completed).map((chapterGroup) => (
                <Card 
                  key={`completed-${chapterGroup.mangaId}-${chapterGroup.chapter}`} 
                  sx={{ 
                    mb: 2, 
                    opacity: 0.9,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #10b981, #059669)',
                      borderRadius: '6px 6px 0 0'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 0.5 }}>
                          {chapterGroup.mangaTitle}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`Capítulo ${chapterGroup.chapter}`}
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              fontWeight: 500,
                              fontSize: '0.75rem'
                            }}
                          />
                          {chapterGroup.assignments.length > 1 && (
                            <Chip
                              label={`${chapterGroup.assignments.length} tareas`}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                color: '#059669',
                                fontSize: '0.7rem',
                                fontWeight: 500
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      <CheckCircle 
                        sx={{ 
                          fontSize: '2rem', 
                          color: '#10b981',
                          filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))'
                        }} 
                      />
                    </Box>

                    {/* Lista de tareas completadas */}
                    <Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500, fontSize: '0.8rem' }}>
                        Tareas completadas:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {chapterGroup.assignments.map((assignment, index) => (
                          <Chip
                            key={index}
                            size="small"
                            label={TASK_TYPES[assignment.type] || assignment.type}
                            sx={{
                              fontSize: '0.7rem',
                              height: '24px',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              borderColor: 'rgba(16, 185, 129, 0.3)',
                              color: '#059669',
                              fontWeight: 500,
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              
              {getKanbanGroupedAssignments(groupedAssignments.completed).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                    Aún no has completado ninguna asignación
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Las tareas completadas aparecerán aquí
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      )}

      {/* Dialog para actualizar progreso */}
      <Dialog open={progressDialog} onClose={() => setProgressDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Completar Tarea
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

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Esta acción marcará la tarea como completada (100% de progreso).
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpdateProgress} variant="contained">
            Marcar como Completada
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
