import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
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
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Publish as PublishIcon,
  Link as LinkIcon,
  CalendarToday as CalendarIcon,
  Book as BookIcon,
} from '@mui/icons-material';

// Estados de asignación según el spreadsheet
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
    icon: <AssignmentIcon />
  },
  [ASSIGNMENT_STATUS.ASIGNADO]: {
    label: 'Asignado',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    icon: <ScheduleIcon />
  },
  [ASSIGNMENT_STATUS.LISTO]: {
    label: 'Listo',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: <CheckCircleIcon />
  },
  [ASSIGNMENT_STATUS.PUBLICADO]: {
    label: 'Publicado en Patreon',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    icon: <PublishIcon />
  },
  [ASSIGNMENT_STATUS.RETRASADO]: {
    label: 'Retrasado',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: <WarningIcon />
  }
};

// Roles según el spreadsheet
const ROLES = {
  TRADUCTOR: 'traductor',
  PROOFREADING: 'proofreading',
  TYPE: 'type',
  CLEAN_REDRAWER: 'clean_redrawer'
};

const ROLE_CONFIG = {
  [ROLES.TRADUCTOR]: {
    label: 'Traductor',
    color: '#6366f1'
  },
  [ROLES.PROOFREADING]: {
    label: 'Proofreading',
    color: '#ec4899'
  },
  [ROLES.TYPE]: {
    label: 'Type',
    color: '#f59e0b'
  },
  [ROLES.CLEAN_REDRAWER]: {
    label: 'Clean y Redrawer',
    color: '#10b981'
  }
};

const AssignmentCard = ({ assignment, onEdit, onDelete, users = [] }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const statusConfig = STATUS_CONFIG[assignment.status] || STATUS_CONFIG[ASSIGNMENT_STATUS.SIN_ASIGNAR];

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getAssignedUser = (userId) => {
    return users.find(user => user.id === userId)?.name || 'No asignado';
  };

  const calculateProgress = () => {
    const roles = [assignment.traductor, assignment.proofreading, assignment.type, assignment.cleanRedrawer];
    const completed = roles.filter(role => role && role.completed).length;
    return (completed / roles.length) * 100;
  };

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <Card 
      className="hover-glow animate-scale-in"
      sx={{ 
        mb: 2,
        position: 'relative',
        overflow: 'hidden',
        border: `2px solid ${statusConfig.color}20`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${statusConfig.color}, ${statusConfig.color}80)`,
        },
      }}
    >
      <CardContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BookIcon sx={{ color: statusConfig.color }} />
              <Typography variant="h6" fontWeight={600}>
                {assignment.manga}
              </Typography>
              <Chip
                label={`Cap. ${assignment.chapter}`}
                size="small"
                sx={{
                  background: `linear-gradient(135deg, ${statusConfig.color}, ${statusConfig.color}80)`,
                  color: 'white',
                  fontWeight: 500,
                }}
              />
            </Box>
            
            <Chip
              icon={statusConfig.icon}
              label={statusConfig.label}
              size="small"
              sx={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.color,
                border: `1px solid ${statusConfig.color}30`,
                mb: 2,
              }}
            />
          </Box>

          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            className="animate-scale-in"
          >
            <MenuItem onClick={() => { onEdit(assignment); handleMenuClose(); }}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Editar</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { onDelete(assignment.id); handleMenuClose(); }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Eliminar</ListItemText>
            </MenuItem>
          </Menu>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Progreso General
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {Math.round(calculateProgress())}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={calculateProgress()}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(148, 163, 184, 0.2)',
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${statusConfig.color}, ${statusConfig.color}80)`,
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Roles Grid */}
        <Grid container spacing={2}>
          {Object.entries(ROLE_CONFIG).map(([roleKey, roleConfig]) => {
            const roleData = assignment[roleKey];
            const isCompleted = roleData?.completed;
            const isOverdueRole = roleData?.fecha && isOverdue(roleData.fecha);
            
            return (
              <Grid item xs={6} sm={3} key={roleKey}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    background: isCompleted 
                      ? `${roleConfig.color}10` 
                      : 'rgba(148, 163, 184, 0.05)',
                    border: `1px solid ${isCompleted ? roleConfig.color : '#94a3b8'}20`,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    {roleConfig.label}
                  </Typography>
                  
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {getAssignedUser(roleData?.userId)}
                    </Typography>
                    
                    {roleData?.fecha && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: '0.75rem', color: isOverdueRole ? '#ef4444' : 'textSecondary' }} />
                        <Typography 
                          variant="caption" 
                          color={isOverdueRole ? 'error' : 'textSecondary'}
                          sx={{ fontWeight: isOverdueRole ? 600 : 400 }}
                        >
                          {new Date(roleData.fecha).toLocaleDateString('es-ES')}
                        </Typography>
                      </Box>
                    )}
                    
                    {isCompleted && (
                      <Chip
                        size="small"
                        label="Completado"
                        sx={{
                          height: 20,
                          fontSize: '0.6rem',
                          mt: 0.5,
                          backgroundColor: `${roleConfig.color}20`,
                          color: roleConfig.color,
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {/* Additional Info */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <Grid container spacing={2} alignItems="center">
            {assignment.fechaSubida && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PublishIcon sx={{ fontSize: '1rem', color: 'textSecondary' }} />
                  <Typography variant="caption" color="textSecondary">
                    Subida: {new Date(assignment.fechaSubida).toLocaleDateString('es-ES')}
                  </Typography>
                </Box>
              </Grid>
            )}
            
            {assignment.linkCapitulo && (
              <Grid item xs={12} sm={6}>
                <Button
                  size="small"
                  startIcon={<LinkIcon />}
                  href={assignment.linkCapitulo}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textTransform: 'none',
                    color: statusConfig.color,
                    '&:hover': {
                      backgroundColor: `${statusConfig.color}10`,
                    },
                  }}
                >
                  Ver Capítulo
                </Button>
              </Grid>
            )}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

const AssignmentDialog = ({ 
  open, 
  onClose, 
  onSave, 
  assignment = null, 
  users = [],
  isEditing = false 
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
    prioridad: false,
  });

  useEffect(() => {
    if (assignment && isEditing) {
      setFormData({
        ...assignment,
        traductor: assignment.traductor || { userId: '', fecha: null, completed: false },
        proofreading: assignment.proofreading || { userId: '', fecha: null, completed: false },
        type: assignment.type || { userId: '', fecha: null, completed: false },
        cleanRedrawer: assignment.cleanRedrawer || { userId: '', fecha: null, completed: false },
      });
    } else {
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
        prioridad: false,
      });
    }
  }, [assignment, isEditing, open]);

  const handleSubmit = () => {
    onSave(formData);
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
          {isEditing ? 'Editar Asignación' : 'Nueva Asignación'}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {config.icon}
                        {config.label}
                      </Box>
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
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
  );
};

const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock users - en producción esto vendría de tu contexto de autenticación
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

  // Mock data basado en el spreadsheet
  useEffect(() => {
    const mockAssignments = [
      {
        id: '1',
        manga: 'Boku no Oku-san wa Mahou Shoujo Kamoshirenai',
        chapter: '20',
        status: ASSIGNMENT_STATUS.ASIGNADO,
        traductor: { userId: '1', fecha: '2025-04-25', completed: true },
        proofreading: { userId: '3', fecha: '2025-04-25', completed: true },
        type: { userId: '4', fecha: '2025-05-02', completed: false },
        cleanRedrawer: { userId: '6', fecha: '2025-05-02', completed: false },
        prioridad: true,
      },
      {
        id: '2',
        manga: 'Boku no Oku-san wa Mahou Shoujo Kamoshirenai',
        chapter: '21',
        status: ASSIGNMENT_STATUS.ASIGNADO,
        traductor: { userId: '1', fecha: '2025-05-10', completed: false },
        proofreading: { userId: '3', fecha: '2025-05-11', completed: false },
        type: { userId: '4', fecha: null, completed: false },
        cleanRedrawer: { userId: '', fecha: null, completed: false },
      },
      {
        id: '3',
        manga: 'Kiyoubinbou, Jou wo Tateru',
        chapter: '6',
        status: ASSIGNMENT_STATUS.PUBLICADO,
        traductor: { userId: '5', fecha: '2024-05-24', completed: true },
        proofreading: { userId: '3', fecha: '2024-05-25', completed: true },
        type: { userId: '8', fecha: '2024-06-02', completed: true },
        cleanRedrawer: { userId: '8', fecha: '2024-06-08', completed: true },
        fechaSubida: '2024-07-07',
        linkCapitulo: 'https://example.com/chapter6',
      },
    ];
    
    setAssignments(mockAssignments);
    setFilteredAssignments(mockAssignments);
  }, []);

  // Filter assignments
  useEffect(() => {
    let filtered = assignments;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === filterStatus);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(assignment => 
        assignment.manga.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.chapter.includes(searchTerm)
      );
    }
    
    setFilteredAssignments(filtered);
  }, [assignments, filterStatus, searchTerm]);

  const handleSaveAssignment = (assignmentData) => {
    if (editingAssignment) {
      setAssignments(prev => prev.map(a => 
        a.id === editingAssignment.id ? { ...assignmentData, id: editingAssignment.id } : a
      ));
    } else {
      setAssignments(prev => [...prev, { ...assignmentData, id: Date.now().toString() }]);
    }
    
    setDialogOpen(false);
    setEditingAssignment(null);
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setDialogOpen(true);
  };

  const handleDeleteAssignment = (assignmentId) => {
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
  };

  const getStatusCount = (status) => {
    return assignments.filter(a => a.status === status).length;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box className="animate-fade-in" sx={{ mb: 6 }}>
        <Typography 
          variant="h2" 
          component="h1"
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 2,
          }}
        >
          Gestión de Asignaciones
        </Typography>
        <Typography 
          variant="h6" 
          color="textSecondary"
          sx={{ 
            fontWeight: 400,
            opacity: 0.8,
          }}
        >
          Sistema de asignaciones basado en el flujo de trabajo de WhitePearl Translations
        </Typography>
      </Box>

      {/* Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(STATUS_CONFIG).map(([statusKey, config], index) => (
          <Grid item xs={12} sm={6} md={2.4} key={statusKey}>
            <Card 
              className="hover-glow"
              sx={{ 
                cursor: 'pointer',
                animation: `fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`,
                border: filterStatus === statusKey ? `2px solid ${config.color}` : '1px solid rgba(148, 163, 184, 0.1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: config.color,
                },
              }}
              onClick={() => setFilterStatus(filterStatus === statusKey ? 'all' : statusKey)}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: config.bgColor,
                    color: config.color,
                    mb: 2,
                  }}
                >
                  {config.icon}
                </Box>
                <Typography variant="h4" fontWeight={700} color={config.color}>
                  {getStatusCount(statusKey)}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                  {config.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Controls */}
      <Box 
        className="animate-slide-in-left"
        sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 3,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Buscar manga o capítulo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filtrar por estado</InputLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Filtrar por estado"
          >
            <MenuItem value="all">Todos</MenuItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <MenuItem key={key} value={key}>{config.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5b5bf1, #7c3aed)',
            },
          }}
        >
          Nueva Asignación
        </Button>
      </Box>

      {/* Assignments List */}
      <Box className="animate-slide-in-right">
        {filteredAssignments.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <AssignmentIcon sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              {searchTerm || filterStatus !== 'all' ? 'No se encontraron asignaciones' : 'No hay asignaciones todavía'}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {searchTerm || filterStatus !== 'all' ? 'Intenta cambiar los filtros' : 'Crea tu primera asignación para comenzar'}
            </Typography>
          </Card>
        ) : (
          filteredAssignments.map((assignment, index) => (
            <Box
              key={assignment.id}
              sx={{
                animation: `fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`,
              }}
            >
              <AssignmentCard
                assignment={assignment}
                users={users}
                onEdit={handleEditAssignment}
                onDelete={handleDeleteAssignment}
              />
            </Box>
          ))
        )}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5b5bf1, #7c3aed)',
          },
        }}
      >
        <AddIcon />
      </Fab>

      {/* Dialog */}
      <AssignmentDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingAssignment(null);
        }}
        onSave={handleSaveAssignment}
        assignment={editingAssignment}
        users={users}
        isEditing={!!editingAssignment}
      />
    </Container>
  );
};

export default AssignmentManagement;
