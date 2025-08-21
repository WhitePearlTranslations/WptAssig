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
  AlertTitle,
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
  Refresh as RefreshIcon,
  ThumbUp,
  HourglassTop
} from '@mui/icons-material';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import { realtimeService } from '../services/realtimeService';
import { ASSIGNMENT_STATUS, STATUS_CONFIG, TASK_TYPES, isChiefRole, matchChiefRoleForAssignmentType } from '../utils/constants';
import toast from 'react-hot-toast';

// Componente para mostrar un capítulo agrupado con todas sus tareas (del SeriesManagement)
const ChapterCard = ({ chapterGroup, userRole, onMarkComplete, onMarkUploaded, onResubmitForReview }) => {
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
      case 'aprobado':
        return 'success';
      case 'pendiente_aprobacion':
        return 'warning';
      case 'rechazado':
        return 'error';
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
      case 'aprobado':
        return 'Aprobado';
      case 'pendiente_aprobacion':
        return 'Esperando Aprobación';
      case 'rechazado':
        return 'Rechazado';
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
    return userRole === 'uploader' && (
      assignment.status === 'completed' || 
      assignment.status === 'completado' || 
      assignment.status === 'aprobado'
    );
  };

  // Determinar si alguna tarea está atrasada
  const hasOverdueTask = chapterGroup.assignments.some(assignment => 
    assignment.dueDate && new Date(assignment.dueDate) < new Date() &&
    (assignment.status === 'pending' || assignment.status === 'pendiente')
  );

  // Calcular progreso general del capítulo
  const completedTasks = chapterGroup.assignments.filter(a => 
    a.status === 'completed' || 
    a.status === 'completado' || 
    a.status === 'aprobado'
  ).length;
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

              {/* Botón RAW para traducciones */}
              {(() => {
                // Buscar si hay alguna tarea de traducción con rawLink
                const translationTask = chapterGroup.assignments.find(a => a.type === 'traduccion' && a.rawLink);
                return translationTask ? (
                  <Button
                    size="small"
                    startIcon={<LinkIcon />}
                    href={translationTask.rawLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      textTransform: 'none',
                      borderColor: '#6366f1',
                      color: '#6366f1',
                      '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderColor: '#4f46e5'
                      }
                    }}
                  >
                    Ver RAW
                  </Button>
                ) : null;
              })()}

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
                  <strong>Estado:</strong> {getStatusLabel(selectedTask.status, selectedTask)}
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
              
              {/* Enlaces del ChapterCard interno */}
              {(selectedTask.driveLink || selectedTask.rawLink) && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    <strong>Enlaces:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedTask.driveLink && (
                      <Button
                        startIcon={<LinkIcon />}
                        href={selectedTask.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="small"
                        sx={{ textTransform: 'none' }}
                      >
                        Abrir en Google Drive
                      </Button>
                    )}
                    {selectedTask.rawLink && selectedTask.type === 'traduccion' && (
                      <Button
                        startIcon={<LinkIcon />}
                        href={selectedTask.rawLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="small"
                        sx={{ 
                          textTransform: 'none',
                          borderColor: '#6366f1',
                          color: '#6366f1',
                          '&:hover': {
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            borderColor: '#4f46e5'
                          }
                        }}
                      >
                        Ver RAW para Traducir
                      </Button>
                    )}
                  </Box>
                </Grid>
              )}
              
              {/* Información de revisión/rechazo */}
              {(selectedTask.status === 'pendiente' || selectedTask.status === 'rechazado') && selectedTask.reviewComment && (
                <Grid item xs={12}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mt: 2,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      '& .MuiAlert-icon': {
                        color: '#ef4444'
                      }
                    }}
                  >
                    <AlertTitle sx={{ color: '#ef4444', fontWeight: 600 }}>
                      Tarea rechazada por {selectedTask.reviewedByName || 'el jefe'}
                    </AlertTitle>
                    <Typography variant="body2" sx={{ mt: 1, color: '#374151' }}>
                      <strong>Motivo del rechazo:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: '#374151', p: 2, bgcolor: 'rgba(239, 68, 68, 0.05)', borderRadius: 1, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      {selectedTask.reviewComment}
                    </Typography>
                    {selectedTask.reviewedAt && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        Revisado el: {new Date(selectedTask.reviewedAt).toLocaleString('es-ES')}
                      </Typography>
                    )}
                    
                    {/* Botón para reenviar a revisión */}
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<Assignment />}
                        onClick={() => {
                          onResubmitForReview(selectedTask.id);
                          setDetailsOpen(false);
                        }}
                        sx={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669, #047857)',
                          },
                        }}
                      >
                        Reenviar a Revisión
                      </Button>
                    </Box>
                  </Alert>
                </Grid>
              )}
              
              {/* Información de aprobación */}
              {selectedTask.status === 'aprobado' && (
                <Grid item xs={12}>
                  <Alert 
                    severity="success" 
                    sx={{ mt: 2 }}
                  >
                    <AlertTitle sx={{ fontWeight: 600 }}>
                      Tarea aprobada por {selectedTask.reviewedByName || selectedTask.approvedByName || 'el jefe'}
                    </AlertTitle>
                    {selectedTask.reviewComment && (
                      <>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Comentario:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {selectedTask.reviewComment}
                        </Typography>
                      </>
                    )}
                    {(selectedTask.reviewedAt || selectedTask.approvedAt) && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        Aprobado el: {new Date(selectedTask.reviewedAt || selectedTask.approvedAt).toLocaleString('es-ES')}
                      </Typography>
                    )}
                  </Alert>
                </Grid>
              )}
              
              {/* Estado pendiente de aprobación */}
              {selectedTask.status === 'pendiente_aprobacion' && (
                <Grid item xs={12}>
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mt: 2,
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      borderColor: 'rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    <AlertTitle sx={{ color: '#f59e0b', fontWeight: 600 }}>
                      Esperando aprobación del jefe
                    </AlertTitle>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Tu trabajo ha sido enviado para revisión. El jefe lo revisará y te dará una respuesta pronto.
                    </Typography>
                    {selectedTask.pendingApprovalSince && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        Enviado para revisión el: {new Date(selectedTask.pendingApprovalSince).toLocaleString('es-ES')}
                      </Typography>
                    )}
                  </Alert>
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
                            label={getStatusLabel(assignment.status, assignment)}
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedChapterGroup, setSelectedChapterGroup] = useState(null);
  const [formData, setFormData] = useState({
    mangaId: '',
    chapter: '',
    tasks: ['traduccion'],
    assignedTo: '',
    driveLink: '',
    rawLink: '',
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

    let unsubscribeAssignments = null;
    let unsubscribeMangas = null;
    let unsubscribeUsers = null;

    // Initialize async subscriptions
    const initSubscriptions = async () => {
      try {
        // Obtener solo las asignaciones del usuario actual
        unsubscribeAssignments = await realtimeService.subscribeToAssignments(
          setAssignments, 
          userProfile.uid
        );

        // Obtener mangas para mostrar información completa
        unsubscribeMangas = await realtimeService.subscribeToMangas(setMangas);

        // Obtener usuarios si es jefe (para poder asignar)
        if (hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR)) {
          unsubscribeUsers = await realtimeService.subscribeToUsers(setUsers);
        }
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
      }
    };

    initSubscriptions();

    return () => {
      if (typeof unsubscribeAssignments === 'function') {
        unsubscribeAssignments();
      }
      if (typeof unsubscribeMangas === 'function') {
        unsubscribeMangas();
      }
      if (typeof unsubscribeUsers === 'function') {
        unsubscribeUsers();
      }
    };
  }, [userProfile]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completado': return 'success';
      case 'aprobado': return 'success';
      case 'pendiente_aprobacion': return 'warning';
      case 'rechazado': return 'error';
      case 'pendiente': return 'default';
      case 'uploaded': return 'primary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completado': return <CheckCircle color="success" />;
      case 'aprobado': return <ThumbUp color="success" />;
      case 'pendiente_aprobacion': return <HourglassTop color="warning" />;
      case 'rechazado': return <Warning color="error" />;
      case 'pendiente': return <Assignment color="action" />;
      case 'uploaded': return <UploadIcon color="primary" />;
      default: return <Assignment color="action" />;
    }
  };

  // Función para determinar si una asignación fue completada con atraso
  const wasCompletedLate = (assignment) => {
    if (!assignment.dueDate) return false;
    
    const finalStates = ['completado', 'aprobado', 'uploaded'];
    if (!finalStates.includes(assignment.status)) return false;
    
    const dueDate = new Date(assignment.dueDate);
    const completedDate = assignment.completedDate ? new Date(assignment.completedDate) : new Date();
    
    return completedDate > dueDate;
  };

  const getStatusLabel = (status, assignment = null) => {
    let statusText;
    switch (status) {
      case 'completado': statusText = 'Completado'; break;
      case 'aprobado': statusText = 'Aprobado'; break;
      case 'pendiente_aprobacion': statusText = 'Esperando Aprobación'; break;
      case 'rechazado': statusText = 'Rechazado'; break;
      case 'pendiente': statusText = 'Pendiente'; break;
      case 'uploaded': statusText = 'Subido'; break;
      default: statusText = 'Desconocido'; break;
    }
    
    // Agregar indicador de atraso si aplica
    if (assignment && wasCompletedLate(assignment)) {
      statusText += ' (con atraso)';
    }
    
    return statusText;
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
      const assignment = selectedAssignment;
      
      // Determinar si el usuario actual es un jefe o puede autocompletar
      const userIsChief = isChiefRole(userProfile.role);
      const isCreatorOfAssignment = assignment.createdBy === userProfile.uid;
      const isSelfAssignedByChief = userIsChief && assignment.assignedTo === userProfile.uid;
      const assignmentNeedsChiefApproval = !userIsChief && !isCreatorOfAssignment && assignment.assignedTo === userProfile.uid;
      
      let newStatus;
      let message;
      
      if (userIsChief || isCreatorOfAssignment || isSelfAssignedByChief) {
        // Jefes, creadores de asignaciones, o jefes que se autoasignan pueden marcar directamente como completado
        newStatus = ASSIGNMENT_STATUS.COMPLETADO;
        message = isCreatorOfAssignment || isSelfAssignedByChief 
          ? 'Tarea marcada como completada (autoasignación)' 
          : 'Tarea marcada como completada exitosamente';
      } else if (assignmentNeedsChiefApproval) {
        // Trabajadores regulares envían para aprobación
        newStatus = ASSIGNMENT_STATUS.PENDIENTE_APROBACION;
        message = 'Trabajo enviado para revisión y aprobación del jefe';
      } else {
        // Fallback: marcar como completado
        newStatus = ASSIGNMENT_STATUS.COMPLETADO;
        message = 'Tarea marcada como completada exitosamente';
      }
      
      const updateData = {
        progress: 100,
        status: newStatus,
        completedDate: new Date().toISOString(),
        completedBy: userProfile.uid,
        ...(newStatus === ASSIGNMENT_STATUS.PENDIENTE_APROBACION && {
          pendingApprovalSince: new Date().toISOString(),
          reviewRequiredBy: matchChiefRoleForAssignmentType(assignment.type)
        })
      };
      
      console.log('🚀 MyWorks - Enviando actualización:', {
        assignmentId: assignment.id,
        manga: assignment.mangaTitle,
        chapter: assignment.chapter,
        oldStatus: assignment.status,
        newStatus: newStatus,
        isChief: userIsChief,
        isCreator: isCreatorOfAssignment,
        isSelfAssigned: isSelfAssignedByChief,
        needsApproval: assignmentNeedsChiefApproval,
        updateData: updateData
      });
      
      await realtimeService.updateAssignment(assignment.id, updateData);
      
      toast.success(message);
      setProgressDialog(false);
      setSelectedAssignment(null);
      setNewProgress(0);
    } catch (error) {
      console.error('Error al completar la tarea:', error);
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
      // Validar campos requeridos
      if (!formData.mangaId || !formData.chapter || !formData.assignedTo || !formData.driveLink) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }
      
      // Validar rawLink si incluye traducción
      if (formData.tasks.includes('traduccion') && !formData.rawLink) {
        toast.error('El link de la RAW es requerido para asignaciones de traducción');
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
      rawLink: '',
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
      
      // Determinar si necesita aprobación o se puede marcar directamente como completado
      const userIsChief = isChiefRole(userProfile.role);
      const isCreatorOfAssignment = assignment.createdBy === userProfile.uid;
      const isSelfAssignedByChief = userIsChief && assignment.assignedTo === userProfile.uid;
      const assignmentNeedsChiefApproval = !userIsChief && !isCreatorOfAssignment && assignment.assignedTo === userProfile.uid;
      
      let newStatus;
      let message;
      
      if (userIsChief || isCreatorOfAssignment || isSelfAssignedByChief) {
        // Jefes, creadores de asignaciones, o jefes que se autoasignan pueden marcar directamente como completado
        newStatus = ASSIGNMENT_STATUS.COMPLETADO;
        message = isCreatorOfAssignment || isSelfAssignedByChief 
          ? `✅ Completada (autoasignación): ${assignmentInfo}` 
          : `✅ Completada: ${assignmentInfo}`;
      } else if (assignmentNeedsChiefApproval) {
        // Trabajadores regulares envían para aprobación
        newStatus = ASSIGNMENT_STATUS.PENDIENTE_APROBACION;
        message = `📋 Enviado para revisión: ${assignmentInfo}`;
      } else {
        newStatus = ASSIGNMENT_STATUS.COMPLETADO;
        message = `✅ Completada: ${assignmentInfo}`;
      }
      
      await realtimeService.updateAssignment(assignmentId, {
        status: newStatus,
        progress: 100,
        completedDate: new Date().toISOString(),
        completedBy: userProfile.uid,
        ...(newStatus === ASSIGNMENT_STATUS.PENDIENTE_APROBACION && {
          pendingApprovalSince: new Date().toISOString(),
          reviewRequiredBy: matchChiefRoleForAssignmentType(assignment.type)
        })
      });
      
      toast.success(
        message,
        {
          duration: 3000,
          icon: newStatus === ASSIGNMENT_STATUS.PENDIENTE_APROBACION ? '📋' : '🎉'
        }
      );
    } catch (error) {
      console.error('Error al marcar como completada:', error);
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

  // Función para reenviar una asignación rechazada a revisión
  const handleResubmitForReview = async (assignmentId) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      const assignmentInfo = assignment 
        ? `${assignment.mangaTitle} Cap.${assignment.chapter} - ${TASK_TYPES[assignment.type] || assignment.type}`
        : 'Asignación';
      
      // Determinar si necesita aprobación o se puede marcar directamente como completado
      const userIsChief = isChiefRole(userProfile.role);
      const isCreatorOfAssignment = assignment.createdBy === userProfile.uid;
      const isSelfAssignedByChief = userIsChief && assignment.assignedTo === userProfile.uid;
      const assignmentNeedsChiefApproval = !userIsChief && !isCreatorOfAssignment && assignment.assignedTo === userProfile.uid;
      
      let newStatus;
      let message;
      
      if (userIsChief || isCreatorOfAssignment || isSelfAssignedByChief) {
        // Jefes, creadores de asignaciones, o jefes que se autoasignan pueden marcar directamente como completado
        newStatus = ASSIGNMENT_STATUS.COMPLETADO;
        message = `✅ Reenvío completado: ${assignmentInfo}`;
      } else if (assignmentNeedsChiefApproval) {
        // Trabajadores regulares envían para aprobación
        newStatus = ASSIGNMENT_STATUS.PENDIENTE_APROBACION;
        message = `📋 Reenviado para revisión: ${assignmentInfo}`;
      } else {
        newStatus = ASSIGNMENT_STATUS.COMPLETADO;
        message = `✅ Reenvío completado: ${assignmentInfo}`;
      }
      
      await realtimeService.updateAssignment(assignmentId, {
        status: newStatus,
        progress: 100,
        completedDate: new Date().toISOString(),
        completedBy: userProfile.uid,
        resubmittedAt: new Date().toISOString(),
        // Limpiar datos de rechazo previo
        reviewComment: null,
        reviewedAt: null,
        reviewedBy: null,
        reviewedByName: null,
        ...(newStatus === ASSIGNMENT_STATUS.PENDIENTE_APROBACION && {
          pendingApprovalSince: new Date().toISOString(),
          reviewRequiredBy: matchChiefRoleForAssignmentType(assignment.type)
        })
      });
      
      toast.success(
        message,
        {
          duration: 3000,
          icon: newStatus === ASSIGNMENT_STATUS.PENDIENTE_APROBACION ? '📋' : '🎉'
        }
      );
    } catch (error) {
      console.error('Error al reenviar para revisión:', error);
      toast.error(`❌ Error al reenviar: ${error.message || 'Error desconocido'}`);
    }
  };

  // Estadísticas del usuario ampliadas
  const stats = {
    total: assignments.length,
    completed: assignments.filter(a => a.status === 'completado').length,
    approved: assignments.filter(a => a.status === 'aprobado').length,
    pendingApproval: assignments.filter(a => a.status === 'pendiente_aprobacion').length,
    rejected: assignments.filter(a => a.status === 'rechazado').length,
    pending: assignments.filter(a => a.status === 'pendiente').length,
    uploaded: assignments.filter(a => a.status === 'uploaded').length,
    overdue: assignments.filter(a => isOverdue(a.dueDate) && !['completado', 'completed', 'aprobado', 'approved', 'uploaded'].includes(a.status)).length
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
      case 'approved':
      case 'aprobado':
        return assignments.filter(a => a.status === 'approved' || a.status === 'aprobado');
      case 'pendingApproval':
      case 'pendiente_aprobacion':
        return assignments.filter(a => a.status === 'pendingApproval' || a.status === 'pendiente_aprobacion');
      case 'rejected':
      case 'rechazado':
        return assignments.filter(a => a.status === 'rejected' || a.status === 'rechazado');
      case 'uploaded':
        return assignments.filter(a => a.status === 'uploaded');
      case 'overdue':
        return assignments.filter(a => 
          isOverdue(a.dueDate) && 
          !['completado', 'completed', 'aprobado', 'approved', 'uploaded'].includes(a.status)
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

  // Agrupar asignaciones por estado para vista kanban (Completadas incluye Aprobadas)
  const groupedAssignments = {
    pending: assignments.filter(a => a.status === 'pendiente' && !a.reviewComment), // Pendientes sin comentarios de rechazo
    pendingApproval: assignments.filter(a => a.status === 'pendiente_aprobacion'),
    completed: assignments.filter(a => a.status === 'completado' || a.status === 'aprobado'), // Unificar completadas y aprobadas
    rejected: assignments.filter(a => a.status === 'rechazado' || (a.status === 'pendiente' && a.reviewComment)), // Rechazadas o pendientes con comentario de rechazo
    uploaded: assignments.filter(a => a.status === 'uploaded')
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
                  <MenuItem value="approved">Aprobadas ({stats.approved})</MenuItem>
                  <MenuItem value="pendingApproval">Pendientes Aprobación ({stats.pendingApproval})</MenuItem>
                  <MenuItem value="rejected">Rechazadas ({stats.rejected})</MenuItem>
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

      {/* Estadísticas principales */}
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

      {/* Estadísticas de estados de aprobación */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
            <CardContent>
              <ThumbUp sx={{ fontSize: '3rem', color: 'white', mb: 1 }} />
              <Typography variant="h4" color="white">{stats.approved}</Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                Aprobadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <CardContent>
              <HourglassTop sx={{ fontSize: '3rem', color: 'white', mb: 1 }} />
              <Typography variant="h4" color="white">{stats.pendingApproval}</Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                Esperando Aprobación
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <CardContent>
              <Warning sx={{ fontSize: '3rem', color: 'white', mb: 1 }} />
              <Typography variant="h4" color="white">{stats.rejected}</Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                Rechazadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <CardContent>
              <UploadIcon sx={{ fontSize: '3rem', color: 'white', mb: 1 }} />
              <Typography variant="h4" color="white">{stats.uploaded}</Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                Subidas
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
                    onResubmitForReview={handleResubmitForReview}
                  />
                </Box>
              ))}
            </Box>
          )}
        </>
      ) : (
        // Vista Kanban por estado
        <Box>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Panel Kanban - Estados de Asignaciones
          </Typography>
          
          <Grid container spacing={2}>
            {/* Pendientes */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ height: '500px', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(148, 163, 184, 0.1)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))' }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment color="action" />
                    Pendientes ({groupedAssignments.pending.length})
                  </Typography>
                </Box>
                <Box sx={{ height: 'calc(500px - 80px)', overflow: 'auto', p: 1 }}>
                  {getKanbanGroupedAssignments(groupedAssignments.pending).map((chapterGroup) => (
                    <Card 
                      key={`pending-${chapterGroup.mangaId}-${chapterGroup.chapter}`} 
                      sx={{ 
                        mb: 2,
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.02))',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                          borderRadius: '6px 6px 0 0'
                        }
                      }}
                      onClick={() => {
                        // Abrir dialog con el primer assignment como ejemplo o mostrar resumen del capítulo
                        setSelectedTask(chapterGroup.assignments.length === 1 ? chapterGroup.assignments[0] : null);
                        setSelectedChapterGroup(chapterGroup.assignments.length === 1 ? null : chapterGroup);
                        setDetailsOpen(true);
                      }}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 1 }}>
                          {chapterGroup.mangaTitle}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip
                            label={`Cap. ${chapterGroup.chapter}`}
                            size="small"
                            sx={{ background: '#6366f1', color: 'white', fontSize: '0.7rem' }}
                          />
                          {chapterGroup.driveLink && (
                            <Tooltip title="Enlace a Google Drive">
                              <LinkIcon sx={{ fontSize: '1rem', color: '#6366f1' }} />
                            </Tooltip>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {chapterGroup.assignments.map((assignment, index) => (
                            <Chip
                              key={index}
                              size="small"
                              label={TASK_TYPES[assignment.type] || assignment.type}
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: '20px' }}
                            />
                          ))}
                        </Box>
                        {chapterGroup.assignments.length > 0 && (
                          <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 500, fontSize: '0.7rem' }}>
                            Click para ver detalles y acciones
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {getKanbanGroupedAssignments(groupedAssignments.pending).length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Assignment sx={{ fontSize: '3rem', color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        Sin tareas pendientes
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Pendientes de Aprobación */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ height: '500px', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(148, 163, 184, 0.1)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))' }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HourglassTop color="warning" />
                    Esperando Aprobación ({groupedAssignments.pendingApproval.length})
                  </Typography>
                </Box>
                <Box sx={{ height: 'calc(500px - 80px)', overflow: 'auto', p: 1 }}>
                  {getKanbanGroupedAssignments(groupedAssignments.pendingApproval).map((chapterGroup) => (
                    <Card 
                      key={`pending-approval-${chapterGroup.mangaId}-${chapterGroup.chapter}`} 
                      sx={{ 
                        mb: 2,
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02))',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                          borderRadius: '6px 6px 0 0'
                        }
                      }}
                      onClick={() => {
                        setSelectedTask(chapterGroup.assignments.length === 1 ? chapterGroup.assignments[0] : null);
                        setDetailsOpen(true);
                      }}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 1 }}>
                          {chapterGroup.mangaTitle}
                        </Typography>
                        <Chip
                          label={`Cap. ${chapterGroup.chapter}`}
                          size="small"
                          sx={{ background: '#f59e0b', color: 'white', fontSize: '0.7rem', mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {chapterGroup.assignments.map((assignment, index) => (
                            <Chip
                              key={index}
                              size="small"
                              label={TASK_TYPES[assignment.type] || assignment.type}
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: '20px', borderColor: '#f59e0b', color: '#f59e0b' }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                  {getKanbanGroupedAssignments(groupedAssignments.pendingApproval).length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <HourglassTop sx={{ fontSize: '3rem', color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        Sin tareas esperando aprobación
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Completadas */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ height: '500px', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(148, 163, 184, 0.1)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" />
                    Completadas ({groupedAssignments.completed.length})
                  </Typography>
                </Box>
                <Box sx={{ height: 'calc(500px - 80px)', overflow: 'auto', p: 1 }}>
                  {getKanbanGroupedAssignments(groupedAssignments.completed).map((chapterGroup) => (
                    <Card 
                      key={`completed-${chapterGroup.mangaId}-${chapterGroup.chapter}`} 
                      sx={{ 
                        mb: 2,
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                        },
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
                      onClick={() => {
                        // Para completadas, mostrar tarea individual o resumen del grupo
                        if (chapterGroup.assignments.length === 1) {
                          setSelectedTask(chapterGroup.assignments[0]);
                          setSelectedChapterGroup(null);
                        } else {
                          // Si hay múltiples tareas, mostrar resumen del grupo
                          setSelectedTask(null);
                          setSelectedChapterGroup(chapterGroup);
                        }
                        setDetailsOpen(true);
                      }}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 1 }}>
                          {chapterGroup.mangaTitle}
                        </Typography>
                        <Chip
                          label={`Cap. ${chapterGroup.chapter}`}
                          size="small"
                          sx={{ background: '#10b981', color: 'white', fontSize: '0.7rem', mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {chapterGroup.assignments.map((assignment, index) => (
                            <Chip
                              key={index}
                              size="small"
                              label={TASK_TYPES[assignment.type] || assignment.type}
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: '20px', borderColor: '#10b981', color: '#10b981' }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                  {getKanbanGroupedAssignments(groupedAssignments.completed).length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircle sx={{ fontSize: '3rem', color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        Sin tareas completadas
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>


            {/* Rechazadas */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ height: '500px', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(148, 163, 184, 0.1)', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))' }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" />
                    Rechazadas ({groupedAssignments.rejected.length})
                  </Typography>
                </Box>
                <Box sx={{ height: 'calc(500px - 80px)', overflow: 'auto', p: 1 }}>
                  {getKanbanGroupedAssignments(groupedAssignments.rejected).map((chapterGroup) => (
                    <Card 
                      key={`rejected-${chapterGroup.mangaId}-${chapterGroup.chapter}`} 
                      sx={{ 
                        mb: 2,
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.02))',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                          borderRadius: '6px 6px 0 0'
                        }
                      }}
                      onClick={() => {
                        // Si solo hay una tarea, seleccionarla directamente
                        if (chapterGroup.assignments.length === 1) {
                          setSelectedTask(chapterGroup.assignments[0]);
                          setSelectedChapterGroup(null);
                        } else {
                          // Si hay múltiples tareas, mostrar todas las rechazadas del capítulo
                          setSelectedTask(null);
                          setSelectedChapterGroup(chapterGroup);
                        }
                        setDetailsOpen(true);
                      }}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 1 }}>
                          {chapterGroup.mangaTitle}
                        </Typography>
                        <Chip
                          label={`Cap. ${chapterGroup.chapter}`}
                          size="small"
                          sx={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {chapterGroup.assignments.map((assignment, index) => (
                            <Chip
                              key={index}
                              size="small"
                              label={TASK_TYPES[assignment.type] || assignment.type}
                              variant="outlined"
                              clickable
                              sx={{ 
                                fontSize: '0.65rem', 
                                height: '20px', 
                                borderColor: '#ef4444', 
                                color: '#ef4444',
                                '&:hover': {
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  borderColor: '#dc2626',
                                  color: '#dc2626'
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevenir que se ejecute el onClick del Card
                                setSelectedTask(assignment);
                                setDetailsOpen(true);
                              }}
                            />
                          ))}
                        </Box>
                        
                        {/* Mostrar motivos de rechazo */}
                        {chapterGroup.assignments.some(a => a.reviewComment) && (
                          <Box sx={{ mt: 1 }}>
                            {chapterGroup.assignments
                              .filter(a => a.reviewComment)
                              .slice(0, 1) // Solo mostrar el primer comentario para no saturar la tarjeta
                              .map((assignment, index) => (
                                <Box key={index} sx={{ 
                                  p: 1, 
                                  borderRadius: 1, 
                                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}>
                                  <Typography variant="caption" sx={{ 
                                    fontSize: '0.65rem', 
                                    color: '#dc2626', 
                                    fontWeight: 500,
                                    display: 'block',
                                    mb: 0.5
                                  }}>
                                    Motivo de rechazo:
                                  </Typography>
                                  <Typography variant="caption" sx={{ 
                                    fontSize: '0.7rem', 
                                    color: '#374151',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: 1.2
                                  }}>
                                    {assignment.reviewComment}
                                  </Typography>
                                  {chapterGroup.assignments.filter(a => a.reviewComment).length > 1 && (
                                    <Typography variant="caption" sx={{ 
                                      fontSize: '0.6rem', 
                                      color: '#6b7280',
                                      fontStyle: 'italic',
                                      display: 'block',
                                      mt: 0.5
                                    }}>
                                      +{chapterGroup.assignments.filter(a => a.reviewComment).length - 1} comentario(s) más...
                                    </Typography>
                                  )}
                                </Box>
                              ))
                            }
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {getKanbanGroupedAssignments(groupedAssignments.rejected).length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Warning sx={{ fontSize: '3rem', color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        Sin tareas rechazadas
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Subidas */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ height: '500px', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(148, 163, 184, 0.1)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))' }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UploadIcon color="primary" />
                    Subidas ({groupedAssignments.uploaded.length})
                  </Typography>
                </Box>
                <Box sx={{ height: 'calc(500px - 80px)', overflow: 'auto', p: 1 }}>
                  {getKanbanGroupedAssignments(groupedAssignments.uploaded).map((chapterGroup) => (
                    <Card 
                      key={`uploaded-${chapterGroup.mangaId}-${chapterGroup.chapter}`} 
                      sx={{ 
                        mb: 2,
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(139, 92, 246, 0.02))',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(139, 92, 246, 0.15)',
                          border: '1px solid rgba(139, 92, 246, 0.4)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
                          borderRadius: '6px 6px 0 0'
                        }
                      }}
                      onClick={() => {
                        // Para subidas, mostrar tarea individual o resumen del grupo
                        if (chapterGroup.assignments.length === 1) {
                          setSelectedTask(chapterGroup.assignments[0]);
                          setSelectedChapterGroup(null);
                        } else {
                          // Si hay múltiples tareas, mostrar resumen del grupo
                          setSelectedTask(null);
                          setSelectedChapterGroup(chapterGroup);
                        }
                        setDetailsOpen(true);
                      }}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 1 }}>
                          {chapterGroup.mangaTitle}
                        </Typography>
                        <Chip
                          label={`Cap. ${chapterGroup.chapter}`}
                          size="small"
                          sx={{ background: '#8b5cf6', color: 'white', fontSize: '0.7rem', mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {chapterGroup.assignments.map((assignment, index) => (
                            <Chip
                              key={index}
                              size="small"
                              label={TASK_TYPES[assignment.type] || assignment.type}
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: '20px', borderColor: '#8b5cf6', color: '#8b5cf6' }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                  {getKanbanGroupedAssignments(groupedAssignments.uploaded).length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <UploadIcon sx={{ fontSize: '3rem', color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        Sin tareas subidas
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
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

      {/* Dialog para detalles de asignaciones en vista Kanban */}
      <Dialog open={detailsOpen} onClose={() => {
        setDetailsOpen(false);
        setSelectedTask(null);
        setSelectedChapterGroup(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTask ? 
            `Detalles de la Tarea - ${getStatusLabel(selectedTask.status, selectedTask)}` :
            selectedChapterGroup ? 
              `${selectedChapterGroup.assignments[0]?.status === 'rechazado' || selectedChapterGroup.assignments[0]?.reviewComment ? 
                'Rechazos del Capítulo' : 
                selectedChapterGroup.assignments[0]?.status === 'pendiente_aprobacion' ? 
                'Tareas Esperando Aprobación' :
                selectedChapterGroup.assignments[0]?.status === 'completado' || selectedChapterGroup.assignments[0]?.status === 'aprobado' ?
                'Tareas Completadas' :
                selectedChapterGroup.assignments[0]?.status === 'uploaded' ?
                'Tareas Subidas' :
                'Tareas Pendientes'} - Capítulo ${selectedChapterGroup.chapter}` : 
              'Resumen del Capítulo'}
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
                  <strong>Tarea:</strong> {TASK_TYPES[selectedTask.type] || selectedTask.type}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Estado:</strong> {getStatusLabel(selectedTask.status, selectedTask)}
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
              
              {/* Enlaces */}
              {(selectedTask.driveLink || selectedTask.rawLink) && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    <strong>Enlaces:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedTask.driveLink && (
                      <Button
                        startIcon={<LinkIcon />}
                        href={selectedTask.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="small"
                        sx={{ textTransform: 'none' }}
                      >
                        Abrir en Google Drive
                      </Button>
                    )}
                    {selectedTask.rawLink && selectedTask.type === 'traduccion' && (
                      <Button
                        startIcon={<LinkIcon />}
                        href={selectedTask.rawLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="small"
                        sx={{ 
                          textTransform: 'none',
                          borderColor: '#6366f1',
                          color: '#6366f1',
                          '&:hover': {
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            borderColor: '#4f46e5'
                          }
                        }}
                      >
                        Ver RAW para Traducir
                      </Button>
                    )}
                  </Box>
                </Grid>
              )}
              
              {/* Información de revisión/rechazo */}
              {(selectedTask.status === 'pendiente' || selectedTask.status === 'rechazado') && selectedTask.reviewComment && (
                <Grid item xs={12}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mt: 2,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      '& .MuiAlert-icon': {
                        color: '#ef4444'
                      }
                    }}
                  >
                    <AlertTitle sx={{ color: '#ef4444', fontWeight: 600 }}>
                      Tarea rechazada por {selectedTask.reviewedByName || 'el jefe'}
                    </AlertTitle>
                    <Typography variant="body2" sx={{ mt: 1, color: '#374151' }}>
                      <strong>Motivo del rechazo:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: '#374151', p: 2, bgcolor: 'rgba(239, 68, 68, 0.05)', borderRadius: 1, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      {selectedTask.reviewComment}
                    </Typography>
                    {selectedTask.reviewedAt && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        Revisado el: {new Date(selectedTask.reviewedAt).toLocaleString('es-ES')}
                      </Typography>
                    )}
                    
                    {/* Botón para reenviar a revisión */}
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<Assignment />}
                        onClick={() => {
                          handleResubmitForReview(selectedTask.id);
                          setDetailsOpen(false);
                        }}
                        sx={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669, #047857)',
                          },
                        }}
                      >
                        Reenviar a Revisión
                      </Button>
                    </Box>
                  </Alert>
                </Grid>
              )}
              
              {/* Información de aprobación */}
              {selectedTask.status === 'aprobado' && (
                <Grid item xs={12}>
                  <Alert 
                    severity="success" 
                    sx={{ mt: 2 }}
                  >
                    <AlertTitle sx={{ fontWeight: 600 }}>
                      Tarea aprobada por {selectedTask.reviewedByName || selectedTask.approvedByName || 'el jefe'}
                    </AlertTitle>
                    {selectedTask.reviewComment && (
                      <>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Comentario:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {selectedTask.reviewComment}
                        </Typography>
                      </>
                    )}
                    {(selectedTask.reviewedAt || selectedTask.approvedAt) && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        Aprobado el: {new Date(selectedTask.reviewedAt || selectedTask.approvedAt).toLocaleString('es-ES')}
                      </Typography>
                    )}
                  </Alert>
                </Grid>
              )}
              
              {/* Estado pendiente de aprobación */}
              {selectedTask.status === 'pendiente_aprobacion' && (
                <Grid item xs={12}>
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mt: 2,
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      borderColor: 'rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    <AlertTitle sx={{ color: '#f59e0b', fontWeight: 600 }}>
                      Esperando aprobación del jefe
                    </AlertTitle>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Tu trabajo ha sido enviado para revisión. El jefe lo revisará y te dará una respuesta pronto.
                    </Typography>
                    {selectedTask.pendingApprovalSince && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        Enviado para revisión el: {new Date(selectedTask.pendingApprovalSince).toLocaleString('es-ES')}
                      </Typography>
                    )}
                  </Alert>
                </Grid>
              )}
              
              {/* Acciones disponibles */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  {/* Botón para completar si está pendiente (sin comentarios de rechazo) */}
                  {(selectedTask.status === 'pendiente' || selectedTask.status === 'pending') && !selectedTask.reviewComment && (
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        handleMarkComplete(selectedTask.id);
                        setDetailsOpen(false);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669, #047857)',
                        },
                      }}
                    >
                      Marcar como Completada
                    </Button>
                  )}
                  
                  {/* Botón para enviar a revisión si ya está completado pero aún no aprobado */}
                  {selectedTask.status === 'completado' && (
                    <Button
                      variant="contained"
                      startIcon={<HourglassTop />}
                      onClick={() => {
                        // Lógica para enviar a revisión si es necesario
                        toast.info('La tarea ya fue completada y está esperando revisión.');
                        setDetailsOpen(false);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #d97706, #b45309)',
                        },
                      }}
                    >
                      Ya Completada
                    </Button>
                  )}
                  
                  {/* Botón para subir si el usuario es uploader */}
                  {userProfile?.role === 'uploader' && 
                   (selectedTask.status === 'completado' || selectedTask.status === 'aprobado') && (
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => {
                        handleMarkUploaded(selectedTask.id);
                        setDetailsOpen(false);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        },
                      }}
                    >
                      Marcar como Subida
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          ) : selectedChapterGroup ? (
            // Vista agrupada personalizada según el estado
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedChapterGroup.mangaTitle} - Capítulo {selectedChapterGroup.chapter}
                </Typography>
                
                {/* Vista para tareas rechazadas */}
                {selectedChapterGroup.assignments.some(a => a.status === 'rechazado' || a.reviewComment) && (
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    <strong>Tareas rechazadas en este capítulo:</strong>
                  </Typography>
                )}
                
                {/* Vista para tareas pendientes de aprobación */}
                {selectedChapterGroup.assignments.some(a => a.status === 'pendiente_aprobacion') && (
                  <>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      <strong>Tareas esperando aprobación del jefe:</strong>
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                      <Typography variant="body2">
                        Estas tareas han sido completadas y enviadas para revisión. El jefe las revisará pronto.
                      </Typography>
                    </Alert>
                  </>
                )}
                
                {/* Vista para tareas completadas */}
                {selectedChapterGroup.assignments.some(a => a.status === 'completado' || a.status === 'aprobado') && (
                  <>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      <strong>Tareas completadas y aprobadas:</strong>
                    </Typography>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        ¡Excelente trabajo! Estas tareas han sido completadas y aprobadas.
                      </Typography>
                    </Alert>
                  </>
                )}
                
                {/* Vista para tareas subidas */}
                {selectedChapterGroup.assignments.some(a => a.status === 'uploaded') && (
                  <>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      <strong>Tareas subidas a la plataforma:</strong>
                    </Typography>
                    <Alert severity="success" sx={{ mb: 2, backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                      <Typography variant="body2">
                        Estas tareas han sido publicadas exitosamente en la plataforma.
                      </Typography>
                    </Alert>
                  </>
                )}
                
                {/* Vista para tareas pendientes */}
                {selectedChapterGroup.assignments.some(a => a.status === 'pendiente' && !a.reviewComment) && (
                  <>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      <strong>Tareas pendientes de trabajo:</strong>
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                      <Typography variant="body2">
                        Estas tareas están esperando a ser trabajadas. ¡Es hora de ponerse a trabajar!
                      </Typography>
                    </Alert>
                  </>
                )}
              </Grid>
              
              {/* Mostrar todas las tareas del grupo */}
              {selectedChapterGroup.assignments.map((assignment, index) => {
                const isRejected = assignment.status === 'rechazado' || assignment.reviewComment;
                const isPendingApproval = assignment.status === 'pendiente_aprobacion';
                const isCompleted = assignment.status === 'completado' || assignment.status === 'aprobado';
                const isUploaded = assignment.status === 'uploaded';
                const isPending = assignment.status === 'pendiente' && !assignment.reviewComment;
                
                // Determinar color del borde según el estado
                const borderColor = isRejected ? 'rgba(239, 68, 68, 0.3)' :
                                   isPendingApproval ? 'rgba(245, 158, 11, 0.3)' :
                                   isCompleted ? 'rgba(16, 185, 129, 0.3)' :
                                   isUploaded ? 'rgba(139, 92, 246, 0.3)' :
                                   'rgba(99, 102, 241, 0.3)';
                
                return (
                  <Grid item xs={12} key={assignment.id || index}>
                    <Card sx={{ mb: 2, border: `1px solid ${borderColor}` }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                            {TASK_TYPES[assignment.type] || assignment.type}
                          </Typography>
                          <Chip
                            label={getStatusLabel(assignment.status, assignment)}
                            color={getStatusColor(assignment.status)}
                            size="small"
                          />
                        </Box>
                      
                        {/* Información básica de la tarea */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          {assignment.assignedDate && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="textSecondary">
                                <strong>Asignado:</strong> {new Date(assignment.assignedDate).toLocaleDateString('es-ES')}
                              </Typography>
                            </Grid>
                          )}
                          {assignment.dueDate && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="textSecondary">
                                <strong>Fecha límite:</strong> {new Date(assignment.dueDate).toLocaleDateString('es-ES')}
                              </Typography>
                            </Grid>
                          )}
                          {assignment.completedDate && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="textSecondary">
                                <strong>Completado:</strong> {new Date(assignment.completedDate).toLocaleDateString('es-ES')}
                              </Typography>
                            </Grid>
                          )}
                          {assignment.uploadedDate && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="textSecondary">
                                <strong>Subido:</strong> {new Date(assignment.uploadedDate).toLocaleDateString('es-ES')}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                        
                        {/* Información específica según el estado */}
                        
                        {/* Para tareas rechazadas */}
                        {isRejected && assignment.reviewComment && (
                          <Alert 
                            severity="error" 
                            sx={{ 
                              mt: 2,
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                              '& .MuiAlert-icon': {
                                color: '#ef4444'
                              }
                            }}
                          >
                            <AlertTitle sx={{ color: '#ef4444', fontWeight: 600 }}>
                              Tarea rechazada por {assignment.reviewedByName || 'el jefe'}
                            </AlertTitle>
                            <Typography variant="body2" sx={{ mt: 1, color: '#374151' }}>
                              <strong>Motivo del rechazo:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: '#374151', p: 2, bgcolor: 'rgba(239, 68, 68, 0.05)', borderRadius: 1, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                              {assignment.reviewComment}
                            </Typography>
                            {assignment.reviewedAt && (
                              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                Revisado el: {new Date(assignment.reviewedAt).toLocaleString('es-ES')}
                              </Typography>
                            )}
                            
                            {/* Botón para reenviar a revisión individual */}
                            <Box sx={{ mt: 2 }}>
                              <Button
                                variant="contained"
                                startIcon={<Assignment />}
                                onClick={() => {
                                  handleResubmitForReview(assignment.id);
                                  setDetailsOpen(false);
                                }}
                                sx={{
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #059669, #047857)',
                                  },
                                }}
                              >
                                Reenviar a Revisión
                              </Button>
                            </Box>
                          </Alert>
                        )}
                        
                        {/* Para tareas pendientes de aprobación */}
                        {isPendingApproval && (
                          <Alert 
                            severity="info" 
                            sx={{ 
                              mt: 2,
                              backgroundColor: 'rgba(245, 158, 11, 0.1)',
                              borderColor: 'rgba(245, 158, 11, 0.3)',
                              '& .MuiAlert-icon': {
                                color: '#f59e0b'
                              }
                            }}
                          >
                            <AlertTitle sx={{ color: '#f59e0b', fontWeight: 600 }}>
                              Esperando aprobación del jefe
                            </AlertTitle>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Tu trabajo ha sido enviado para revisión. El jefe lo revisará pronto.
                            </Typography>
                            {assignment.pendingApprovalSince && (
                              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                Enviado para revisión el: {new Date(assignment.pendingApprovalSince).toLocaleString('es-ES')}
                              </Typography>
                            )}
                          </Alert>
                        )}
                        
                        {/* Para tareas completadas/aprobadas */}
                        {isCompleted && (
                          <Alert 
                            severity="success" 
                            sx={{ 
                              mt: 2,
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              borderColor: 'rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            <AlertTitle sx={{ color: '#10b981', fontWeight: 600 }}>
                              {assignment.status === 'aprobado' ? 
                                `Tarea aprobada por ${assignment.reviewedByName || assignment.approvedByName || 'el jefe'}` :
                                'Tarea completada exitosamente'
                              }
                            </AlertTitle>
                            {assignment.reviewComment && (
                              <>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  <strong>Comentario del jefe:</strong>
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, bgcolor: 'rgba(16, 185, 129, 0.05)', borderRadius: 1 }}>
                                  {assignment.reviewComment}
                                </Typography>
                              </>
                            )}
                            {(assignment.reviewedAt || assignment.approvedAt || assignment.completedDate) && (
                              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                {assignment.status === 'aprobado' ? 'Aprobado' : 'Completado'} el: {new Date(
                                  assignment.reviewedAt || assignment.approvedAt || assignment.completedDate
                                ).toLocaleString('es-ES')}
                              </Typography>
                            )}
                          </Alert>
                        )}
                        
                        {/* Para tareas subidas */}
                        {isUploaded && (
                          <Alert 
                            severity="success" 
                            sx={{ 
                              mt: 2,
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              borderColor: 'rgba(139, 92, 246, 0.3)',
                              '& .MuiAlert-icon': {
                                color: '#8b5cf6'
                              }
                            }}
                          >
                            <AlertTitle sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                              Tarea publicada exitosamente
                            </AlertTitle>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Esta tarea ha sido subida y publicada en la plataforma.
                            </Typography>
                            {assignment.uploadedBy && (
                              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                Subido por: {assignment.uploadedByName || 'Uploader'}
                              </Typography>
                            )}
                          </Alert>
                        )}
                        
                        {/* Para tareas pendientes */}
                        {isPending && (
                          <Alert 
                            severity="info" 
                            sx={{ 
                              mt: 2,
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              borderColor: 'rgba(99, 102, 241, 0.3)',
                              '& .MuiAlert-icon': {
                                color: '#6366f1'
                              }
                            }}
                          >
                            <AlertTitle sx={{ color: '#6366f1', fontWeight: 600 }}>
                              Tarea lista para trabajar
                            </AlertTitle>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Esta tarea está esperando a ser completada. ¡Puedes empezar a trabajar en ella!
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                              <Button
                                variant="contained"
                                startIcon={<PlayArrow />}
                                onClick={() => {
                                  handleMarkComplete(assignment.id);
                                  setDetailsOpen(false);
                                }}
                                sx={{
                                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                  },
                                }}
                              >
                                Marcar como Completada
                              </Button>
                            </Box>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
              
              {/* Acciones globales según el tipo de tareas */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  
                  {/* Acciones para tareas rechazadas */}
                  {selectedChapterGroup.assignments.some(a => a.reviewComment) && (
                    <Button
                      variant="contained"
                      startIcon={<Assignment />}
                      onClick={() => {
                        // Reenviar todas las tareas rechazadas
                        selectedChapterGroup.assignments.forEach(assignment => {
                          if (assignment.reviewComment) {
                            handleResubmitForReview(assignment.id);
                          }
                        });
                        setDetailsOpen(false);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669, #047857)',
                        },
                      }}
                    >
                      Reenviar Todas las Rechazadas
                    </Button>
                  )}
                  
                  {/* Acciones para tareas pendientes */}
                  {selectedChapterGroup.assignments.some(a => a.status === 'pendiente' && !a.reviewComment) && (
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        // Completar todas las tareas pendientes
                        selectedChapterGroup.assignments.forEach(assignment => {
                          if (assignment.status === 'pendiente' && !assignment.reviewComment) {
                            handleMarkComplete(assignment.id);
                          }
                        });
                        setDetailsOpen(false);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        },
                      }}
                    >
                      Completar Todas las Pendientes
                    </Button>
                  )}
                  
                  {/* Acciones para tareas completadas (uploadable) */}
                  {userProfile?.role === 'uploader' && 
                   selectedChapterGroup.assignments.some(a => a.status === 'completado' || a.status === 'aprobado') && (
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => {
                        // Subir todas las tareas completadas
                        selectedChapterGroup.assignments.forEach(assignment => {
                          if (assignment.status === 'completado' || assignment.status === 'aprobado') {
                            handleMarkUploaded(assignment.id);
                          }
                        });
                        setDetailsOpen(false);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        },
                      }}
                    >
                      Subir Todas las Completadas
                    </Button>
                  )}
                  
                  {/* Enlace a Google Drive siempre disponible */}
                  {selectedChapterGroup.driveLink && (
                    <Button
                      variant="outlined"
                      startIcon={<LinkIcon />}
                      href={selectedChapterGroup.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textTransform: 'none' }}
                    >
                      Abrir en Google Drive
                    </Button>
                  )}
                  
                  {/* Botón RAW para traducciones */}
                  {(() => {
                    // Buscar si hay alguna tarea de traducción con rawLink
                    const translationTask = selectedChapterGroup.assignments.find(a => a.type === 'traduccion' && a.rawLink);
                    return translationTask ? (
                      <Button
                        variant="outlined"
                        startIcon={<LinkIcon />}
                        href={translationTask.rawLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          textTransform: 'none',
                          borderColor: '#6366f1',
                          color: '#6366f1',
                          '&:hover': {
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            borderColor: '#4f46e5'
                          }
                        }}
                      >
                        Ver RAW
                      </Button>
                    ) : null;
                  })()
                  }
                </Box>
              </Grid>
            </Grid>
          ) : (
            // Detalles del capítulo completo - vista simplificada
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Resumen del Capítulo
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Vista general del capítulo seleccionado.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Haz clic en tarjetas específicas para ver detalles individuales de las tareas.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDetailsOpen(false);
            setSelectedTask(null);
            setSelectedChapterGroup(null);
          }}>Cerrar</Button>
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
                      <Checkbox checked={formData.tasks.includes(key)} />
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
            
            {/* Campo para link de la RAW - Solo aparece si incluye traducción */}
            {formData.tasks.includes('traduccion') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Link de la RAW a traducir"
                  value={formData.rawLink}
                  onChange={(e) => setFormData({ ...formData, rawLink: e.target.value })}
                  InputProps={{
                    startAdornment: <LinkIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                  placeholder="https://ejemplo.com/manga-raw..."
                  helperText="Enlace directo a la RAW para traducir (requerido para traducciones)"
                  required={formData.tasks.includes('traduccion')}
                />
              </Grid>
            )}
            
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
            disabled={
              !formData.mangaId || 
              !formData.chapter || 
              !formData.assignedTo || 
              !formData.driveLink ||
              (formData.tasks.includes('traduccion') && !formData.rawLink)
            }
          >
            Crear Asignación
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyWorks;
