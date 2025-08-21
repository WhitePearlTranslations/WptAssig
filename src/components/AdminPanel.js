import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  DialogContentText,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Checkbox,
  OutlinedInput,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Book as BookIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AdminPanelSettings as AdminIcon,
  Work as WorkIcon,
  Upload as UploadIcon,
  SupervisorAccount as SupervisorIcon,
  Create as CreateIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  PersonOff as PersonOffIcon,
  GroupWork as GroupWorkIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ErrorOutline as ErrorOutlineIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';

// Componente reutilizable para diálogos de confirmación
const ConfirmDialog = ({ open, onClose, onConfirm, title, message }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente para la gestión de mangas
const MangaManagement = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingManga, setEditingManga] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    status: 'active',
    driveLink: '',
    coverImage: '',
    isJoint: false,
    jointPartner: '',
    availableTasks: ['traduccion', 'proofreading', 'limpieza', 'typesetting']
  });

  // Cargar mangas desde Firebase
  useEffect(() => {
    loadMangas();
  }, []);

  const loadMangas = async () => {
    setLoading(true);
    try {
      const { getAllMangas } = await import('../services/mangaManagement');
      const result = await getAllMangas();
      
      if (result.success) {
        // Filtrar mangas eliminados
        const activeMangas = result.mangas.filter(manga => manga.status !== 'deleted');
        setMangas(activeMangas);
      } else {
        // Error cargando mangas
        setSnackbar({
          open: true,
          message: 'Error cargando mangas: ' + result.error,
          severity: 'error'
        });
      }
    } catch (error) {
      // Error importando servicio
      setSnackbar({
        open: true,
        message: 'Error inesperado al cargar mangas',
        severity: 'error'
      });
    }
    setLoading(false);
  };

  const handleSaveManga = async () => {
    if (!formData.title || !formData.author) {
      setSnackbar({
        open: true,
        message: 'Por favor completa al menos el título y autor del manga',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      if (editingManga) {
        // Actualizar manga existente
        const { updateManga } = await import('../services/mangaManagement');
        const result = await updateManga(editingManga.id, formData);
        
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'Manga actualizado exitosamente',
            severity: 'success'
          });
          handleCloseDialog();
          loadMangas(); // Recargar la lista
        } else {
          setSnackbar({
            open: true,
            message: 'Error: ' + result.error,
            severity: 'error'
          });
        }
      } else {
        // Crear nuevo manga
        const { createManga } = await import('../services/mangaManagement');
        const result = await createManga(formData);
        
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'Manga creado exitosamente',
            severity: 'success'
          });
          handleCloseDialog();
          loadMangas(); // Recargar la lista
        } else {
          setSnackbar({
            open: true,
            message: 'Error: ' + result.error,
            severity: 'error'
          });
        }
      }
    } catch (error) {
      // Error guardando manga
      setSnackbar({
        open: true,
        message: 'Error inesperado al guardar manga',
        severity: 'error'
      });
    }
    setLoading(false);
  };

  const handleEditManga = (manga) => {
    setEditingManga(manga);
    setFormData({
      title: manga.title || '',
      author: manga.author || '',
      description: manga.description || '',
      status: manga.status || 'active',
      driveLink: manga.driveLink || '',
      coverImage: manga.coverImage || '',
      isJoint: manga.isJoint || false,
      jointPartner: manga.jointPartner || '',
      availableTasks: manga.availableTasks || ['traduccion', 'proofreading', 'limpieza', 'typesetting']
    });
    setDialogOpen(true);
  };

  const handleDeleteManga = async (mangaId, mangaTitle) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar "${mangaTitle}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const { deleteManga } = await import('../services/mangaManagement');
          const result = await deleteManga(mangaId);
          
          if (result.success) {
            setSnackbar({
              open: true,
              message: 'Manga eliminado exitosamente',
              severity: 'success'
            });
            loadMangas(); // Recargar la lista
          } else {
            setSnackbar({
              open: true,
              message: 'Error: ' + result.error,
              severity: 'error'
            });
          }
        } catch (error) {
          // Error eliminando manga
          setSnackbar({
            open: true,
            message: 'Error inesperado al eliminar manga',
            severity: 'error'
          });
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  const handleUpdateProgress = async (mangaId, newProgress) => {
    try {
      const { updateMangaProgress } = await import('../services/mangaManagement');
      const result = await updateMangaProgress(mangaId, parseInt(newProgress));
      
      if (result.success) {
        loadMangas(); // Recargar para mostrar cambios
      } else {
        setSnackbar({
          open: true,
          message: 'Error actualizando progreso: ' + result.error,
          severity: 'error'
        });
      }
    } catch (error) {
      // Error actualizando progreso
      setSnackbar({
        open: true,
        message: 'Error inesperado al actualizar progreso',
        severity: 'error'
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingManga(null);
    setFormData({
      title: '',
      author: '',
      description: '',
      status: 'active',
      driveLink: '',
      coverImage: '',
      isJoint: false,
      jointPartner: '',
      availableTasks: ['traduccion', 'proofreading', 'limpieza', 'typesetting']
    });
  };

  // Filtrar mangas basado en búsqueda y estado
  const filteredMangas = mangas.filter(manga => {
    const matchesSearch = manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (manga.author && manga.author.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || manga.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'paused': return 'warning';
      case 'cancelled': return 'error';
      case 'hiatus': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'paused': return 'Pausado';
      case 'cancelled': return 'Cancelado';
      case 'hiatus': return 'Hiato';
      default: return status;
    }
  };

  return (
    <Box>
      {/* Header con controles */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Gestión de Mangas ({filteredMangas.length} mangas)
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          disabled={loading}
          sx={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5b5bf1, #7c3aed)',
            },
          }}
        >
          Crear Manga
        </Button>
      </Box>

      {/* Controles de búsqueda y filtros */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Buscar mangas"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título o autor..."
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrar por estado</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filtrar por estado"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="completed">Completado</MenuItem>
                <MenuItem value="paused">Pausado</MenuItem>
                <MenuItem value="cancelled">Cancelado</MenuItem>
                <MenuItem value="hiatus">Hiato</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={loadMangas}
              disabled={loading}
              size="small"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Tabla de mangas */}
      <TableContainer component={Paper} sx={{ background: 'rgba(15, 15, 25, 0.8)', backdropFilter: 'blur(20px)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Manga</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Progreso</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Drive</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">Cargando mangas...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredMangas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'No se encontraron mangas que coincidan con los filtros' 
                      : 'No hay mangas creados aún'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredMangas.map((manga) => (
                <TableRow key={manga.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        sx={{ bgcolor: 'primary.main' }}
                        src={manga.coverImage || undefined}
                      >
                        {!manga.coverImage && <BookIcon />}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography fontWeight={600}>{manga.title}</Typography>
                          {manga.isJoint && (
                            <Chip
                              label="Joint"
                              size="small"
                              color="secondary"
                              sx={{ 
                                fontSize: '0.7rem', 
                                height: 20,
                                fontWeight: 500 
                              }}
                              icon={<GroupWorkIcon sx={{ fontSize: 12 }} />}
                            />
                          )}
                        </Box>
                        {manga.author && (
                          <Typography variant="body2" color="textSecondary">
                            Por: {manga.author}
                          </Typography>
                        )}
                        {manga.isJoint && manga.jointPartner && (
                          <Typography variant="caption" color="secondary.main" sx={{ fontWeight: 500 }}>
                            Colaboración con: {manga.jointPartner}
                          </Typography>
                        )}
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                          Creado: {manga.createdAt}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(manga.status)}
                      color={getStatusColor(manga.status)}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={500} color="primary.main">
                        {manga.publishedChapters || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        capítulos creados
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {manga.driveLink ? (
                      <Button
                        size="small"
                        href={manga.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<VisibilityIcon />}
                        variant="outlined"
                      >
                        Drive
                      </Button>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No disponible
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Editar Manga">
                        <IconButton 
                          onClick={() => handleEditManga(manga)} 
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar Manga">
                        <IconButton 
                          onClick={() => handleDeleteManga(manga.id, manga.title)} 
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar manga */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingManga ? 'Editar Manga' : 'Crear Nuevo Manga'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Título del Manga *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={!formData.title}
                helperText={!formData.title ? 'Campo requerido' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Autor *"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                error={!formData.author}
                helperText={!formData.author ? 'Campo requerido' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe brevemente de qué trata el manga..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Estado"
                >
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="paused">Pausado</MenuItem>
                  <MenuItem value="hiatus">En Hiato</MenuItem>
                  <MenuItem value="completed">Completado</MenuItem>
                  <MenuItem value="cancelled">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2">
                  📚 Los capítulos se agregarán dinámicamente conforme se vayan publicando
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Link de Google Drive"
                value={formData.driveLink}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/..."
                helperText="Carpeta donde se almacenan los archivos del manga"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL de la imagen de portada (opcional)"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
                helperText="URL directa de la imagen de portada del manga"
              />
            </Grid>
            
            {/* Sección de configuración Joint */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupWorkIcon color="secondary" />
                Configuración de Proyecto Conjunto
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isJoint}
                    onChange={(e) => setFormData({ ...formData, isJoint: e.target.checked })}
                    color="secondary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={500}>Proyecto en Conjunto (Joint)</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Este manga se traduce en colaboración con otro scan
                    </Typography>
                  </Box>
                }
              />
            </Grid>
            
            {formData.isJoint && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Scan Colaborador"
                  value={formData.jointPartner}
                  onChange={(e) => setFormData({ ...formData, jointPartner: e.target.value })}
                  placeholder="Nombre del scan colaborador"
                  helperText="Nombre del scan con el que colaboramos"
                  InputProps={{
                    startAdornment: <GroupWorkIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                />
              </Grid>
            )}
            
            {formData.isJoint && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>💡 Configuración de Tareas:</strong> Para mangas en conjunto, puedes personalizar qué tareas necesita este proyecto. Por defecto, todos los mangas incluyen las 4 tareas básicas.
                  </Typography>
                </Alert>
                
                <Typography variant="body1" fontWeight={500} sx={{ mb: 2 }}>Tareas Disponibles para este Manga:</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { key: 'traduccion', label: 'Traducción', icon: '📝' },
                    { key: 'proofreading', label: 'Proofreading', icon: '✏️' },
                    { key: 'limpieza', label: 'Limpieza', icon: '🧹' },
                    { key: 'typesetting', label: 'Typesetting', icon: '🎨' }
                  ].map((task) => (
                    <FormControlLabel
                      key={task.key}
                      control={
                        <Checkbox
                          checked={formData.availableTasks.includes(task.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                availableTasks: [...formData.availableTasks, task.key]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                availableTasks: formData.availableTasks.filter(t => t !== task.key)
                              });
                            }
                          }}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '1.2em' }}>{task.icon}</Typography>
                          <Typography variant="body2">{task.label}</Typography>
                        </Box>
                      }
                    />
                  ))}
                </Box>
                
                {formData.availableTasks.length === 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ⚠️ Debes seleccionar al menos una tarea para este manga.
                    </Typography>
                  </Alert>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveManga}>
            {editingManga ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
      
      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Componente para la gestión del staff
const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ghostDialogOpen, setGhostDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [permissionsDialog, setPermissionsDialog] = useState({ open: false, user: null });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [loading, setLoading] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'grid' o 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ROLES.TRADUCTOR,
    password: '',
    status: 'active'
  });
  const [ghostFormData, setGhostFormData] = useState({
    name: '',
    email: '',
    role: ROLES.TRADUCTOR,
    isGhost: true
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: ''
  });
  const [permissionsData, setPermissionsData] = useState({
    canAssignChapters: false,
    canEditAssignments: false,
    canDeleteAssignments: false,
    canViewAllProjects: false,
    canManageUploads: false,
    canAccessReports: false,
    canAccessAdmin: false,
    systemAccess: 'enabled' // 'enabled', 'disabled', 'suspended'
  });

  // Cargar usuarios reales desde Firebase
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { getAllUsers } = await import('../services/userManagement');
      const result = await getAllUsers();
      if (result.success) {
        setStaff(result.users.filter(user => user.status !== 'deleted'));
      } else {
        // Error cargando usuarios
      }
    } catch (error) {
      // Error importando servicio
      // Fallback a datos mock si hay error
      setStaff([
        {
          uid: '1',
          name: 'Ryu 龍',
          email: 'ryu@whitepearl.com',
          role: ROLES.JEFE_TRADUCTOR,
          status: 'active',
          createdAt: '2024-01-10',
          lastActive: '2024-08-09'
        }
      ]);
    }
    setLoading(false);
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      [ROLES.ADMIN]: 'Administrador',
      [ROLES.JEFE_EDITOR]: 'Jefe Editor',
      [ROLES.JEFE_TRADUCTOR]: 'Jefe Traductor',
      [ROLES.UPLOADER]: 'Uploader',
      [ROLES.EDITOR]: 'Editor',
      [ROLES.TRADUCTOR]: 'Traductor'
    };
    return roleNames[role] || role;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return <AdminIcon sx={{ color: '#ef4444' }} />;
      case ROLES.JEFE_EDITOR:
      case ROLES.JEFE_TRADUCTOR:
        return <SupervisorIcon sx={{ color: '#f59e0b' }} />;
      case ROLES.UPLOADER:
        return <UploadIcon sx={{ color: '#8b5cf6' }} />;
      case ROLES.EDITOR:
      case ROLES.TRADUCTOR:
        return <WorkIcon sx={{ color: '#6366f1' }} />;
      default:
        return <AccountCircleIcon />;
    }
  };

  const handleSaveStaff = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setSnackbar({
        open: true,
        message: 'Por favor completa todos los campos requeridos',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      const { createUserAccount } = await import('../services/userManagement');
      const result = await createUserAccount(formData);
      
      if (result.success) {
        // Mostrar mensaje de éxito
        setSnackbar({
          open: true,
          message: '✅ Usuario creado exitosamente. Se ha enviado un correo electrónico para configurar la contraseña.',
          severity: 'success'
        });
        
        handleCloseDialog();
        loadUsers(); // Recargar la lista de usuarios
      } else {
        setSnackbar({
          open: true,
          message: '❌ Error creando usuario: ' + result.error,
          severity: 'error'
        });
      }
    } catch (error) {
      // Error inesperado creando usuario
      setSnackbar({
        open: true,
        message: '❌ Error inesperado: ' + error.message,
        severity: 'error'
      });
    }
    setLoading(false);
  };

  const handleDeleteStaff = async (staffId) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar Eliminación',
      message: '¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          const { deleteUser } = await import('../services/userManagement');
          const result = await deleteUser(staffId);
          
          if (result.success) {
            // Usuario eliminado exitosamente
            loadUsers(); // Recargar la lista
          } else {
            // Error eliminando usuario
          }
        } catch (error) {
          // Error inesperado eliminando usuario
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  const handleEditRole = async (member) => {
    setEditDialog({ open: true, user: member });
    setEditFormData({
      name: member.name || '',
      email: member.email || '',
      role: member.role || ROLES.TRADUCTOR,
      status: member.status || 'active'
    });
  };

  const handleSaveEditUser = async () => {
    if (!editFormData.name || !editFormData.email || !editFormData.role) {
      // Campos requeridos faltantes para actualizar usuario
      return;
    }

    setLoading(true);
    try {
      // Actualizar información básica del usuario
      const { updateUserProfile } = await import('../services/userManagement');
      const userId = editDialog.user.uid || editDialog.user.id;
      
      const updateData = {
        name: editFormData.name,
        role: editFormData.role,
        status: editFormData.status
      };

      const result = await updateUserProfile(userId, updateData);
      
      if (result.success) {
        // Usuario actualizado exitosamente
        setEditDialog({ open: false, user: null });
        loadUsers(); // Recargar la lista
      } else {
        // Error actualizando usuario
      }
    } catch (error) {
      // Error inesperado actualizando usuario
    }
    setLoading(false);
  };

  const handleCloseEditDialog = () => {
    setEditDialog({ open: false, user: null });
    setEditFormData({
      name: '',
      email: '',
      role: '',
      status: ''
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      name: '',
      email: '',
      role: ROLES.TRADUCTOR,
      password: '',
      status: 'active'
    });
  };

  const handleSaveGhostUser = async () => {
    if (!ghostFormData.name) {
      // Nombre requerido para crear usuario fantasma
      return;
    }

    setLoading(true);
    try {
      const { createGhostUser } = await import('../services/userManagement');
      const result = await createGhostUser(ghostFormData);
      
      if (result.success) {
        // Usuario fantasma creado exitosamente
        handleCloseGhostDialog();
        loadUsers(); // Recargar la lista
      } else {
        // Error creando usuario fantasma
      }
    } catch (error) {
      // Error inesperado creando usuario fantasma
    }
    setLoading(false);
  };

  const handleCloseGhostDialog = () => {
    setGhostDialogOpen(false);
    setGhostFormData({
      name: '',
      email: '',
      role: ROLES.TRADUCTOR,
      isGhost: true
    });
  };

  const handleOpenPermissions = (user) => {
    setPermissionsDialog({ open: true, user });
    // Cargar permisos actuales del usuario
    setPermissionsData({
      canAssignChapters: user.permissions?.canAssignChapters || false,
      canEditAssignments: user.permissions?.canEditAssignments || false,
      canDeleteAssignments: user.permissions?.canDeleteAssignments || false,
      canViewAllProjects: user.permissions?.canViewAllProjects || false,
      canManageUploads: user.permissions?.canManageUploads || false,
      canAccessReports: user.permissions?.canAccessReports || false
    });
  };

  const handleSavePermissions = async () => {
    // TODO: Implementar guardar permisos en Firebase
    // Guardando permisos para usuario
    // Funcionalidad de permisos se implementará en la siguiente versión
    setPermissionsDialog({ open: false, user: null });
  };

  const handleToggleUserAccess = async (userId, currentStatus, userName) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const actionText = newStatus === 'suspended' ? 'suspender el acceso' : 'reactivar el acceso';
    const confirmText = newStatus === 'suspended' ? 'suspender' : 'reactivar';

    setConfirmDialog({
      open: true,
      title: `Confirmar ${newStatus === 'suspended' ? 'Suspensión' : 'Reactivación'}`,
      message: `¿Estás seguro de que quieres ${actionText} de "${userName}"? ${newStatus === 'suspended' ? 'El usuario no podrá iniciar sesión hasta que se reactive su cuenta.' : 'El usuario podrá iniciar sesión nuevamente.'}`,
      onConfirm: async () => {
        setLoading(true);
        try {
          const { updateUserStatus } = await import('../services/userManagement');
          const result = await updateUserStatus(userId, newStatus);
          
          if (result.success) {
            // Usuario suspendido/reactivado exitosamente
            loadUsers(); // Recargar la lista
          } else {
            // Error actualizando estado
          }
        } catch (error) {
          // Error inesperado actualizando estado del usuario
          // Fallback: actualizar localmente si no existe el servicio
          setStaff(prevStaff => 
            prevStaff.map(member => 
              (member.uid || member.id) === userId 
                ? { ...member, status: newStatus }
                : member
            )
          );
          // Usuario suspendido/reactivado exitosamente (modo local)
        }
        setLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      case 'ghost': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'suspended': return 'Suspendido';
      case 'ghost': return 'Usuario Fantasma';
      default: return status;
    }
  };

  return (
    <Box>
      {/* Header con controles */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Gestión del Staff ({staff.filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 member.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'all' || member.role === roleFilter;
            const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
          }).length} miembros)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Toggle para cambiar vista */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            aria-label="modo de vista"
            size="small"
          >
            <ToggleButton value="table" aria-label="vista tabla">
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="vista grilla">
              <ViewModuleIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #ec4899, #f472b6)',
              '&:hover': {
                background: 'linear-gradient(135deg, #db2777, #ec4899)',
              },
            }}
          >
            Agregar Staff
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={() => setGhostDialogOpen(true)}
            sx={{
              borderColor: '#6b7280',
              color: '#6b7280',
              '&:hover': {
                borderColor: '#4b5563',
                color: '#4b5563',
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
              },
            }}
          >
            Usuario Fantasma
          </Button>
        </Box>
      </Box>

      {/* Controles de búsqueda y filtros */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Buscar staff"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o email..."
              InputProps={{
                startAdornment: <SecurityIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrar por rol</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Filtrar por rol"
              >
                <MenuItem value="all">Todos los roles</MenuItem>
                <MenuItem value={ROLES.ADMIN}>Administrador</MenuItem>
                <MenuItem value={ROLES.JEFE_EDITOR}>Jefe Editor</MenuItem>
                <MenuItem value={ROLES.JEFE_TRADUCTOR}>Jefe Traductor</MenuItem>
                <MenuItem value={ROLES.UPLOADER}>Uploader</MenuItem>
                <MenuItem value={ROLES.EDITOR}>Editor</MenuItem>
                <MenuItem value={ROLES.TRADUCTOR}>Traductor</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrar por estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filtrar por estado"
              >
                <MenuItem value="all">Todos los estados</MenuItem>
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
                <MenuItem value="suspended">Suspendido</MenuItem>
                <MenuItem value="ghost">Usuarios Fantasma</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={loadUsers}
              disabled={loading}
              size="small"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Filtrar staff basado en criterios de búsqueda */}
      {(() => {
        const filteredStaff = staff.filter(member => {
          const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               member.email.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesRole = roleFilter === 'all' || member.role === roleFilter;
          const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
          return matchesSearch && matchesRole && matchesStatus;
        });

        return (
          <Box>
            {/* Vista de Tabla */}
            {viewMode === 'table' ? (
              <TableContainer component={Paper} sx={{ background: 'rgba(15, 15, 25, 0.8)', backdropFilter: 'blur(20px)' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Cargo</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Registro</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Última Actividad</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="textSecondary">Cargando miembros del staff...</Typography>
                        </TableCell>
                      </TableRow>
                    ) : filteredStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="textSecondary">
                            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                              ? 'No se encontraron miembros que coincidan con los filtros' 
                              : 'No hay miembros del staff registrados'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaff.map((member) => (
                        <TableRow key={member.uid || member.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar 
                                src={member.profileImage} 
                                sx={{ 
                                  bgcolor: 'primary.main',
                                  width: 40,
                                  height: 40
                                }}
                              >
                                {!member.profileImage && getRoleIcon(member.role)}
                              </Avatar>
                              <Box>
                                <Typography fontWeight={600}>{member.name}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {member.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getRoleDisplayName(member.role)}
                              size="small"
                              color={member.role === ROLES.ADMIN ? 'error' : 
                                     member.role === ROLES.JEFE_EDITOR || member.role === ROLES.JEFE_TRADUCTOR ? 'warning' :
                                     member.role === ROLES.UPLOADER ? 'secondary' : 'primary'}
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(member.status)}
                              size="small"
                              color={getStatusColor(member.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {member.createdAt || 'No disponible'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {member.lastActive || 'No disponible'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Configurar Permisos">
                                <IconButton 
                                  color="info" 
                                  onClick={() => handleOpenPermissions(member)}
                                  size="small"
                                >
                                  <SecurityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={member.status === 'active' ? 'Suspender Acceso' : 'Reactivar Acceso'}>
                                <IconButton 
                                  color={member.status === 'active' ? 'warning' : 'success'}
                                  onClick={() => handleToggleUserAccess(member.uid || member.id, member.status, member.name)}
                                  size="small"
                                >
                                  {member.status === 'active' ? <BlockIcon /> : <CheckCircleIcon />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Editar Usuario">
                                <IconButton 
                                  color="primary" 
                                  onClick={() => handleEditRole(member)}
                                  size="small"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar Usuario">
                                <IconButton 
                                  color="error" 
                                  onClick={() => handleDeleteStaff(member.uid || member.id)}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              /* Vista de Grid (original) */
              <Grid container spacing={2}>
                {loading ? (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <Typography color="textSecondary">Cargando miembros del staff...</Typography>
                    </Box>
                  </Grid>
                ) : filteredStaff.length === 0 ? (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <Typography color="textSecondary">
                        {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                          ? 'No se encontraron miembros que coincidan con los filtros' 
                          : 'No hay miembros del staff registrados'}
                      </Typography>
                    </Box>
                  </Grid>
                ) : (
                  filteredStaff.map((member) => (
                    <Grid item xs={12} sm={6} md={4} key={member.uid || member.id}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar 
                              src={member.profileImage}
                              sx={{ 
                                mr: 2, 
                                bgcolor: 'primary.main',
                                width: 56,
                                height: 56
                              }}
                            >
                              {!member.profileImage && getRoleIcon(member.role)}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={600}>
                                {member.name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {member.email}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Tooltip title="Configurar Permisos">
                                <IconButton 
                                  color="info" 
                                  onClick={() => handleOpenPermissions(member)}
                                  size="small"
                                >
                                  <SecurityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={member.status === 'active' ? 'Suspender Acceso' : 'Reactivar Acceso'}>
                                <IconButton 
                                  color={member.status === 'active' ? 'warning' : 'success'}
                                  onClick={() => handleToggleUserAccess(member.uid || member.id, member.status, member.name)}
                                  size="small"
                                >
                                  {member.status === 'active' ? <BlockIcon /> : <CheckCircleIcon />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton 
                                  color="error" 
                                  onClick={() => handleDeleteStaff(member.uid || member.id)}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Chip
                              label={getRoleDisplayName(member.role)}
                              size="small"
                              color={member.role === ROLES.ADMIN ? 'error' : 
                                     member.role === ROLES.JEFE_EDITOR || member.role === ROLES.JEFE_TRADUCTOR ? 'warning' :
                                     member.role === ROLES.UPLOADER ? 'secondary' : 'primary'}
                            />
                            <Chip
                              label={getStatusLabel(member.status)}
                              size="small"
                              color={getStatusColor(member.status)}
                            />
                          </Box>

                          <Box>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Registrado: {member.createdAt || 'No disponible'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Última actividad: {member.lastActive || 'No disponible'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            )}
          </Box>
        );
      })()}

      {/* Dialog para crear staff */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Nuevo Miembro del Staff</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contraseña temporal"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                helperText="El usuario deberá cambiar esta contraseña en su primer inicio de sesión"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Rol"
                >
                  <MenuItem value={ROLES.JEFE_EDITOR}>Jefe Editor</MenuItem>
                  <MenuItem value={ROLES.JEFE_TRADUCTOR}>Jefe Traductor</MenuItem>
                  <MenuItem value={ROLES.UPLOADER}>Uploader</MenuItem>
                  <MenuItem value={ROLES.EDITOR}>Editor</MenuItem>
                  <MenuItem value={ROLES.TRADUCTOR}>Traductor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveStaff}
            disabled={loading || !formData.name || !formData.email || !formData.password}
            sx={{
              background: loading ? 'rgba(0,0,0,0.1)' : 'linear-gradient(135deg, #ec4899, #f472b6)',
              '&:hover': {
                background: loading ? 'rgba(0,0,0,0.1)' : 'linear-gradient(135deg, #db2777, #ec4899)',
              },
            }}
          >
            {loading ? 'Creando Usuario...' : 'Crear Cuenta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de configuración de permisos */}
      <Dialog 
        open={permissionsDialog.open} 
        onClose={() => setPermissionsDialog({ open: false, user: null })} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SecurityIcon color="info" />
          Configurar Permisos - {permissionsDialog.user?.name}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Configure los permisos específicos para <strong>{permissionsDialog.user?.name}</strong> 
              ({getRoleDisplayName(permissionsDialog.user?.role)})
            </Typography>
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldIcon /> Permisos de Asignaciones
              </Typography>
              <Box sx={{ pl: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissionsData.canAssignChapters}
                      onChange={(e) => setPermissionsData({
                        ...permissionsData,
                        canAssignChapters: e.target.checked
                      })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={500}>Asignar Capítulos</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Puede crear y asignar nuevos capítulos a otros usuarios
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissionsData.canEditAssignments}
                      onChange={(e) => setPermissionsData({
                        ...permissionsData,
                        canEditAssignments: e.target.checked
                      })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={500}>Editar Asignaciones</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Puede modificar asignaciones existentes
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissionsData.canDeleteAssignments}
                      onChange={(e) => setPermissionsData({
                        ...permissionsData,
                        canDeleteAssignments: e.target.checked
                      })}
                      color="error"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={500}>Eliminar Asignaciones</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Puede eliminar asignaciones (acción irreversible)
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon /> Permisos de Visualización
              </Typography>
              <Box sx={{ pl: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissionsData.canViewAllProjects}
                      onChange={(e) => setPermissionsData({
                        ...permissionsData,
                        canViewAllProjects: e.target.checked
                      })}
                      color="info"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={500}>Ver Todos los Proyectos</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Puede ver proyectos de otros equipos y usuarios
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissionsData.canAccessReports}
                      onChange={(e) => setPermissionsData({
                        ...permissionsData,
                        canAccessReports: e.target.checked
                      })}
                      color="warning"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={500}>Acceso a Reportes</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Puede generar y ver reportes del sistema
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <UploadIcon /> Permisos Especiales
              </Typography>
              <Box sx={{ pl: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissionsData.canManageUploads}
                      onChange={(e) => setPermissionsData({
                        ...permissionsData,
                        canManageUploads: e.target.checked
                      })}
                      color="secondary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={500}>Gestionar Subidas</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Puede gestionar el proceso de subida y publicación
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setPermissionsDialog({ open: false, user: null })}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSavePermissions}
            startIcon={<SecurityIcon />}
            sx={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669, #047857)',
              },
            }}
          >
            Guardar Permisos
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar usuario */}
      <Dialog open={editDialog.open} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Editar Usuario - {editDialog.user?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre completo"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                error={!editFormData.name}
                helperText={!editFormData.name ? 'Campo requerido' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={editFormData.email}
                disabled
                helperText="El email no se puede modificar"
                InputProps={{
                  style: { backgroundColor: 'rgba(0,0,0,0.05)' }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!editFormData.role}>
                <InputLabel>Rol *</InputLabel>
                <Select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  label="Rol *"
                >
                  <MenuItem value={ROLES.JEFE_EDITOR}>Jefe Editor</MenuItem>
                  <MenuItem value={ROLES.JEFE_TRADUCTOR}>Jefe Traductor</MenuItem>
                  <MenuItem value={ROLES.UPLOADER}>Uploader</MenuItem>
                  <MenuItem value={ROLES.EDITOR}>Editor</MenuItem>
                  <MenuItem value={ROLES.TRADUCTOR}>Traductor</MenuItem>
                  {/* Solo superadmin puede asignar rol de admin */}
                  {editDialog.user?.role === ROLES.ADMIN && (
                    <MenuItem value={ROLES.ADMIN}>Administrador</MenuItem>
                  )}
                </Select>
                {!editFormData.role && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    Campo requerido
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  label="Estado"
                >
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="inactive">Inactivo</MenuItem>
                  <MenuItem value="suspended">Suspendido</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  📸 <strong>Nota sobre la imagen de perfil:</strong> Los usuarios pueden cambiar su propia imagen de perfil desde su página de perfil personal. Los administradores no pueden modificar las imágenes de perfil de otros usuarios por razones de privacidad.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveEditUser}
            disabled={loading || !editFormData.name || !editFormData.role}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear usuario fantasma */}
      <Dialog open={ghostDialogOpen} onClose={handleCloseGhostDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonOffIcon color="secondary" />
          Crear Usuario Fantasma
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              👻 <strong>Los usuarios fantasma</strong> son registros de personas que trabajaron antes de implementar el sistema de autenticación. No pueden iniciar sesión, pero conservan los créditos de su trabajo.
            </Typography>
          </Alert>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre completo *"
                value={ghostFormData.name}
                onChange={(e) => setGhostFormData({ ...ghostFormData, name: e.target.value })}
                error={!ghostFormData.name}
                helperText={!ghostFormData.name ? 'Campo requerido' : 'Nombre del usuario que trabajó anteriormente'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email (opcional)"
                type="email"
                value={ghostFormData.email}
                onChange={(e) => setGhostFormData({ ...ghostFormData, email: e.target.value })}
                helperText="Email del usuario si se conoce"
                placeholder="usuario@ejemplo.com"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rol que desempeñaba</InputLabel>
                <Select
                  value={ghostFormData.role}
                  onChange={(e) => setGhostFormData({ ...ghostFormData, role: e.target.value })}
                  label="Rol que desempeñaba"
                >
                  <MenuItem value={ROLES.JEFE_EDITOR}>Jefe Editor</MenuItem>
                  <MenuItem value={ROLES.JEFE_TRADUCTOR}>Jefe Traductor</MenuItem>
                  <MenuItem value={ROLES.UPLOADER}>Uploader</MenuItem>
                  <MenuItem value={ROLES.EDITOR}>Editor</MenuItem>
                  <MenuItem value={ROLES.TRADUCTOR}>Traductor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  ⚠️ <strong>Nota:</strong> Este usuario no podrá iniciar sesión en el sistema. Solo se usará para mantener el historial de trabajos realizados antes del sistema de autenticación.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGhostDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveGhostUser}
            disabled={loading || !ghostFormData.name}
            sx={{
              background: 'linear-gradient(135deg, #6b7280, #4b5563)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4b5563, #374151)',
              },
            }}
          >
            {loading ? 'Creando...' : 'Crear Usuario Fantasma'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
      
      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Componente principal del panel de administrador
const AdminPanel = () => {
  const { userProfile, isSuperAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);

  // Solo el superusuario puede acceder
  if (!isSuperAdmin()) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error">
          <Typography variant="h6">Acceso Denegado</Typography>
          <Typography>
            No tienes permisos para acceder al panel de administración.
          </Typography>
        </Alert>
      </Container>
    );
  }

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box className="animate-fade-in" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'error.main', width: 48, height: 48 }}>
            <AdminIcon />
          </Avatar>
          <Box>
            <Typography 
              variant="h3" 
              component="h1"
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Panel de Administración
            </Typography>
            <Typography variant="h6" color="textSecondary">
              Gestión completa del sistema WhitePearl Translations
            </Typography>
          </Box>
        </Box>
        
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            ⚠️ Tienes acceso completo al sistema. Usa estos poderes con responsabilidad.
          </Typography>
        </Alert>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<BookIcon />} 
            label="Gestión de Mangas" 
            iconPosition="start"
          />
          <Tab 
            icon={<PeopleIcon />} 
            label="Gestión del Staff" 
            iconPosition="start"
          />
          <Tab 
            icon={<SettingsIcon />} 
            label="Configuración del Sistema" 
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>
        {currentTab === 0 && <MangaManagement />}
        {currentTab === 1 && <StaffManagement />}
        {currentTab === 2 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <SettingsIcon sx={{ fontSize: 64, color: 'textSecondary', mb: 2 }} />
            <Typography variant="h5" color="textSecondary">
              Configuración del Sistema
            </Typography>
            <Typography color="textSecondary">
              Esta sección estará disponible próximamente...
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default AdminPanel;
