import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Badge,
  Tooltip,
  Stack,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  AlertTitle
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  HourglassTop as PendingIcon,
  Person as PersonIcon,
  Book as BookIcon,
  Schedule as TimeIcon,
  Assignment as TaskIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Comment as CommentIcon,
  Link as LinkIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { ASSIGNMENT_STATUS, STATUS_CONFIG, TASK_TYPES, isChiefRole } from '../utils/constants';
import realtimeService from '../services/realtimeService';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

const ReviewPanel = () => {
  const { userProfile, hasRole } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [reviewDialog, setReviewDialog] = useState({
    open: false,
    action: null, // 'approve' or 'reject'
    assignment: null
  });
  const [reviewComment, setReviewComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pendiente_aprobacion',
    taskType: '',
    user: '',
    manga: '',
    search: ''
  });

  // Solo permitir acceso a jefes y administradores
  const canAccess = hasRole(ROLES.ADMIN) || hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR);

  useEffect(() => {
    if (!userProfile || !canAccess) return;

    setLoading(true);
    
    let unsubscribeAssignments = null;
    let unsubscribeUsers = null;
    
    // Initialize async subscriptions
    const initSubscriptions = async () => {
      try {
        // Subscribe to ALL assignments without user filter
        // IMPORTANT: Don't pass second parameter to get ALL assignments
        unsubscribeAssignments = await realtimeService.subscribeToAssignments((allAssignments) => {
          console.log('👀 ReviewPanel - Current user:', {
            uid: userProfile.uid,
            name: userProfile.name,
            role: userProfile.role,
            isAdmin: hasRole(ROLES.ADMIN),
            isJefeTraductor: hasRole(ROLES.JEFE_TRADUCTOR),
            isJefeEditor: hasRole(ROLES.JEFE_EDITOR)
          });
          
          // Detailed role debug log
          console.log('🔍 Role debug:', {
            'userProfile.role': userProfile.role,
            'ROLES.JEFE_EDITOR': ROLES.JEFE_EDITOR,
            'ROLES.JEFE_TRADUCTOR': ROLES.JEFE_TRADUCTOR,
            'userProfile.role === ROLES.JEFE_EDITOR': userProfile.role === ROLES.JEFE_EDITOR,
            'hasRole(ROLES.JEFE_EDITOR)': hasRole(ROLES.JEFE_EDITOR),
            'hasRole(ROLES.JEFE_TRADUCTOR)': hasRole(ROLES.JEFE_TRADUCTOR)
          });
          console.log('📋 ReviewPanel - Total assignments received:', allAssignments.length);
          
          // Status and type summary log
          const statusSummary = allAssignments.reduce((acc, assignment) => {
            const key = `${assignment.status}_${assignment.type}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
          console.log('📊 Summary by status and type:', statusSummary);
          
          // Log specific pending approval assignments
          const pendingApproval = allAssignments.filter(a => a.status === ASSIGNMENT_STATUS.PENDIENTE_APROBACION);
          console.log('⏳ Pending approval assignments:', pendingApproval.length);
          pendingApproval.forEach(assignment => {
            console.log(`  - ${assignment.type}: ${assignment.mangaTitle} Ch. ${assignment.chapter} (${assignment.id})`);
          });
          
          // Log specific cleanRedrawer assignments
          const cleanAssignments = allAssignments.filter(a => a.type === 'cleanRedrawer');
          console.log('🧹 CleanRedrawer assignments (all):', cleanAssignments.length);
          cleanAssignments.forEach(assignment => {
            console.log(`  - cleanRedrawer: ${assignment.mangaTitle} Ch. ${assignment.chapter} | Status: ${assignment.status} | ID: ${assignment.id}`);
          });
          
          // Filter assignments that require review by current chief type
          const filteredAssignments = allAssignments.filter(assignment => {
            console.log('🔍 Reviewing assignment:', {
              id: assignment.id,
              manga: assignment.mangaTitle,
              chapter: assignment.chapter,
              status: assignment.status,
              type: assignment.type,
              assignedTo: assignment.assignedTo,
              pendingApprovalSince: assignment.pendingApprovalSince,
              reviewRequiredBy: assignment.reviewRequiredBy
            });
            
            // Only show assignments that are pending approval
            if (assignment.status !== ASSIGNMENT_STATUS.PENDIENTE_APROBACION) {
              console.log('❌ Status is not pending approval:', assignment.status);
              return false;
            }

            // Admins can see everything
            if (hasRole(ROLES.ADMIN)) {
              console.log('✅ Admin can see everything');
              return true;
            }

            // Chiefs can review assignments from their area
            // If they have multiple chief roles, they can review all corresponding types
            const canReviewAsTraductor = hasRole(ROLES.JEFE_TRADUCTOR) && ['traduccion', 'proofreading'].includes(assignment.type);
            const canReviewAsEditor = hasRole(ROLES.JEFE_EDITOR) && ['cleanRedrawer', 'type'].includes(assignment.type);
            
            const canReview = canReviewAsTraductor || canReviewAsEditor;
            
            console.log('🔍 Permission review:', {
              type: assignment.type,
              isJefeTraductor: hasRole(ROLES.JEFE_TRADUCTOR),
              isJefeEditor: hasRole(ROLES.JEFE_EDITOR),
              canReviewAsTraductor,
              canReviewAsEditor,
              canReview
            });
            
            return canReview;

            console.log('❌ No permission to review');
            return false;
          });

          console.log('✅ Filtered assignments for review:', filteredAssignments.length);
          console.log('📊 Details:', filteredAssignments.map(a => ({
            id: a.id,
            manga: a.mangaTitle,
            chapter: a.chapter,
            type: a.type,
            status: a.status
          })));
          
          setAssignments(filteredAssignments);
          setLoading(false);
        });

        // Subscribe to users to show names
        unsubscribeUsers = await realtimeService.subscribeToUsers(setUsers);
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        setLoading(false);
      }
    };

    initSubscriptions();

    return () => {
      if (typeof unsubscribeAssignments === 'function') unsubscribeAssignments();
      if (typeof unsubscribeUsers === 'function') unsubscribeUsers();
    };
  }, [userProfile, canAccess, hasRole]);

  const handleApprove = (assignment) => {
    setReviewDialog({
      open: true,
      action: 'approve',
      assignment
    });
  };

  const handleReject = (assignment) => {
    setReviewDialog({
      open: true,
      action: 'reject',
      assignment
    });
  };

  const handleReviewSubmit = async () => {
    if (!reviewDialog.assignment) return;

    setProcessing(true);
    try {
      const newStatus = reviewDialog.action === 'approve' 
        ? ASSIGNMENT_STATUS.APROBADO 
        : ASSIGNMENT_STATUS.PENDIENTE;

      const updateData = {
        status: newStatus,
        reviewedBy: userProfile.uid,
        reviewedAt: new Date().toISOString(),
        reviewComment: reviewComment,
        reviewedByName: userProfile.name
      };

      if (reviewDialog.action === 'approve') {
        updateData.approvedBy = userProfile.uid;
        updateData.approvedAt = new Date().toISOString();
        updateData.approvedByName = userProfile.name;
      }

      await realtimeService.updateAssignment(reviewDialog.assignment.id, updateData);

      toast.success(
        reviewDialog.action === 'approve' 
          ? '✅ Asignación aprobada exitosamente' 
          : '❌ Asignación rechazada y devuelta al trabajador',
        { duration: 4000 }
      );

      setReviewDialog({ open: false, action: null, assignment: null });
      setReviewComment('');
    } catch (error) {
      console.error('Error al revisar asignación:', error);
      toast.error('Error al procesar la revisión');
    } finally {
      setProcessing(false);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    
    const date = new Date(dateString);
    if (!isValid(date)) return 'Fecha inválida';
    
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const getUserName = (userId) => {
    const user = users.find(u => (u.uid || u.id) === userId);
    return user ? user.name : 'Usuario desconocido';
  };

  const getMangas = () => {
    const mangaSet = new Set();
    assignments.forEach(assignment => {
      if (assignment.mangaTitle) {
        mangaSet.add(assignment.mangaTitle);
      }
    });
    return Array.from(mangaSet).sort();
  };

  const getFilteredAssignments = () => {
    return assignments.filter(assignment => {
      if (filters.taskType && assignment.type !== filters.taskType) return false;
      if (filters.user && assignment.assignedTo !== filters.user) return false;
      if (filters.manga && assignment.mangaTitle !== filters.manga) return false;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          assignment.mangaTitle?.toLowerCase().includes(searchTerm) ||
          assignment.chapter?.toString().includes(searchTerm) ||
          getUserName(assignment.assignedTo).toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }
      return true;
    });
  };

  const getUniqueUsers = () => {
    const userSet = new Set();
    assignments.forEach(assignment => {
      if (assignment.assignedTo) {
        userSet.add(assignment.assignedTo);
      }
    });
    return Array.from(userSet).map(userId => {
      const user = users.find(u => (u.uid || u.id) === userId);
      return user || { uid: userId, name: 'Usuario desconocido' };
    });
  };

  const stats = {
    total: assignments.length,
    translation: assignments.filter(a => a.type === 'traduccion').length,
    editing: assignments.filter(a => ['proofreading', 'cleanRedrawer', 'type'].includes(a.type)).length,
    overdue: assignments.filter(a => {
      if (!a.dueDate) return false;
      return new Date(a.dueDate) < new Date();
    }).length
  };

  // Verificación de acceso
  if (!userProfile) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="info">
          <Typography>Cargando información del usuario...</Typography>
        </Alert>
      </Container>
    );
  }

  if (!canAccess) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error">
          <AlertTitle>Acceso Restringido</AlertTitle>
          <Typography>
            Esta página solo está disponible para Administradores, Jefes de Traducción y Jefes de Edición.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Tu rol actual: <strong>{userProfile.role}</strong>
          </Typography>
        </Alert>
      </Container>
    );
  }

  const filteredAssignments = getFilteredAssignments();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
        p: 3,
        borderRadius: 3,
        border: '1px solid rgba(245, 158, 11, 0.2)'
      }}>
        <Box>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 1
            }}
          >
            Panel de Revisión
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Solicitudes de aprobación pendientes de revisión
          </Typography>
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CircularProgress size={16} sx={{ color: 'primary.main' }} />
              <Typography variant="body2" color="primary.main">
                Cargando solicitudes...
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Tooltip title="Actualizar solicitudes">
            <IconButton
              onClick={() => window.location.reload()}
              disabled={loading}
              sx={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                '&:hover': {
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  transform: 'scale(1.05)'
                },
                '&:disabled': {
                  backgroundColor: 'rgba(107, 114, 128, 0.1)',
                  color: '#6b7280'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            textAlign: 'center',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <CardContent sx={{ py: 2 }}>
              <Badge badgeContent={stats.total} color="warning" max={999}>
                <PendingIcon sx={{ fontSize: '2rem', color: '#f59e0b', mb: 1 }} />
              </Badge>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            textAlign: 'center',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {stats.translation}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Traducción
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            textAlign: 'center',
            background: 'rgba(236, 72, 153, 0.1)',
            border: '1px solid rgba(236, 72, 153, 0.2)'
          }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#ec4899' }}>
                {stats.editing}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Edición
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            textAlign: 'center',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" fontWeight={700} color="error">
                {stats.overdue}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vencidas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ 
        mb: 4,
        background: 'rgba(15, 15, 25, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(148, 163, 184, 0.1)'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <FilterIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filtros
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {(filters.taskType || filters.user || filters.manga || filters.search) && (
              <Button
                size="small"
                onClick={() => setFilters({ status: 'pendiente_aprobacion', taskType: '', user: '', manga: '', search: '' })}
                sx={{ color: 'text.secondary' }}
              >
                Limpiar filtros
              </Button>
            )}
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Tarea</InputLabel>
                <Select
                  value={filters.taskType}
                  label="Tipo de Tarea"
                  onChange={(e) => setFilters(prev => ({ ...prev, taskType: e.target.value }))}
                >
                  <MenuItem value="">Todas las tareas</MenuItem>
                  {Object.entries(TASK_TYPES).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Usuario</InputLabel>
                <Select
                  value={filters.user}
                  label="Usuario"
                  onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                >
                  <MenuItem value="">Todos los usuarios</MenuItem>
                  {getUniqueUsers().map((user) => (
                    <MenuItem key={user.uid || user.id} value={user.uid || user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Manga</InputLabel>
                <Select
                  value={filters.manga}
                  label="Manga"
                  onChange={(e) => setFilters(prev => ({ ...prev, manga: e.target.value }))}
                >
                  <MenuItem value="">Todos los mangas</MenuItem>
                  {getMangas().map((manga) => (
                    <MenuItem key={manga} value={manga}>{manga}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Solicitudes */}
      {loading ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">
            Cargando solicitudes de revisión...
          </Typography>
        </Card>
      ) : filteredAssignments.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <PendingIcon sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay solicitudes de revisión pendientes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {stats.total === 0 
              ? 'Todas las asignaciones están al día' 
              : 'No hay solicitudes que coincidan con los filtros aplicados'
            }
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ 
          background: 'rgba(15, 15, 25, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: '1px solid rgba(148, 163, 184, 0.1)' } }}>
                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Asignación</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Trabajador</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Enviado</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssignments.map((assignment) => (
                <TableRow 
                  key={assignment.id}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'rgba(99, 102, 241, 0.05)',
                      transform: 'translateX(2px)',
                      transition: 'all 0.2s ease'
                    },
                    '& td': { borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {assignment.mangaTitle || 'Manga desconocido'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Capítulo {assignment.chapter}
                      </Typography>
                      {assignment.driveLink && (
                        <Tooltip title="Ver archivos en Drive">
                          <IconButton
                            size="small"
                            href={assignment.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ mt: 0.5, color: 'primary.main' }}
                          >
                            <LinkIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {getUserName(assignment.assignedTo)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {assignment.assignedToName !== getUserName(assignment.assignedTo) ? assignment.assignedToName : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={TASK_TYPES[assignment.type] || assignment.type}
                      size="small"
                      sx={{
                        backgroundColor: assignment.type === 'traduccion' ? 'rgba(99, 102, 241, 0.1)' :
                                        assignment.type === 'proofreading' ? 'rgba(236, 72, 153, 0.1)' :
                                        assignment.type === 'cleanRedrawer' ? 'rgba(16, 185, 129, 0.1)' :
                                        'rgba(245, 158, 11, 0.1)',
                        color: assignment.type === 'traduccion' ? '#6366f1' :
                               assignment.type === 'proofreading' ? '#ec4899' :
                               assignment.type === 'cleanRedrawer' ? '#10b981' :
                               '#f59e0b',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<PendingIcon />}
                      label="Esperando Aprobación"
                      size="small"
                      sx={{
                        backgroundColor: STATUS_CONFIG[ASSIGNMENT_STATUS.PENDIENTE_APROBACION].bgColor,
                        color: STATUS_CONFIG[ASSIGNMENT_STATUS.PENDIENTE_APROBACION].color,
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {getTimeAgo(assignment.pendingApprovalSince || assignment.completedDate)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assignment.pendingApprovalSince ? 
                          format(new Date(assignment.pendingApprovalSince), 'dd/MM/yyyy HH:mm', { locale: es }) :
                          'Fecha no disponible'
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Aprobar asignación">
                        <IconButton
                          onClick={() => handleApprove(assignment)}
                          sx={{
                            color: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            '&:hover': {
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <ThumbUpIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rechazar y devolver">
                        <IconButton
                          onClick={() => handleReject(assignment)}
                          sx={{
                            color: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            '&:hover': {
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <ThumbDownIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog de Revisión */}
      <Dialog
        open={reviewDialog.open}
        onClose={() => !processing && setReviewDialog({ open: false, action: null, assignment: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {reviewDialog.action === 'approve' ? (
              <ThumbUpIcon sx={{ color: '#10b981' }} />
            ) : (
              <ThumbDownIcon sx={{ color: '#ef4444' }} />
            )}
            {reviewDialog.action === 'approve' ? 'Aprobar Asignación' : 'Rechazar Asignación'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {reviewDialog.assignment && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Asignación:</strong> {reviewDialog.assignment.mangaTitle} - Capítulo {reviewDialog.assignment.chapter}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Tipo:</strong> {TASK_TYPES[reviewDialog.assignment.type] || reviewDialog.assignment.type}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Trabajador:</strong> {getUserName(reviewDialog.assignment.assignedTo)}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Enviado:</strong> {getTimeAgo(reviewDialog.assignment.pendingApprovalSince)}
              </Typography>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label={reviewDialog.action === 'approve' ? 'Comentario de aprobación (opcional)' : 'Motivo del rechazo'}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder={
              reviewDialog.action === 'approve' 
                ? 'Excelente trabajo, todo perfecto...' 
                : 'Por favor revisa los siguientes puntos...'
            }
            required={reviewDialog.action === 'reject'}
            helperText={
              reviewDialog.action === 'reject' 
                ? 'Es obligatorio proporcionar un motivo para el rechazo'
                : 'Opcional: Agrega comentarios para el trabajador'
            }
          />
          
          {reviewDialog.action === 'approve' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <AlertTitle>Aprobar Asignación</AlertTitle>
              Esta acción marcará la asignación como <strong>APROBADA</strong>. 
              El trabajador será notificado de la aprobación.
            </Alert>
          )}
          
          {reviewDialog.action === 'reject' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <AlertTitle>Rechazar Asignación</AlertTitle>
              Esta acción devolverá la asignación al estado <strong>PENDIENTE</strong>. 
              El trabajador deberá corregir los puntos mencionados y enviar nuevamente.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReviewDialog({ open: false, action: null, assignment: null })}
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleReviewSubmit}
            disabled={processing || (reviewDialog.action === 'reject' && !reviewComment.trim())}
            sx={{
              backgroundColor: reviewDialog.action === 'approve' ? '#10b981' : '#ef4444',
              '&:hover': {
                backgroundColor: reviewDialog.action === 'approve' ? '#059669' : '#dc2626'
              }
            }}
            startIcon={processing ? <CircularProgress size={20} /> : null}
          >
            {processing ? 'Procesando...' : 
             reviewDialog.action === 'approve' ? 'Aprobar' : 'Rechazar'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReviewPanel;
