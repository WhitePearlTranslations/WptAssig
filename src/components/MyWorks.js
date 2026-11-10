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
  Tab,
  ButtonBase
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
import FileUploader from './FileUploader';
import GoogleDriveTest from './GoogleDriveTest';
import { PageHeader, Panel, StatusBadge, TaskTypeTag, MeterBar, EmptyState } from './ui';
import { triggerHaptic } from '../hooks/useWebHaptics';
import notify from '../utils/notify';
import { colors, radius, divider, rowDivider, focusOutline, withAlpha, taskColors } from '../theme/tokens';

// Componente para mostrar un capítulo agrupado con todas sus tareas (del SeriesManagement)
const ChapterCard = ({ chapterGroup, userRole, onMarkComplete, onMarkUploaded, onResubmitForReview, onOpenUpload }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const ASSIGNMENT_TYPES = {
    traduccion: { label: 'Traducción', color: taskColors.traduccion, short: 'T' },
    proofreading: { label: 'Proofreading', color: taskColors.proofreading, short: 'P' },
    cleanRedrawer: { label: 'Clean/Redrawer', color: taskColors.cleanRedrawer, short: 'C' },
    type: { label: 'Typesetting', color: taskColors.type, short: 'Ty' }
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
  
  // Nueva función para mostrar botón de upload directo
  const canShowUpload = (assignment) => {
    const validStatuses = [
      'pending', 'pendiente', 'rechazado',
      'PENDING', 'PENDIENTE', 'RECHAZADO'
    ];
    
    return validStatuses.includes(assignment.status);
  };

  // Determinar si alguna tarea está atrasada
  const hasOverdueTask = chapterGroup.assignments.some(assignment => 
    assignment.dueDate && new Date(assignment.dueDate) < new Date() &&
    (assignment.status === 'pending' || assignment.status === 'pendiente')
  );

  // Calcular progreso general del capítulo
  // Subido también cuenta como terminado (antes los capítulos subidos salían 0/1)
  const completedTasks = chapterGroup.assignments.filter(a => 
    a.status === 'completed' || 
    a.status === 'completado' || 
    a.status === 'aprobado' ||
    a.status === 'uploaded'
  ).length;
  const allUploaded = chapterGroup.assignments.length > 0 && chapterGroup.assignments.every(a => a.status === 'uploaded');
  const totalTasks = chapterGroup.assignments.length;
  const chapterProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isChapterCompleted = completedTasks === totalTasks;
  
  // Determinar si el capítulo está en progreso
  const isChapterInProgress = totalTasks > 1 && completedTasks > 0 && completedTasks < totalTasks;

  const nextDueDate = chapterGroup.assignments
    .filter((a) => a.dueDate && (a.status === 'pending' || a.status === 'pendiente'))
    .map((a) => new Date(a.dueDate))
    .sort((a, b) => a - b)[0];
  const chapterStatus = hasOverdueTask
    ? 'retrasado'
    : allUploaded
      ? 'uploaded'
      : isChapterCompleted
      ? 'completado'
      : isChapterInProgress
        ? 'en_progreso'
        : chapterGroup.assignments[0]?.status;
  const translationTask = chapterGroup.assignments.find((a) => a.type === 'traduccion' && a.rawLink);
  const pendingTasks = chapterGroup.assignments.filter((a) => canMarkComplete(a));
  const uploadableTask = chapterGroup.assignments.find((a) => canShowUpload(a));
  const markableUploaded = chapterGroup.assignments.filter((a) => canMarkUploaded(a));

  return (
    <>
      <Box
        component="article"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
          gap: { xs: 1.5, md: 3 },
          alignItems: 'center',
          p: 2,
          borderRadius: `${radius.lg}px`,
          backgroundColor: colors.surfaceContainer,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {/* Cabecera del capítulo */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
            <Typography component="h3" sx={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.onSurface }}>
              {chapterGroup.mangaTitle}
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
              Cap. {chapterGroup.chapter}
            </Typography>
            <StatusBadge status={chapterStatus} sx={{ alignSelf: 'center' }} />
          </Box>

          {/* Tareas: cada una abre su detalle */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.25 }}>
            {chapterGroup.assignments.map((assignment) => {
              const statusCfg = STATUS_CONFIG[assignment.status];
              return (
                <ButtonBase
                  key={assignment.id}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedTask(assignment);
                    setDetailsOpen(true);
                  }}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    height: 30,
                    px: 1.25,
                    borderRadius: `${radius.md}px`,
                    backgroundColor: colors.surfaceHigh,
                    fontSize: '0.75rem',
                    transition: 'background-color 150ms ease-out',
                    '&:hover': { backgroundColor: colors.surfaceHighest },
                    '&.Mui-focusVisible': focusOutline,
                  }}
                >
                  <TaskTypeTag type={assignment.type} sx={{ color: colors.onSurface }} />
                  <Box component="span" sx={{ color: statusCfg?.color ?? colors.onSurfaceVariant, fontWeight: 600 }}>
                    {statusCfg?.label ?? getStatusLabel(assignment.status)}
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>

          {/* Fecha y progreso */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
            {nextDueDate && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
                <Schedule aria-hidden="true" sx={{ fontSize: 14, color: nextDueDate < new Date() ? colors.error : colors.outline }} />
                Entrega {nextDueDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                {nextDueDate < new Date() && ' · vencida'}
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 180px', maxWidth: 280 }}>
              <Box sx={{ flex: 1 }}>
                <MeterBar
                  value={completedTasks}
                  max={totalTasks}
                  color={isChapterCompleted ? colors.goodNews : colors.primary}
                />
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                {completedTasks}/{totalTasks}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Acciones */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', justifyContent: { md: 'flex-end' } }}>
          {chapterGroup.driveLink && (
            <Tooltip title="Abrir carpeta de Drive">
              <IconButton component="a" href={chapterGroup.driveLink} target="_blank" rel="noopener noreferrer" aria-label="Abrir carpeta de Drive">
                <LinkIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          {translationTask && (
            <Tooltip title="Ver RAW">
              <IconButton component="a" href={translationTask.rawLink} target="_blank" rel="noopener noreferrer" aria-label="Ver RAW">
                <Download sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Button
            size="small"
            onClick={() => {
              setSelectedTask(null);
              setDetailsOpen(true);
            }}
          >
            Ver capítulo
          </Button>
          {uploadableTask && onOpenUpload && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<UploadIcon sx={{ fontSize: 16 }} />}
              onClick={() => {
                triggerHaptic('light');
                onOpenUpload(uploadableTask);
              }}
            >
              Subir archivos
            </Button>
          )}
          {pendingTasks.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<CheckCircle sx={{ fontSize: 16 }} />}
              onClick={() => pendingTasks.forEach((task) => onMarkComplete(task.id))}
            >
              Completar todo
            </Button>
          )}
          {markableUploaded.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<UploadIcon sx={{ fontSize: 16 }} />}
              onClick={() => markableUploaded.forEach((task) => onMarkUploaded(task.id))}
            >
              Marcar subido
            </Button>
          )}
        </Box>
      </Box>

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
                    }}
                  >
                    <AlertTitle sx={{ fontWeight: 600 }}>
                      Tarea rechazada por {selectedTask.reviewedByName || 'el jefe'}
                    </AlertTitle>
                    <Typography variant="body2" sx={{ mt: 1, color: colors.onSurface }}>
                      <strong>Motivo del rechazo:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: colors.onSurface, p: 2, bgcolor: colors.surfaceContainer, borderRadius: 2 }}>
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
                    }}
                  >
                    <AlertTitle sx={{ fontWeight: 600 }}>
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
                  {canShowUpload(selectedTask) && onOpenUpload && (
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => {
                        onOpenUpload(selectedTask);
                        setDetailsOpen(false);
                      }}
                    >
                      Subir Archivos
                    </Button>
                  )}
                  {canMarkComplete(selectedTask) && (
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        onMarkComplete(selectedTask.id);
                        setDetailsOpen(false);
                      }}
                    >
                      Marcar Completado
                    </Button>
                  )}
                  {canMarkUploaded(selectedTask) && (
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => {
                        onMarkUploaded(selectedTask.id);
                        setDetailsOpen(false);
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
                            {canShowUpload(assignment) && onOpenUpload && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  onOpenUpload(assignment);
                                }}
                              >
                                Subir
                              </Button>
                            )}
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
  // Estados para FileUploader
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [assignmentToUpload, setAssignmentToUpload] = useState(null);
  const [assignmentsGroupToUpload, setAssignmentsGroupToUpload] = useState(null);
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
      
      // Update data prepared for assignment
      
      await realtimeService.updateAssignment(assignment.id, updateData);
      
      toast.success(message);
      setProgressDialog(false);
      setSelectedAssignment(null);
      setNewProgress(0);
    } catch (error) {
      // Error handling - log removed for production
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
      toast.error(`❌ Error al reenviar para revisión: ${error.message || 'Error desconocido'}`);
    }
  };

  // Funciones para el manejo de upload directo
  const handleOpenUpload = (assignmentOrGroup) => {
    // Si es un array, es un grupo de asignaciones
    if (Array.isArray(assignmentOrGroup)) {
      setAssignmentsGroupToUpload(assignmentOrGroup);
      
      // Crear un objeto de asignación formateado para mostrar información del grupo
      const firstAssignment = assignmentOrGroup[0];
      const taskTypes = [...new Set(assignmentOrGroup.map(a => TASK_TYPES[a.type] || a.type))];
      
      const groupInfo = {
        ...firstAssignment,
        isGroup: true,
        totalTasks: assignmentOrGroup.length,
        taskTypes: taskTypes,
        type: assignmentOrGroup.length === 1 ? firstAssignment.type : 'Múltiples'
      };
      
      setAssignmentToUpload(groupInfo);
    } else {
      // Es una asignación individual
      setAssignmentToUpload(assignmentOrGroup);
      setAssignmentsGroupToUpload(null);
    }
    setUploadDialogOpen(true);
  };

  const handleUploadComplete = async (uploadData) => {
    try {
      const assignmentsToUpdate = assignmentsGroupToUpload || [assignmentToUpload];
      
      if (!assignmentsToUpdate || assignmentsToUpdate.length === 0) {
        throw new Error('No se encontraron asignaciones para actualizar');
      }

      // Processing upload for multiple assignments
      
      let updatedCount = 0;
      let errors = [];
      
      // Procesar cada asignación
      for (const assignment of assignmentsToUpdate) {
        try {
          // Determinar si necesita aprobación o se puede marcar directamente como completado
          const userIsChief = isChiefRole(userProfile.role);
          const isCreatorOfAssignment = assignment.createdBy === userProfile.uid;
          const isSelfAssignedByChief = userIsChief && assignment.assignedTo === userProfile.uid;
          const assignmentNeedsChiefApproval = !userIsChief && !isCreatorOfAssignment && assignment.assignedTo === userProfile.uid;
          
          let newStatus;
          
          if (userIsChief || isCreatorOfAssignment || isSelfAssignedByChief) {
            newStatus = ASSIGNMENT_STATUS.COMPLETADO;
          } else if (assignmentNeedsChiefApproval) {
            newStatus = ASSIGNMENT_STATUS.PENDIENTE_APROBACION;
          } else {
            newStatus = ASSIGNMENT_STATUS.COMPLETADO;
          }
          
          // Actualizar la asignación con el nuevo estado
          await realtimeService.updateAssignment(assignment.id, {
            status: newStatus,
            progress: 100,
            completedDate: new Date().toISOString(),
            completedBy: userProfile.uid,
            uploadedFiles: uploadData.results.map(result => ({
              name: result.file,
              success: result.success,
              driveId: result.success ? result.result.id : null,
              webViewLink: result.success ? result.result.webViewLink : null
            })),
            uploadedAt: new Date().toISOString(),
            ...(newStatus === ASSIGNMENT_STATUS.PENDIENTE_APROBACION && {
              pendingApprovalSince: new Date().toISOString(),
              reviewRequiredBy: matchChiefRoleForAssignmentType(assignment.type)
            })
          });
          
          updatedCount++;
          
        } catch (error) {
          console.error(`❌ Error actualizando asignación ${assignment.type}:`, error);
          errors.push(`${assignment.type}: ${error.message}`);
        }
      }
      
      // Mostrar mensaje de resultado
      const assignment = assignmentsToUpdate[0];
      const chapterInfo = `${assignment.mangaTitle} Cap.${assignment.chapter}`;
      
      if (updatedCount === assignmentsToUpdate.length) {
        // Todas exitosas
        const statusText = assignmentsToUpdate[0].status === ASSIGNMENT_STATUS.PENDIENTE_APROBACION ? 
          'enviadas para revisión' : 'completadas';
        const message = assignmentsToUpdate.length === 1 ?
          `✅ Archivos subidos y tarea ${statusText}: ${chapterInfo} - ${TASK_TYPES[assignmentsToUpdate[0].type]}` :
          `🎉 Archivos subidos y ${updatedCount} tareas ${statusText}: ${chapterInfo}`;
          
        toast.success(message, { duration: 4000, icon: '🎉' });
      } else if (updatedCount > 0) {
        // Algunas exitosas
        toast.success(
          `✅ ${updatedCount}/${assignmentsToUpdate.length} tareas actualizadas: ${chapterInfo}`,
          { duration: 4000, icon: '⚠️' }
        );
        if (errors.length > 0) {
          toast.error(`Errores: ${errors.join(', ')}`, { duration: 6000 });
        }
      } else {
        // Todas fallaron
        toast.error(`❌ No se pudieron actualizar las tareas: ${errors.join(', ')}`, { duration: 6000 });
      }
      
      // Cerrar el dialog de upload
      setUploadDialogOpen(false);
      setAssignmentToUpload(null);
      setAssignmentsGroupToUpload(null);
      
    } catch (error) {
      console.error('Error al procesar upload completo:', error);
      toast.error(`❌ Error al completar la tarea: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleUploadError = (error) => {
    console.error('Error en upload:', error);
    toast.error(`❌ Error en la subida de archivos: ${error.message || 'Error desconocido'}`);
  };

  const handleCloseUpload = () => {
    setUploadDialogOpen(false);
    setAssignmentToUpload(null);
    setAssignmentsGroupToUpload(null);
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

  // Abre el detalle: una tarea suelta o el capítulo entero si tiene varias.
  const openKanbanDetails = (chapterGroup) => {
    triggerHaptic('light');
    if (chapterGroup.assignments.length === 1) {
      setSelectedTask(chapterGroup.assignments[0]);
      setSelectedChapterGroup(null);
    } else {
      setSelectedTask(null);
      setSelectedChapterGroup(chapterGroup);
    }
    setDetailsOpen(true);
  };

  const openUploadFor = (chapterGroup, pick) => {
    triggerHaptic('light');
    if (chapterGroup.assignments.length === 1) {
      handleOpenUpload(chapterGroup.assignments[0]);
      return;
    }
    const subset = chapterGroup.assignments.filter(pick);
    handleOpenUpload(subset.length > 0 ? subset : chapterGroup.assignments);
  };

  const isPendingStatus = (a) => a.status === 'pendiente' || a.status === 'pending';
  const isRejectedStatus = (a) => a.status === 'rechazado' || Boolean(a.reviewComment);

  // Columnas del tablero. Primero las que piden algo a la persona.
  const KANBAN_COLUMNS = [
    {
      key: 'pending',
      title: 'Pendientes',
      tone: colors.onSurfaceVariant,
      icon: Assignment,
      items: groupedAssignments.pending,
      empty: 'Nada pendiente. Cuando te asignen un capítulo aparecerá aquí.',
      action: { label: 'Subir', pick: isPendingStatus },
    },
    {
      key: 'rejected',
      title: 'Rechazadas',
      tone: colors.error,
      icon: Warning,
      items: groupedAssignments.rejected,
      empty: 'Ningún trabajo devuelto.',
      action: { label: 'Volver a subir', pick: isRejectedStatus },
      showReview: true,
    },
    {
      key: 'pendingApproval',
      title: 'Esperando aprobación',
      tone: colors.attention,
      icon: HourglassTop,
      items: groupedAssignments.pendingApproval,
      empty: 'Nada esperando a un jefe.',
    },
    {
      key: 'completed',
      title: 'Completadas',
      tone: colors.primary,
      icon: CheckCircle,
      items: groupedAssignments.completed,
      empty: 'Aquí irán los capítulos aprobados que faltan por subir.',
    },
    {
      key: 'uploaded',
      title: 'Subidas',
      tone: colors.goodNews,
      icon: UploadIcon,
      items: groupedAssignments.uploaded,
      empty: 'Todavía no hay capítulos publicados.',
    },
  ];

  const renderKanbanCard = (column, chapterGroup) => {
    const overdue = chapterGroup.hasOverdue && column.key !== 'uploaded' && column.key !== 'completed';
    const reviewed = column.showReview ? chapterGroup.assignments.filter((a) => a.reviewComment) : [];
    return (
      <Box
        component="li"
        key={`${column.key}-${chapterGroup.mangaId}-${chapterGroup.chapter}`}
        sx={{ listStyle: 'none', position: 'relative' }}
      >
        <ButtonBase
          onClick={() => openKanbanDetails(chapterGroup)}
          aria-label={`${chapterGroup.mangaTitle}, capítulo ${chapterGroup.chapter}`}
          sx={{
            width: '100%',
            display: 'block',
            textAlign: 'left',
            p: 1.5,
            pb: column.action ? 6 : 1.5,
            borderRadius: `${radius.lg}px`,
            backgroundColor: colors.surfaceContainer,
            transition: 'background-color 150ms ease-out, transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': { backgroundColor: colors.surfaceHigh },
            '&:active': { transform: 'scale(0.98)' },
            '&.Mui-focusVisible': focusOutline,
          }}
        >
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.onSurface, lineHeight: 1.35, textWrap: 'pretty' }}>
            {chapterGroup.mangaTitle}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
            <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>Cap. {chapterGroup.chapter}</Box>
            {chapterGroup.earliestDueDate && (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <Box component="span" aria-hidden="true">·</Box>
                {overdue && <Schedule aria-hidden="true" sx={{ fontSize: 14, color: colors.error }} />}
                {new Date(chapterGroup.earliestDueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                {overdue && <Box component="span" sx={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>(vencida)</Box>}
              </Box>
            )}
            {chapterGroup.driveLink && <LinkIcon aria-label="Tiene carpeta de Drive" sx={{ fontSize: 14, color: colors.outline }} />}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 1.25, rowGap: 0.5, mt: 1, fontSize: '0.75rem' }}>
            {chapterGroup.assignments.map((assignment) => (
              <TaskTypeTag key={assignment.id} type={assignment.type} />
            ))}
          </Box>
          {reviewed.length > 0 && (
            <Box sx={{ mt: 1.25, pt: 1, borderTop: `1px solid ${rowDivider}` }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: colors.onSurfaceVariant }}>
                Motivo del rechazo
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: colors.onSurface,
                  mt: 0.25,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {reviewed[0].reviewComment}
              </Typography>
              {reviewed.length > 1 && (
                <Typography sx={{ fontSize: '0.6875rem', color: colors.outline, mt: 0.25 }}>
                  y {reviewed.length - 1} comentario{reviewed.length - 1 === 1 ? '' : 's'} más
                </Typography>
              )}
            </Box>
          )}
        </ButtonBase>
        {/* Acción de la columna, fuera del botón de la tarjeta para no anidar botones */}
        {column.action && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadIcon sx={{ fontSize: 16 }} />}
            onClick={() => openUploadFor(chapterGroup, column.action.pick)}
            sx={{ position: 'absolute', left: 12, bottom: 12 }}
          >
            {column.action.label}
          </Button>
        )}
      </Box>
    );
  };

  const overdueCount = stats.overdue;

  return (
    <Box>
      <PageHeader
        title="Mis trabajos"
        subtitle={[
          `${stats.total} ${stats.total === 1 ? 'tarea' : 'tareas'}`,
          overdueCount > 0 ? `${overdueCount} ${overdueCount === 1 ? 'vencida' : 'vencidas'}` : null,
          stats.pendingApproval > 0 ? `${stats.pendingApproval} esperando aprobación` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              size="small"
              onChange={(e, newView) => {
                if (newView) {
                  triggerHaptic('light');
                  setViewMode(newView);
                }
              }}
              aria-label="Vista"
            >
              <ToggleButton value="kanban" sx={{ px: 1.25, gap: 0.75 }}>
                <ViewKanban sx={{ fontSize: 18 }} />
                Tablero
              </ToggleButton>
              <ToggleButton value="grouped" sx={{ px: 1.25, gap: 0.75 }}>
                <ViewModule sx={{ fontSize: 18 }} />
                Por capítulo
              </ToggleButton>
            </ToggleButtonGroup>
            {(hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR)) && (
              <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAssignDialog(true)}>
                Nueva asignación
              </Button>
            )}
          </>
        }
      />

      {viewMode === 'grouped' ? (
        <Panel
          title="Capítulos"
          count={getGroupedUserAssignments().length}
          action={
            <TextField
              select
              size="small"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              inputProps={{ 'aria-label': 'Filtrar por estado' }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">Todas ({stats.total})</MenuItem>
              <MenuItem value="pending">Pendientes ({stats.pending})</MenuItem>
              <MenuItem value="rejected">Rechazadas ({stats.rejected})</MenuItem>
              <MenuItem value="pendingApproval">Esperando aprobación ({stats.pendingApproval})</MenuItem>
              <MenuItem value="completed">Completadas ({stats.completed})</MenuItem>
              <MenuItem value="approved">Aprobadas ({stats.approved})</MenuItem>
              <MenuItem value="uploaded">Subidas ({stats.uploaded || 0})</MenuItem>
              <MenuItem value="overdue">Vencidas ({stats.overdue})</MenuItem>
            </TextField>
          }
        >
          {getGroupedUserAssignments().length === 0 ? (
            <EmptyState icon={Assignment} title={staffFilter === 'all' ? 'No tienes asignaciones' : 'Nada con este filtro'}>
              {staffFilter === 'all'
                ? 'Las nuevas asignaciones aparecerán aquí cuando te las den.'
                : 'Cambia el filtro para ver el resto de tus capítulos.'}
            </EmptyState>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {getGroupedUserAssignments().map((chapterGroup) => (
                <ChapterCard
                  key={`${chapterGroup.mangaId}-${chapterGroup.chapter}`}
                  chapterGroup={chapterGroup}
                  userRole={userProfile?.role}
                  onMarkComplete={handleMarkComplete}
                  onMarkUploaded={handleMarkUploaded}
                  onResubmitForReview={handleResubmitForReview}
                  onOpenUpload={handleOpenUpload}
                />
              ))}
            </Box>
          )}
        </Panel>
      ) : (
        // Tablero: columnas con scroll horizontal en pantallas estrechas
        <Box
          sx={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: { xs: 'minmax(272px, 86%)', sm: 'minmax(272px, 1fr)' },
            gap: 1.5,
            overflowX: 'auto',
            pb: 1,
            mx: { xs: -2, sm: 0 },
            px: { xs: 2, sm: 0 },
            scrollSnapType: { xs: 'x mandatory', sm: 'none' },
          }}
        >
          {KANBAN_COLUMNS.map((column) => {
            const groups = getKanbanGroupedAssignments(column.items);
            const Icon = column.icon;
            return (
              <Box
                key={column.key}
                component="section"
                aria-label={column.title}
                sx={{
                  scrollSnapAlign: 'start',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  maxHeight: { md: 'calc(100vh - 180px)' },
                  borderRadius: `${radius.xl}px`,
                  backgroundColor: colors.surfaceLow,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 2, pb: 1.25 }}>
                  <Icon aria-hidden="true" sx={{ fontSize: 18, color: column.tone }} />
                  <Typography component="h2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.onSurface, flex: 1 }}>
                    {column.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: colors.outline, fontVariantNumeric: 'tabular-nums' }}>
                    {column.items.length}
                  </Typography>
                </Box>
                <Box
                  component="ul"
                  sx={{ m: 0, px: 1, pb: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}
                >
                  {groups.length > 0 ? (
                    groups.map((chapterGroup) => renderKanbanCard(column, chapterGroup))
                  ) : (
                    <Box component="li" sx={{ listStyle: 'none', px: 1.5, py: 3, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant }}>{column.empty}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
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
                    }}
                  >
                    <AlertTitle sx={{ fontWeight: 600 }}>
                      Tarea rechazada por {selectedTask.reviewedByName || 'el jefe'}
                    </AlertTitle>
                    <Typography variant="body2" sx={{ mt: 1, color: colors.onSurface }}>
                      <strong>Motivo del rechazo:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: colors.onSurface, p: 2, bgcolor: colors.surfaceContainer, borderRadius: 2 }}>
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
                    }}
                  >
                    <AlertTitle sx={{ fontWeight: 600 }}>
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
                  {/* Botón para subir archivos si está pendiente o rechazada */}
                  {((selectedTask.status === 'pendiente' || selectedTask.status === 'pending') || 
                    (selectedTask.status === 'rechazado' || selectedTask.reviewComment)) && (
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => {
                        handleOpenUpload(selectedTask);
                        setDetailsOpen(false);
                      }}
                    >
                      {selectedTask.reviewComment ? 'Resubir Archivos' : 'Subir Archivos'}
                    </Button>
                  )}
                  
                  {/* Botón para completar si está pendiente (sin comentarios de rechazo) */}
                  {(selectedTask.status === 'pendiente' || selectedTask.status === 'pending') && !selectedTask.reviewComment && (
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        handleMarkComplete(selectedTask.id);
                        setDetailsOpen(false);
                      }}
                    >
                      Marcar como Completada
                    </Button>
                  )}
                  
                  {/* Botón para enviar a revisión si ya está completado pero aún no aprobado */}
                  {selectedTask.status === 'completado' && (
                    <Button
                      variant="outlined"
                      startIcon={<HourglassTop />}
                      onClick={() => {
                        // Lógica para enviar a revisión si es necesario
                        toast.info('La tarea ya fue completada y está esperando revisión.');
                        setDetailsOpen(false);
                      }}
                    >
                      Ya Completada
                    </Button>
                  )}
                  
                  {/* Botón para subir si el usuario es uploader */}
                  {userProfile?.role === 'uploader' && 
                   (selectedTask.status === 'completado' || selectedTask.status === 'aprobado') && (
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => {
                        handleMarkUploaded(selectedTask.id);
                        setDetailsOpen(false);
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
                    <Alert severity="info" sx={{ mb: 2 }}>
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
                    <Alert severity="success" sx={{ mb: 2 }}>
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
                    <Alert severity="info" sx={{ mb: 2 }}>
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
                
                return (
                  <Grid item xs={12} key={assignment.id || index}>
                    <Card sx={{ mb: 1.5, backgroundColor: colors.surfaceContainer }}>
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
                            }}
                          >
                            <AlertTitle sx={{ fontWeight: 600 }}>
                              Tarea rechazada por {assignment.reviewedByName || 'el jefe'}
                            </AlertTitle>
                            <Typography variant="body2" sx={{ mt: 1, color: colors.onSurface }}>
                              <strong>Motivo del rechazo:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: colors.onSurface, p: 2, bgcolor: colors.surfaceContainer, borderRadius: 2 }}>
                              {assignment.reviewComment}
                            </Typography>
                            {assignment.reviewedAt && (
                              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                Revisado el: {new Date(assignment.reviewedAt).toLocaleString('es-ES')}
                              </Typography>
                            )}
                            
                            {/* Botones para tareas rechazadas */}
                            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              <Button
                                variant="outlined"
                                startIcon={<UploadIcon />}
                onClick={() => {
                  handleOpenUpload(assignment);
                                  setDetailsOpen(false);
                                }}
                              >
                                Subir Archivos
                              </Button>
                              <Button
                                variant="contained"
                                startIcon={<Assignment />}
                                onClick={() => {
                                  handleResubmitForReview(assignment.id);
                                  setDetailsOpen(false);
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
                            }}
                          >
                            <AlertTitle sx={{ fontWeight: 600 }}>
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
                            }}
                          >
                            <AlertTitle sx={{ fontWeight: 600 }}>
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
                                <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, bgcolor: colors.surfaceHigh, borderRadius: 2 }}>
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
                            }}
                          >
                            <AlertTitle sx={{ fontWeight: 600 }}>
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
                            }}
                          >
                            <AlertTitle sx={{ fontWeight: 600 }}>
                              Tarea lista para trabajar
                            </AlertTitle>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Esta tarea está esperando a ser completada. ¡Puedes empezar a trabajar en ella!
                            </Typography>
                            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              <Button
                                variant="outlined"
                                startIcon={<UploadIcon />}
                onClick={() => {
                  handleOpenUpload(assignment);
                                  setDetailsOpen(false);
                                }}
                              >
                                Subir Archivos
                              </Button>
                              <Button
                                variant="contained"
                                startIcon={<PlayArrow />}
                                onClick={() => {
                                  handleMarkComplete(assignment.id);
                                  setDetailsOpen(false);
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
                    >
                      Reenviar Todas las Rechazadas
                    </Button>
                  )}
                  
                  {/* Botón de upload directo para tareas pendientes/rechazadas */}
                  {selectedChapterGroup.assignments.some(a => 
                    a.status === 'pendiente' || a.status === 'pending' || a.status === 'rechazado'
                  ) && (
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => {
                        // Buscar todas las tareas que se puedan subir
                        const uploadableTasks = selectedChapterGroup.assignments.filter(a => 
                          a.status === 'pendiente' || a.status === 'pending' || a.status === 'rechazado'
                        );
                        if (uploadableTasks.length > 0) {
                          handleOpenUpload(uploadableTasks);
                          setDetailsOpen(false);
                        }
                      }}
                    >
                      Subir Archivos (Pendientes)
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
                    >
                      Completar Todas las Pendientes
                    </Button>
                  )}
                  
                  {/* Acciones para tareas completadas (uploadable) */}
                  {userProfile?.role === 'uploader' && 
                   selectedChapterGroup.assignments.some(a => a.status === 'completado' || a.status === 'aprobado') && (
                    <Button
                      variant="outlined"
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
      
      {/* Componente FileUploader */}
      <FileUploader 
        assignment={assignmentToUpload}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        open={uploadDialogOpen}
        onClose={handleCloseUpload}
      />
    </Box>
  );
};

export default MyWorks;
