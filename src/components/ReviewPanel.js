import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
  Stack,
  Divider,
  CircularProgress,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Visibility as ViewIcon,
  HourglassTop as PendingIcon,
  Schedule as TimeIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  LockOutlined
} from '@mui/icons-material';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import { ASSIGNMENT_STATUS, TASK_TYPES, ROLE_LABELS } from '../utils/constants';
import { PageHeader, Panel, EmptyState, TaskTypeTag } from './ui';
import { triggerHaptic } from '../hooks/useWebHaptics';
import { colors, radius, rowDivider } from '../theme/tokens';
import realtimeService from '../services/realtimeService';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import FilePreview from './FilePreview';

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
  const [filePreview, setFilePreview] = useState({
    open: false,
    assignment: null
  });
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
          
          // Filter assignments that require review by current chief type
          const filteredAssignments = allAssignments.filter(assignment => {
            // Only show assignments that are pending approval
            if (assignment.status !== ASSIGNMENT_STATUS.PENDIENTE_APROBACION) {
              return false;
            }

            // Admins can see everything
            if (hasRole(ROLES.ADMIN)) {
              return true;
            }

            // Chiefs can review assignments from their area
            // If they have multiple chief roles, they can review all corresponding types
            const canReviewAsTraductor = hasRole(ROLES.JEFE_TRADUCTOR) && ['traduccion', 'proofreading'].includes(assignment.type);
            const canReviewAsEditor = hasRole(ROLES.JEFE_EDITOR) && ['cleanRedrawer', 'type'].includes(assignment.type);
            
            const canReview = canReviewAsTraductor || canReviewAsEditor;
            
            return canReview;
          });

          setAssignments(filteredAssignments);
          setLoading(false);
        });

        // Subscribe to users to show names
        unsubscribeUsers = await realtimeService.subscribeToUsers(setUsers);
      } catch (error) {
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

  const handlePreviewFiles = (assignment) => {
    setFilePreview({
      open: true,
      assignment
    });
  };

  const handleClosePreview = () => {
    setFilePreview({
      open: false,
      assignment: null
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
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography sx={{ color: colors.onSurfaceVariant }}>Cargando información del usuario…</Typography>
      </Box>
    );
  }

  if (!canAccess) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', mt: 6 }}>
        <Panel>
          <EmptyState icon={LockOutlined} title="No tienes acceso a Revisiones">
            Esta página es para administradores y jefes de traducción o de edición. Tu rol actual es {ROLE_LABELS[userProfile.role] || userProfile.role}.
          </EmptyState>
        </Panel>
      </Box>
    );
  }

  const submittedAt = (a) => a.pendingApprovalSince || a.completedDate;
  // Primero quien lleva más tiempo esperando.
  const filteredAssignments = getFilteredAssignments()
    .slice()
    .sort((a, b) => new Date(submittedAt(a) || 0) - new Date(submittedAt(b) || 0));

  const hasExtraFilters = Boolean(filters.user || filters.manga || filters.search);
  const typeCounts = Object.keys(TASK_TYPES).reduce((acc, key) => {
    acc[key] = assignments.filter((a) => a.type === key).length;
    return acc;
  }, {});

  const userById = (userId) => users.find((u) => (u.uid || u.id) === userId);
  const avatarOf = (userId) => {
    const u = userById(userId);
    return u?.profileImage || u?.photoURL || u?.avatar || undefined;
  };

  const GRID = 'minmax(0, 2fr) minmax(0, 1.4fr) minmax(0, 1fr) 140px 240px';

  return (
    <Box>
      <PageHeader
        title="Revisiones"
        subtitle={
          loading
            ? 'Cargando solicitudes…'
            : stats.total === 0
              ? 'Nada esperando revisión'
              : [
                  `${stats.total} ${stats.total === 1 ? 'entrega espera' : 'entregas esperan'} tu revisión`,
                  stats.overdue > 0 ? `${stats.overdue} fuera de plazo` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')
        }
      />

      {/* Filtros */}
      <Panel sx={{ mb: 2, p: { xs: 1.5, sm: 1.5 } }} aria-label="Filtros">
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'minmax(0, 1.6fr) repeat(2, minmax(0, 1fr)) auto' },
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar serie, capítulo o persona"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            inputProps={{ 'aria-label': 'Buscar' }}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: colors.outline, mr: 1, fontSize: 20 }} /> }}
          />
          <TextField
            select
            size="small"
            value={filters.user}
            onChange={(e) => setFilters((prev) => ({ ...prev, user: e.target.value }))}
            SelectProps={{ displayEmpty: true }}
            inputProps={{ 'aria-label': 'Persona' }}
          >
            <MenuItem value="">Todas las personas</MenuItem>
            {getUniqueUsers().map((user) => (
              <MenuItem key={user.uid || user.id} value={user.uid || user.id}>
                {user.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            value={filters.manga}
            onChange={(e) => setFilters((prev) => ({ ...prev, manga: e.target.value }))}
            SelectProps={{ displayEmpty: true }}
            inputProps={{ 'aria-label': 'Serie' }}
          >
            <MenuItem value="">Todas las series</MenuItem>
            {getMangas().map((manga) => (
              <MenuItem key={manga} value={manga}>
                {manga}
              </MenuItem>
            ))}
          </TextField>
          {hasExtraFilters ? (
            <Button
              size="small"
              onClick={() => setFilters((prev) => ({ ...prev, user: '', manga: '', search: '' }))}
              sx={{ color: colors.onSurfaceVariant, justifySelf: 'start' }}
            >
              Limpiar
            </Button>
          ) : (
            <Box sx={{ display: { xs: 'none', lg: 'block' }, width: 72 }} />
          )}
        </Box>
      </Panel>

      {/* Cola */}
      <Panel
        title="En cola"
        count={filteredAssignments.length}
        action={
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filters.taskType}
            onChange={(e, value) => {
              if (value !== null) {
                triggerHaptic('light');
                setFilters((prev) => ({ ...prev, taskType: value }));
              }
            }}
            aria-label="Tipo de tarea"
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
          >
            <ToggleButton value="" sx={{ px: 1.25, fontSize: '0.8125rem' }}>
              Todas
              <Box component="span" sx={{ ml: 0.75, color: colors.outline, fontVariantNumeric: 'tabular-nums' }}>{stats.total}</Box>
            </ToggleButton>
            {Object.entries(TASK_TYPES).map(([key, label]) => (
              <ToggleButton key={key} value={key} sx={{ px: 1.25, fontSize: '0.8125rem' }}>
                {label}
                <Box component="span" sx={{ ml: 0.75, color: colors.outline, fontVariantNumeric: 'tabular-nums' }}>{typeCounts[key]}</Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        }
      >
        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={32} aria-label="Cargando solicitudes" />
          </Box>
        ) : filteredAssignments.length === 0 ? (
          <EmptyState icon={PendingIcon} title={stats.total === 0 ? 'Todo revisado' : 'Nada con estos filtros'}>
            {stats.total === 0
              ? 'Cuando alguien envíe un capítulo terminado para aprobar, aparecerá aquí.'
              : 'Prueba con otro tipo de tarea o limpia los filtros.'}
          </EmptyState>
        ) : (
          <Box role="table" aria-label="Entregas por revisar" sx={{ mx: -1 }}>
            <Box
              role="row"
              sx={{
                display: { xs: 'none', lg: 'grid' },
                gridTemplateColumns: GRID,
                gap: 2,
                px: 1,
                pb: 1,
                borderBottom: `1px solid ${rowDivider}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: colors.onSurfaceVariant,
              }}
            >
              <span role="columnheader">Capítulo</span>
              <span role="columnheader">Persona</span>
              <span role="columnheader">Tarea</span>
              <span role="columnheader">Enviado</span>
              <span role="columnheader" style={{ textAlign: 'right' }}>Acciones</span>
            </Box>
            {filteredAssignments.map((assignment) => {
              const name = getUserName(assignment.assignedTo);
              const avatar = avatarOf(assignment.assignedTo);
              const late = assignment.dueDate && new Date(assignment.dueDate) < new Date();
              const sent = submittedAt(assignment);
              return (
                <Box
                  key={assignment.id}
                  role="row"
                  sx={{
                    display: { xs: 'flex', lg: 'grid' },
                    flexDirection: 'column',
                    gridTemplateColumns: GRID,
                    alignItems: { lg: 'center' },
                    gap: { xs: 1, lg: 2 },
                    px: 1,
                    py: 1.5,
                    borderRadius: `${radius.md}px`,
                    transition: 'background-color 150ms ease-out',
                    '&:hover': { backgroundColor: colors.surfaceContainer },
                    '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` },
                  }}
                >
                  <Box role="cell" sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, minWidth: 0 }}>
                      <Typography noWrap component="span" sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.onSurface, minWidth: 0 }}>
                        {assignment.mangaTitle || 'Serie desconocida'}
                      </Typography>
                      <Box component="span" sx={{ flexShrink: 0, fontSize: '0.875rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                        Cap. {assignment.chapter}
                      </Box>
                    </Box>
                    {late && (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.25, fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
                        <TimeIcon aria-hidden="true" sx={{ fontSize: 14, color: colors.error }} />
                        Fuera de plazo
                      </Box>
                    )}
                  </Box>
                  <Box role="cell" sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Avatar src={avatar} alt="" sx={{ width: 26, height: 26, fontSize: '0.6875rem', fontWeight: 700 }}>
                      {!avatar && name.substring(0, 2).toUpperCase()}
                    </Avatar>
                    <Typography noWrap sx={{ fontSize: '0.8125rem', color: colors.onSurface }}>
                      {name}
                    </Typography>
                  </Box>
                  <Box role="cell" sx={{ fontSize: '0.8125rem' }}>
                    <TaskTypeTag type={assignment.type} />
                  </Box>
                  <Box role="cell">
                    <Tooltip title={sent && isValid(new Date(sent)) ? format(new Date(sent), 'dd/MM/yyyy HH:mm', { locale: es }) : ''}>
                      <Typography component="span" sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant }}>
                        {getTimeAgo(sent)}
                      </Typography>
                    </Tooltip>
                  </Box>
                  <Box role="cell" sx={{ display: 'flex', gap: 0.75, justifyContent: { lg: 'flex-end' }, flexWrap: 'wrap' }}>
                    {assignment.driveLink && (
                      <Tooltip title="Ver archivos">
                        <IconButton onClick={() => handlePreviewFiles(assignment)} aria-label="Ver archivos" size="small">
                          <ViewIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Button
                      size="small"
                      startIcon={<ThumbDownIcon sx={{ fontSize: 16 }} />}
                      onClick={() => {
                        triggerHaptic('light');
                        handleReject(assignment);
                      }}
                      sx={{ color: colors.onSurfaceVariant }}
                    >
                      Rechazar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ThumbUpIcon sx={{ fontSize: 16, color: colors.goodNews }} />}
                      onClick={() => {
                        triggerHaptic('light');
                        handleApprove(assignment);
                      }}
                    >
                      Aprobar
                    </Button>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Panel>

      {/* Dialog de Revisión */}
      <Dialog
        open={reviewDialog.open}
        onClose={() => !processing && setReviewDialog({ open: false, action: null, assignment: null })}
        maxWidth={reviewDialog.assignment?.driveLink ? "lg" : "sm"}
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            height: reviewDialog.assignment?.driveLink ? 'auto' : undefined
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {reviewDialog.action === 'approve' ? (
              <ThumbUpIcon sx={{ color: colors.goodNews }} />
            ) : (
              <ThumbDownIcon sx={{ color: colors.error }} />
            )}
            {reviewDialog.action === 'approve' ? 'Aprobar entrega' : 'Devolver para corregir'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {reviewDialog.assignment && (
            <Grid container spacing={3}>
              {/* Vista previa de archivos (si existe driveLink) */}
              {reviewDialog.assignment.driveLink && (
                <Grid item xs={12} md={7}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ViewIcon color="primary" />
                      Vista previa de archivos
                    </Typography>
                    <FilePreview 
                      assignment={reviewDialog.assignment}
                      maxHeight="60vh"
                      showControls={true}
                      autoDetectMultiple={true}
                    />
                  </Box>
                </Grid>
              )}
              
              {/* Formulario de revisión */}
              <Grid item xs={12} md={reviewDialog.assignment.driveLink ? 5 : 12}>
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
                  {reviewDialog.assignment.driveLink && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      ¡Puedes revisar los archivos en la vista previa de la izquierda mientras escribes tu comentario!
                    </Typography>
                  )}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
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
                    La tarea quedará <strong>aprobada</strong> y la persona verá tu comentario.
                  </Alert>
                )}
                
                {reviewDialog.action === 'reject' && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    La tarea vuelve a <strong>pendiente</strong>: la persona verá el motivo, corregirá y la enviará de nuevo.
                  </Alert>
                )}
              </Grid>
            </Grid>
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
            color={reviewDialog.action === 'approve' ? 'primary' : 'error'}
            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {processing ? 'Procesando...' : 
             reviewDialog.action === 'approve' ? 'Aprobar' : 'Devolver'
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog independiente para vista previa de archivos */}
      <Dialog
        open={filePreview.open}
        onClose={handleClosePreview}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '95vh',
            height: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ViewIcon color="primary" />
              <Box>
                <Typography variant="h6" component="span">
                  Vista previa de archivos
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                  {filePreview.assignment?.mangaTitle} - Capítulo {filePreview.assignment?.chapter}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleClosePreview} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {filePreview.assignment && (
            <FilePreview 
              assignment={filePreview.assignment}
              maxHeight="75vh"
              showControls={true}
              autoDetectMultiple={true}
            />
          )}
        </DialogContent>
        <DialogActions>
          {filePreview.assignment && (
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<ThumbUpIcon />}
                onClick={() => {
                  handleClosePreview();
                  handleApprove(filePreview.assignment);
                }}
              >
                Aprobar
              </Button>
              <Button
                variant="outlined"
                startIcon={<ThumbDownIcon />}
                onClick={() => {
                  handleClosePreview();
                  handleReject(filePreview.assignment);
                }}
              >
                Rechazar
              </Button>
              <Button
                variant="contained"
                startIcon={<OpenInNewIcon />}
                href={filePreview.assignment?.driveLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir en Drive
              </Button>
            </Stack>
          )}
          <Button onClick={handleClosePreview}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewPanel;
