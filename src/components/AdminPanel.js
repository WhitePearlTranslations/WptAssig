import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  MenuItem,
  IconButton,
  Avatar,
  Tabs,
  Tab,
  Alert,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  MenuBook as BookIcon,
  PeopleOutline as PeopleIcon,
  SettingsOutlined as SettingsIcon,
  ShieldOutlined as ShieldIcon,
  Block as BlockIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  PersonAddAlt as PersonAddIcon,
  PersonOutline as PersonOutlineIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  SearchRounded as SearchIcon,
  LockOutlined as LockOutlinedIcon,
  ConstructionOutlined as ConstructionIcon,
  FileDownloadOutlined as DownloadIcon,
  FileUploadOutlined as UploadIcon,
} from '@mui/icons-material';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import { PageHeader, Panel, EmptyState } from './ui';
import PressIconButton from './motion/PressIconButton';
import { MANGA_STATUS, ROLE_LABELS } from '../utils/constants';
import { triggerHaptic } from '../hooks/useWebHaptics';
import notify from '../utils/notify';
import { colors, taskColors, radius, rowDivider, withAlpha } from '../theme/tokens';

// Avisos: van al aviso global (con vibración) en vez de a un Snackbar por sección.
const showNotice = ({ open = true, message, severity }) => {
  if (!open || !message) return;
  if (severity === 'success') notify.success(message);
  else if (severity === 'error') notify.error(message);
  else notify.info(message);
};

// Estado de la cuenta: suspendido en ámbar (como en RanobeClub), inactivo y fantasma en humo.
const USER_STATUS = {
  active: { label: 'Activo', color: colors.goodNews },
  inactive: { label: 'Inactivo', color: colors.outline },
  suspended: { label: 'Suspendido', color: colors.attention },
  ghost: { label: 'Fantasma', color: colors.outline },
};

// Roles que se pueden dar desde aquí (administrador solo si ya lo era).
const ASSIGNABLE_ROLES = [ROLES.JEFE_EDITOR, ROLES.JEFE_TRADUCTOR, ROLES.UPLOADER, ROLES.EDITOR, ROLES.TRADUCTOR];

// Tareas que puede llevar una serie (claves propias de las series).
const SERIES_TASKS = [
  { key: 'traduccion', label: 'Traducción', color: taskColors.traduccion },
  { key: 'proofreading', label: 'Proofreading', color: taskColors.proofreading },
  { key: 'limpieza', label: 'Limpieza', color: taskColors.cleanRedrawer },
  { key: 'typesetting', label: 'Typesetting', color: taskColors.type },
];

const PERMISSION_GROUPS = [
  {
    title: 'Asignaciones',
    items: [
      ['canAssignChapters', 'Asignar capítulos', 'Crea capítulos y los asigna a otras personas'],
      ['canEditAssignments', 'Editar asignaciones', 'Modifica asignaciones existentes'],
      ['canDeleteAssignments', 'Eliminar asignaciones', 'Borra asignaciones; no se puede deshacer'],
      ['canReassignTasks', 'Reasignar tareas', 'Pasa tareas de una persona a otra'],
    ],
  },
  {
    title: 'Visibilidad',
    items: [
      ['canViewAllProjects', 'Ver todos los proyectos', 'Ve proyectos de otros equipos y personas'],
      ['canAccessReports', 'Ver reportes', 'Genera y consulta reportes del sistema'],
      ['canViewUserStats', 'Ver estadísticas de personas', 'Ve estadísticas detalladas de otras personas'],
    ],
  },
  {
    title: 'Especiales',
    items: [
      ['canManageUploads', 'Gestionar subidas', 'Lleva el proceso de subida y publicación'],
      ['canManageSeries', 'Gestionar series', 'Crea, edita y elimina series'],
      ['canModerateReviews', 'Moderar revisiones', 'Aprueba o rechaza entregas de otras personas'],
    ],
  },
  {
    title: 'Administración',
    adminOnly: true,
    items: [
      ['canViewSystemLogs', 'Ver registros del sistema', 'Consulta los registros y la actividad del sistema'],
      ['canManageBackups', 'Gestionar copias de seguridad', 'Crea y restaura copias de seguridad'],
    ],
  },
];

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
};

const initials = (name) => (name || '?').substring(0, 2).toUpperCase();

// Etiqueta pequeña: neutra, o con tono (texto en el tono, fondo al 10 %).
const Tag = ({ children, tone }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      height: 22,
      px: 0.875,
      borderRadius: `${radius.md}px`,
      fontSize: '0.6875rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      flexShrink: 0,
      color: tone || colors.onSurfaceVariant,
      backgroundColor: tone ? withAlpha(tone, 0.1) : colors.surfaceHigh,
    }}
  >
    {children}
  </Box>
);

// Control segmentado con recuentos (mismo patrón que Series y Usuarios).
const FilterControl = ({ value, onChange, options, label }) => (
  <Box sx={{ overflowX: 'auto', mx: -0.5, px: 0.5 }}>
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(e, next) => {
        if (next !== null) {
          triggerHaptic('light');
          onChange(next);
        }
      }}
      aria-label={label}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value} sx={{ px: 1.25, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
          {option.label}
          {option.count != null && (
            <Box component="span" sx={{ ml: 0.75, color: colors.outline, fontVariantNumeric: 'tabular-nums' }}>
              {option.count}
            </Box>
          )}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  </Box>
);

const headRowSx = (grid) => ({
  display: { xs: 'none', md: 'grid' },
  gridTemplateColumns: grid,
  gap: 2,
  px: 1,
  pb: 1,
  borderBottom: `1px solid ${rowDivider}`,
  fontSize: '0.75rem',
  fontWeight: 600,
  color: colors.onSurfaceVariant,
});

const rowSx = (grid) => ({
  display: { xs: 'flex', md: 'grid' },
  flexWrap: 'wrap',
  gridTemplateColumns: grid,
  alignItems: 'center',
  gap: { xs: 1, md: 2 },
  px: 1,
  py: 1.25,
  borderRadius: `${radius.md}px`,
  transition: 'background-color 150ms ease-out',
  '&:hover': { backgroundColor: colors.surfaceContainer },
  '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` },
});

// Acción destructiva: neutra en reposo, roja solo al pasar.
const dangerIconSx = {
  color: colors.onSurfaceVariant,
  '&:hover': { color: colors.error, backgroundColor: withAlpha(colors.error, 0.1) },
};

const mutedButtonSx = { color: colors.onSurfaceVariant };

const loadingBlock = (label) => (
  <Box sx={{ py: 6, textAlign: 'center' }}>
    <CircularProgress size={28} aria-label={label} />
  </Box>
);

// Componente reutilizable para diálogos de confirmación
const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', destructive = true }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} sx={mutedButtonSx}>
        Cancelar
      </Button>
      <Button onClick={onConfirm} variant="contained" color={destructive ? 'error' : 'primary'}>
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

// Componente para la gestión de mangas
const MangaManagement = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingManga, setEditingManga] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const setSnackbar = showNotice;
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
          message: 'No se pudieron cargar las series: ' + result.error,
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
        message: 'Falta el título o el autor de la serie',
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
            message: 'Serie actualizada',
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
            message: 'Serie creada',
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
      title: `¿Eliminar "${mangaTitle}"?`,
      message: 'Se borra la serie del catálogo. No se puede deshacer.',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          const { deleteManga } = await import('../services/mangaManagement');
          const result = await deleteManga(mangaId);

          if (result.success) {
            setSnackbar({
              open: true,
              message: 'Serie eliminada',
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

  const term = searchTerm.toLowerCase();
  const searchMatched = mangas.filter(
    (manga) => (manga.title || '').toLowerCase().includes(term) || (manga.author || '').toLowerCase().includes(term)
  );
  const statusOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'paused', label: 'Pausadas' },
    { value: 'hiatus', label: 'En hiato' },
    { value: 'completed', label: 'Completadas' },
    { value: 'cancelled', label: 'Canceladas' },
  ].map((option) => ({
    ...option,
    count: option.value === 'all' ? searchMatched.length : searchMatched.filter((m) => m.status === option.value).length,
  }));
  const visibleMangas = filteredMangas.slice().sort((a, b) => (a.title || '').localeCompare(b.title || '', 'es'));
  const GRID = 'minmax(0, 2.6fr) 110px 90px 100px 80px';

  return (
    <Box>
      <Panel
        title="Series"
        count={visibleMangas.length}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título o autor"
              inputProps={{ 'aria-label': 'Buscar series' }}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: colors.outline, mr: 1, fontSize: 20 }} /> }}
              sx={{ flex: { xs: '1 1 100%', sm: '0 0 260px' } }}
            />
            <Tooltip title="Volver a cargar">
              <span>
                <PressIconButton onClick={loadMangas} disabled={loading} aria-label="Volver a cargar las series">
                  <RefreshIcon sx={{ fontSize: 20 }} />
                </PressIconButton>
              </span>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} disabled={loading}>
              Crear serie
            </Button>
          </Box>
        }
        sx={{ '& > div:first-of-type': { flexWrap: 'wrap' } }}
      >
        <Box sx={{ mb: 1.5 }}>
          <FilterControl value={filterStatus} onChange={setFilterStatus} options={statusOptions} label="Estado de la serie" />
        </Box>

        {loading && mangas.length === 0 ? (
          loadingBlock('Cargando series')
        ) : visibleMangas.length === 0 ? (
          <EmptyState icon={BookIcon} title={searchTerm || filterStatus !== 'all' ? 'Ninguna serie con estos filtros' : 'Todavía no hay series'}>
            {searchTerm || filterStatus !== 'all'
              ? 'Prueba con otro estado o borra la búsqueda.'
              : 'Crea la primera serie y aparecerá aquí y en Series.'}
          </EmptyState>
        ) : (
          <Box role="table" aria-label="Series del catálogo" sx={{ mx: -1 }}>
            <Box role="row" sx={headRowSx(GRID)}>
              <span role="columnheader">Serie</span>
              <span role="columnheader">Estado</span>
              <span role="columnheader">Capítulos</span>
              <span role="columnheader">Drive</span>
              <span role="columnheader" style={{ textAlign: 'right' }}>Acciones</span>
            </Box>
            {visibleMangas.map((manga) => {
              const status = MANGA_STATUS[manga.status] || { label: manga.status || 'Sin estado', color: colors.outline };
              const created = formatDate(manga.createdAt);
              const meta = [
                manga.author,
                manga.isJoint && manga.jointPartner ? `con ${manga.jointPartner}` : null,
                created ? `creada ${created}` : null,
              ].filter(Boolean);
              return (
                <Box key={manga.id} role="row" sx={rowSx(GRID)}>
                  <Box role="cell" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: { xs: '1 1 100%', md: 'initial' } }}>
                    {manga.coverImage ? (
                      <Box
                        component="img"
                        src={manga.coverImage}
                        alt=""
                        loading="lazy"
                        sx={{ width: 34, height: 48, objectFit: 'cover', borderRadius: `${radius.sm}px`, flexShrink: 0, backgroundColor: colors.surfaceHigh }}
                      />
                    ) : (
                      <Box
                        aria-hidden="true"
                        sx={{
                          width: 34,
                          height: 48,
                          borderRadius: `${radius.sm}px`,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.surfaceHigh,
                        }}
                      >
                        <BookIcon sx={{ fontSize: 18, color: colors.outline }} />
                      </Box>
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.onSurface, minWidth: 0 }}>
                          {manga.title}
                        </Typography>
                        {manga.isJoint && <Tag>Joint</Tag>}
                      </Box>
                      {meta.length > 0 && (
                        <Typography noWrap sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, mt: 0.25 }}>
                          {meta.join(' · ')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box role="cell">
                    <Tag tone={status.color}>{status.label}</Tag>
                  </Box>
                  <Box role="cell">
                    <Typography component="span" sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                      {manga.publishedChapters || 0}
                      <Box component="span" sx={{ display: { md: 'none' } }}> capítulos</Box>
                    </Typography>
                  </Box>
                  <Box role="cell">
                    {manga.driveLink ? (
                      <Button
                        size="small"
                        component="a"
                        href={manga.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                        aria-label={`Abrir la carpeta de Drive de ${manga.title}`}
                        sx={{ ...mutedButtonSx, minHeight: 32, px: 1 }}
                      >
                        Drive
                      </Button>
                    ) : (
                      <Typography component="span" sx={{ fontSize: '0.8125rem', color: colors.outline }}>
                        Sin Drive
                      </Typography>
                    )}
                  </Box>
                  <Box role="cell" sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end', ml: { xs: 'auto', md: 0 } }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleEditManga(manga)} aria-label={`Editar ${manga.title}`}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteManga(manga.id, manga.title)}
                        aria-label={`Eliminar ${manga.title}`}
                        sx={dangerIconSx}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Panel>

      {/* Dialog para crear/editar serie */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle>{editingManga ? 'Editar serie' : 'Crear serie'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                required
                label="Título"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Autor"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                minRows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="De qué trata la serie, en dos o tres frases"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Estado"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                helperText="Los capítulos se añaden según se publican"
              >
                {['active', 'paused', 'hiatus', 'completed', 'cancelled'].map((key) => (
                  <MenuItem key={key} value={key}>
                    {MANGA_STATUS[key].label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Portada (URL)"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://…/portada.jpg"
                helperText="Opcional. Enlace directo a la imagen"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Carpeta de Google Drive"
                value={formData.driveLink}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/…"
                helperText="Donde se guardan los archivos de la serie"
              />
            </Grid>

            {/* Proyecto conjunto */}
            <Grid item xs={12}>
              <Box sx={{ mt: 1, pt: 2, borderTop: `1px solid ${rowDivider}` }}>
                <FormControlLabel
                  sx={{ m: 0, width: '100%', justifyContent: 'space-between', gap: 2 }}
                  labelPlacement="start"
                  control={
                    <Switch checked={formData.isJoint} onChange={(e) => setFormData({ ...formData, isJoint: e.target.checked })} />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontSize: '0.875rem', color: colors.onSurface }}>Proyecto conjunto (joint)</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
                        Se traduce junto a otro grupo
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>

            {formData.isJoint && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Grupo con el que colaboramos"
                    value={formData.jointPartner}
                    onChange={(e) => setFormData({ ...formData, jointPartner: e.target.value })}
                    placeholder="Nombre del grupo"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography id="series-tasks-label" sx={{ fontSize: '0.875rem', color: colors.onSurface }}>
                    Tareas de este proyecto
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, mb: 0.5 }}>
                    Marca solo las que hace este grupo. Por defecto, una serie lleva las cuatro.
                  </Typography>
                  <Box role="group" aria-labelledby="series-tasks-label" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    {SERIES_TASKS.map((task) => (
                      <FormControlLabel
                        key={task.key}
                        control={
                          <Checkbox
                            checked={formData.availableTasks.includes(task.key)}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                availableTasks: e.target.checked
                                  ? [...formData.availableTasks, task.key]
                                  : formData.availableTasks.filter((t) => t !== task.key),
                              })
                            }
                          />
                        }
                        label={
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>
                            <Box component="span" aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: task.color }} />
                            {task.label}
                          </Box>
                        }
                      />
                    ))}
                  </Box>
                  {formData.availableTasks.length === 0 && (
                    <Typography role="alert" sx={{ fontSize: '0.75rem', color: colors.error, mt: 0.5 }}>
                      Elige al menos una tarea.
                    </Typography>
                  )}
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={mutedButtonSx}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveManga} disabled={loading}>
            {editingManga ? 'Guardar cambios' : 'Crear serie'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        destructive={confirmDialog.destructive !== false}
      />
    </Box>
  );
};

// Componente para la gestión del staff
const StaffManagement = () => {
  const { currentUser } = useAuth();
  const [staff, setStaff] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ghostDialogOpen, setGhostDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [permissionsDialog, setPermissionsDialog] = useState({ open: false, user: null });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [loading, setLoading] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const setSnackbar = showNotice;
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

  const getRoleDisplayName = (role) => ROLE_LABELS[role] || role;

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
          message: 'Cuenta creada. Le llegará un correo para configurar la contraseña.',
          severity: 'success'
        });

        handleCloseDialog();
        loadUsers(); // Recargar la lista de usuarios
      } else {
        setSnackbar({
          open: true,
          message: 'No se pudo crear la cuenta: ' + result.error,
          severity: 'error'
        });
      }
    } catch (error) {
      // Error inesperado creando usuario
      setSnackbar({
        open: true,
        message: 'Error inesperado: ' + error.message,
        severity: 'error'
      });
    }
    setLoading(false);
  };

  const handleDeleteStaff = async (staffId) => {
    setConfirmDialog({
      open: true,
      title: '¿Eliminar a esta persona?',
      message: 'Se borra su cuenta del sistema. No se puede deshacer.',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          const { deleteUser } = await import('../services/userManagement');
          const result = await deleteUser(staffId);

          if (result.success) {
            setSnackbar({ message: 'Persona eliminada', severity: 'success' });
            loadUsers(); // Recargar la lista
          } else {
            setSnackbar({ message: 'No se pudo eliminar: ' + (result.error || 'error desconocido'), severity: 'error' });
          }
        } catch (error) {
          setSnackbar({ message: 'Error inesperado al eliminar: ' + error.message, severity: 'error' });
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
        setSnackbar({ message: 'Cambios guardados', severity: 'success' });
        setEditDialog({ open: false, user: null });
        loadUsers(); // Recargar la lista
      } else {
        setSnackbar({ message: 'No se pudieron guardar los cambios: ' + (result.error || 'error desconocido'), severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ message: 'Error inesperado al guardar: ' + error.message, severity: 'error' });
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
        setSnackbar({ message: 'Usuario fantasma creado', severity: 'success' });
        handleCloseGhostDialog();
        loadUsers(); // Recargar la lista
      } else {
        setSnackbar({ message: 'No se pudo crear: ' + (result.error || 'error desconocido'), severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ message: 'Error inesperado al crear: ' + error.message, severity: 'error' });
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

  const handleOpenPermissions = async (user) => {
    setPermissionsDialog({ open: true, user });

    try {
      // Cargar permisos efectivos del usuario
      const { getEffectiveUserPermissions, DEFAULT_PERMISSIONS } = await import('../services/permissionsService');
      const userId = user.uid || user.id;
      const userRole = user.role;

      const effectivePermissions = await getEffectiveUserPermissions(userId, userRole);
      const defaultPermissions = DEFAULT_PERMISSIONS[userRole] || DEFAULT_PERMISSIONS.traductor;

      // Establecer los permisos en el estado
      setPermissionsData({
        // Permisos de asignaciones
        canAssignChapters: effectivePermissions.canAssignChapters || false,
        canEditAssignments: effectivePermissions.canEditAssignments || false,
        canDeleteAssignments: effectivePermissions.canDeleteAssignments || false,
        canReassignTasks: effectivePermissions.canReassignTasks || false,

        // Permisos de visualización
        canViewAllProjects: effectivePermissions.canViewAllProjects || false,
        canAccessReports: effectivePermissions.canAccessReports || false,
        canViewUserStats: effectivePermissions.canViewUserStats || false,

        // Permisos especiales
        canManageUploads: effectivePermissions.canManageUploads || false,
        canManageSeries: effectivePermissions.canManageSeries || false,
        canModerateReviews: effectivePermissions.canModerateReviews || false,

        // Permisos administrativos (solo para admins)
        canViewSystemLogs: effectivePermissions.canViewSystemLogs || false,
        canManageBackups: effectivePermissions.canManageBackups || false,

        // Metadata
        _hasCustomPermissions: effectivePermissions._hasCustomPermissions,
        _defaultPermissions: defaultPermissions
      });
    } catch (error) {
      console.error('Error cargando permisos del usuario:', error);
      // Fallback: usar permisos básicos
      setPermissionsData({
        canAssignChapters: false,
        canEditAssignments: false,
        canDeleteAssignments: false,
        canReassignTasks: false,
        canViewAllProjects: false,
        canAccessReports: false,
        canViewUserStats: false,
        canManageUploads: false,
        canManageSeries: false,
        canModerateReviews: false,
        canViewSystemLogs: false,
        canManageBackups: false
      });
    }
  };

  const handleSavePermissions = async () => {
    if (!permissionsDialog.user) return;

    setLoading(true);
    try {
      const { updateUserPermissions } = await import('../services/permissionsService');
      const userId = permissionsDialog.user.uid || permissionsDialog.user.id;
      const currentUserId = currentUser.uid;

      const result = await updateUserPermissions(userId, permissionsData, currentUserId);

      if (result.success) {
        // Mostrar mensaje de éxito
        setSnackbar({
          open: true,
          message: `Permisos de ${permissionsDialog.user.name} actualizados correctamente`,
          severity: 'success'
        });

        // Cerrar dialog y recargar datos
        setPermissionsDialog({ open: false, user: null });
        loadUsers(); // Recargar la lista de usuarios para mostrar cambios
      } else {
        // Mostrar error
        setSnackbar({
          open: true,
          message: result.message || 'Error actualizando permisos',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error guardando permisos:', error);
      setSnackbar({
        open: true,
        message: 'Error inesperado actualizando permisos',
        severity: 'error'
      });
    }
    setLoading(false);
  };

  const handleResetPermissions = async () => {
    if (!permissionsDialog.user) return;

    setConfirmDialog({
      open: true,
      title: '¿Volver a los permisos de su rol?',
      message: `${permissionsDialog.user.name} perderá sus permisos propios y tendrá solo los de ${getRoleDisplayName(permissionsDialog.user.role)}.`,
      confirmLabel: 'Volver a los de su rol',
      destructive: false,
      onConfirm: async () => {
        setLoading(true);
        try {
          const { deleteUserPermissions } = await import('../services/permissionsService');
          const userId = permissionsDialog.user.uid || permissionsDialog.user.id;
          const currentUserId = currentUser.uid;

          const result = await deleteUserPermissions(userId, currentUserId);

          if (result.success) {
            setSnackbar({
              open: true,
              message: `Permisos personalizados de ${permissionsDialog.user.name} eliminados. Ahora tiene los permisos por defecto.`,
              severity: 'success'
            });

            // Cerrar dialog y recargar datos
            setPermissionsDialog({ open: false, user: null });
            loadUsers();
          } else {
            setSnackbar({
              open: true,
              message: result.message || 'Error eliminando permisos personalizados',
              severity: 'error'
            });
          }
        } catch (error) {
          console.error('Error reseteando permisos:', error);
          setSnackbar({
            open: true,
            message: 'Error inesperado eliminando permisos personalizados',
            severity: 'error'
          });
        }
        setLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  const handleToggleUserAccess = async (userId, currentStatus, userName) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

    setConfirmDialog({
      open: true,
      title: newStatus === 'suspended' ? `¿Suspender a ${userName}?` : `¿Reactivar a ${userName}?`,
      message: newStatus === 'suspended'
        ? 'Se cerrará su sesión y no podrá entrar hasta que se reactive su cuenta.'
        : 'Podrá volver a iniciar sesión y usar el sistema.',
      confirmLabel: newStatus === 'suspended' ? 'Suspender' : 'Reactivar',
      destructive: newStatus === 'suspended',
      onConfirm: async () => {
        setLoading(true);
        try {
          const { updateUserStatus } = await import('../services/userManagement');
          const result = await updateUserStatus(userId, newStatus);

          if (result.success) {
            // Usuario suspendido/reactivado exitosamente
            setSnackbar({
              open: true,
              message: `${result.message}. El cambio ya se aplica en todo el sistema.`,
              severity: 'success'
            });
            loadUsers(); // Recargar la lista
          } else {
            // Error actualizando estado
            setSnackbar({
              open: true,
              message: result.error || 'No se pudo cambiar el estado',
              severity: 'error'
            });
          }
        } catch (error) {
          console.error('Error inesperado actualizando estado del usuario:', error);
          setSnackbar({
            open: true,
            message: `Error inesperado al cambiar el estado: ${error.message}`,
            severity: 'error'
          });
        }
        setLoading(false);
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  const isGhostMember = (member) => member.isGhost || member.status === 'ghost';
  const statusOf = (member) => (isGhostMember(member) ? USER_STATUS.ghost : USER_STATUS[member.status]) || {
    label: member.status || 'Sin estado',
    color: colors.outline,
  };

  const term = searchTerm.trim().toLowerCase();
  const searched = staff.filter(
    (member) =>
      (!term || (member.name || '').toLowerCase().includes(term) || (member.email || '').toLowerCase().includes(term)) &&
      (roleFilter === 'all' || member.role === roleFilter)
  );
  const STAFF_FILTERS = [
    { value: 'all', label: 'Todas', test: () => true },
    { value: 'active', label: 'Activas', test: (m) => m.status === 'active' },
    { value: 'inactive', label: 'Inactivas', test: (m) => m.status === 'inactive' },
    { value: 'suspended', label: 'Suspendidas', test: (m) => m.status === 'suspended' },
    { value: 'ghost', label: 'Fantasma', test: isGhostMember },
  ];
  const activeFilter = STAFF_FILTERS.find((f) => f.value === statusFilter) || STAFF_FILTERS[0];
  const filteredStaff = searched
    .filter(activeFilter.test)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
  const hasFilters = Boolean(term) || roleFilter !== 'all' || statusFilter !== 'all';
  const showAdminPermissions =
    permissionsDialog.user?.role === 'admin' || currentUser?.uid === '7HIHfawVZtYBnUgIsvuspXY9DCw1';
  const GRID = 'minmax(0, 2.2fr) minmax(0, 1fr) 100px 110px 120px 148px';

  return (
    <Box>
      <Panel
        title="Personal"
        count={filteredStaff.length}
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setGhostDialogOpen(true)}>
              Usuario fantasma
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Añadir persona
            </Button>
          </Box>
        }
        sx={{ '& > div:first-of-type': { flexWrap: 'wrap' } }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1.5 }}>
          <TextField
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o email"
            inputProps={{ 'aria-label': 'Buscar personas' }}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: colors.outline, mr: 1, fontSize: 20 }} /> }}
            sx={{ flex: { xs: '1 1 100%', sm: '0 1 280px' } }}
          />
          <TextField
            select
            size="small"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            inputProps={{ 'aria-label': 'Rol' }}
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 200px' } }}
          >
            <MenuItem value="all">Todos los roles</MenuItem>
            {[ROLES.ADMIN, ...ASSIGNABLE_ROLES].map((role) => (
              <MenuItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </MenuItem>
            ))}
          </TextField>
          <Tooltip title="Volver a cargar">
            <span>
              <PressIconButton onClick={loadUsers} disabled={loading} aria-label="Volver a cargar el personal">
                <RefreshIcon sx={{ fontSize: 20 }} />
              </PressIconButton>
            </span>
          </Tooltip>
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <FilterControl
            value={statusFilter}
            onChange={setStatusFilter}
            label="Estado de la cuenta"
            options={STAFF_FILTERS.map((f) => ({ ...f, count: searched.filter(f.test).length }))}
          />
        </Box>

        {loading && staff.length === 0 ? (
          loadingBlock('Cargando el personal')
        ) : filteredStaff.length === 0 ? (
          <EmptyState icon={PersonOutlineIcon} title={hasFilters ? 'Nadie con estos filtros' : 'Todavía no hay personal'}>
            {hasFilters ? 'Prueba con otro estado o rol, o borra la búsqueda.' : 'Añade la primera persona del equipo.'}
          </EmptyState>
        ) : (
          <Box role="table" aria-label="Personal del equipo" sx={{ mx: -1 }}>
            <Box role="row" sx={headRowSx(GRID)}>
              <span role="columnheader">Persona</span>
              <span role="columnheader">Rol</span>
              <span role="columnheader">Estado</span>
              <span role="columnheader">Alta</span>
              <span role="columnheader">Última actividad</span>
              <span role="columnheader" style={{ textAlign: 'right' }}>Acciones</span>
            </Box>
            {filteredStaff.map((member) => {
              const memberId = member.uid || member.id;
              const status = statusOf(member);
              const isActive = member.status === 'active';
              return (
                <Box key={memberId} role="row" sx={rowSx(GRID)}>
                  <Box role="cell" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: { xs: '1 1 100%', md: 'initial' } }}>
                    <Avatar
                      src={member.profileImage || undefined}
                      alt=""
                      sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, opacity: isGhostMember(member) ? 0.6 : 1 }}
                    >
                      {!member.profileImage && initials(member.name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.onSurface }}>
                        {member.name || 'Sin nombre'}
                      </Typography>
                      <Typography noWrap sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
                        {member.email || 'Sin email'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box role="cell">
                    <Tag tone={member.role === ROLES.ADMIN ? colors.primary : undefined}>{getRoleDisplayName(member.role)}</Tag>
                  </Box>
                  <Box role="cell">
                    <Tag tone={status.color}>{status.label}</Tag>
                  </Box>
                  <Box role="cell" sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Typography component="span" sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant }}>
                      {formatDate(member.createdAt) || '—'}
                    </Typography>
                  </Box>
                  <Box role="cell" sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Typography component="span" sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant }}>
                      {formatDate(member.lastActive) || '—'}
                    </Typography>
                  </Box>
                  <Box role="cell" sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end', ml: { xs: 'auto', md: 0 } }}>
                    <Tooltip title="Permisos">
                      <IconButton size="small" onClick={() => handleOpenPermissions(member)} aria-label={`Permisos de ${member.name}`}>
                        <ShieldIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={isActive ? 'Suspender acceso' : 'Reactivar acceso'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleUserAccess(memberId, member.status, member.name)}
                        aria-label={`${isActive ? 'Suspender' : 'Reactivar'} el acceso de ${member.name}`}
                      >
                        {isActive ? <BlockIcon sx={{ fontSize: 18 }} /> : <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleEditRole(member)} aria-label={`Editar a ${member.name}`}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteStaff(memberId)}
                        aria-label={`Eliminar a ${member.name}`}
                        sx={dangerIconSx}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Panel>

      {/* Dialog para añadir una persona */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Añadir persona</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              required
              label="Nombre"
              autoComplete="off"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth
              required
              label="Email"
              type="email"
              autoComplete="off"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              fullWidth
              required
              label="Contraseña temporal"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="La cambiará en su primer inicio de sesión"
            />
            <TextField
              select
              fullWidth
              label="Rol"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={mutedButtonSx}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveStaff}
            disabled={loading || !formData.name || !formData.email || !formData.password}
          >
            {loading ? 'Creando la cuenta…' : 'Crear cuenta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de permisos */}
      <Dialog
        open={permissionsDialog.open}
        onClose={() => setPermissionsDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Permisos de {permissionsDialog.user?.name}</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, mb: 2 }}>
            {getRoleDisplayName(permissionsDialog.user?.role)}.{' '}
            {permissionsData._hasCustomPermissions
              ? 'Tiene permisos propios que sustituyen a los de su rol.'
              : 'Usa los permisos de su rol. Lo que cambies aquí solo se aplica a esta persona.'}
          </Typography>
          {PERMISSION_GROUPS.filter((group) => !group.adminOnly || showAdminPermissions).map((group) => (
            <Box key={group.title} component="fieldset" sx={{ border: 0, p: 0, m: 0, mb: 2, minWidth: 0 }}>
              <Typography component="legend" variant="subtitle2" sx={{ color: colors.onSurface, mb: 0.5, p: 0 }}>
                {group.title}
              </Typography>
              {group.items.map(([key, label, hint]) => (
                <Box
                  key={key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    py: 1,
                    '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      id={`perm-${key}`}
                      sx={{ fontSize: '0.875rem', color: colors.onSurface, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                    >
                      {label}
                      {permissionsData._defaultPermissions?.[key] && <Tag>De su rol</Tag>}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>{hint}</Typography>
                  </Box>
                  <Switch
                    checked={Boolean(permissionsData[key])}
                    onChange={(e) => setPermissionsData({ ...permissionsData, [key]: e.target.checked })}
                    inputProps={{ 'aria-labelledby': `perm-${key}` }}
                  />
                </Box>
              ))}
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            {permissionsData._hasCustomPermissions && (
              <Button onClick={handleResetPermissions} startIcon={<RefreshIcon />} sx={mutedButtonSx}>
                Volver a los de su rol
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setPermissionsDialog({ open: false, user: null })} sx={mutedButtonSx}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSavePermissions} disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar permisos'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar a una persona */}
      <Dialog open={editDialog.open} onClose={handleCloseEditDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Editar a {editDialog.user?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              required
              label="Nombre"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            />
            <TextField fullWidth label="Email" value={editFormData.email} disabled helperText="El email no se puede cambiar" />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                fullWidth
                required
                label="Rol"
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              >
                {ASSIGNABLE_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </MenuItem>
                ))}
                {/* Solo se puede mantener el rol de administrador, no darlo */}
                {editDialog.user?.role === ROLES.ADMIN && <MenuItem value={ROLES.ADMIN}>{ROLE_LABELS[ROLES.ADMIN]}</MenuItem>}
              </TextField>
              <TextField
                select
                fullWidth
                label="Estado"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                {['active', 'inactive', 'suspended'].map((key) => (
                  <MenuItem key={key} value={key}>
                    {USER_STATUS[key].label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
              La foto de perfil la cambia cada persona desde su perfil; desde aquí no se puede tocar.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} sx={mutedButtonSx}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveEditUser} disabled={loading || !editFormData.name || !editFormData.role}>
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear un usuario fantasma */}
      <Dialog open={ghostDialogOpen} onClose={handleCloseGhostDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Crear usuario fantasma</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, mb: 2 }}>
            Guarda el crédito de alguien que trabajó antes de que existiera este sistema. No puede iniciar sesión.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              required
              label="Nombre"
              value={ghostFormData.name}
              onChange={(e) => setGhostFormData({ ...ghostFormData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={ghostFormData.email}
              onChange={(e) => setGhostFormData({ ...ghostFormData, email: e.target.value })}
              helperText="Opcional, si se conoce"
            />
            <TextField
              select
              fullWidth
              label="Rol que tenía"
              value={ghostFormData.role}
              onChange={(e) => setGhostFormData({ ...ghostFormData, role: e.target.value })}
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGhostDialog} sx={mutedButtonSx}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveGhostUser} disabled={loading || !ghostFormData.name}>
            {loading ? 'Creando…' : 'Crear fantasma'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        destructive={confirmDialog.destructive !== false}
      />
    </Box>
  );
};

// Componente para la configuración del sistema
const SystemConfiguration = () => {
  const { userProfile } = useAuth();
  const [currentSection, setCurrentSection] = useState('general');
  const [configurations, setConfigurations] = useState({
    general: {},
    firebase: {},
    apis: {},
    security: {},
    metadata: {}
  });
  const [loading, setLoading] = useState(false);
  const setSnackbar = showNotice;
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);

  // Cargar configuraciones al inicializar
  useEffect(() => {
    loadConfigurations();
  }, []);

  // Detectar cambios de URL en tiempo real (para SPAs con routing)
  useEffect(() => {
    const checkUrlChange = async () => {
      if (configurations.general?.baseUrl && window.location.origin !== configurations.general.baseUrl) {
        const currentUrl = window.location.origin;
        // Solo mostrar notificación, no actualizar automáticamente
        // El usuario puede decidir si quiere actualizar
        showNotice({
          open: true,
          message: `La URL base guardada no coincide con la actual (${currentUrl}). Puedes cambiarla en General.`,
          severity: 'info'
        });
      }
    };

    // Verificar cuando se cargan las configuraciones
    if (configurations.general?.baseUrl) {
      checkUrlChange();
    }
  }, [configurations.general?.baseUrl]);

  const loadConfigurations = async () => {
    setLoading(true);
    try {
      const { getSystemConfigurations } = await import('../services/systemConfigService');
      const result = await getSystemConfigurations();

      if (result.success) {
        setConfigurations(result.configurations);
        setUnsavedChanges(false);
        setValidationErrors([]);
        setValidationWarnings([]);

        // Sincronizar información pública automáticamente
        try {
          const { updatePublicSystemInfo } = await import('../services/systemConfigService');
          await updatePublicSystemInfo({
            systemName: result.configurations.general?.systemName || 'WPTAssig',
            systemVersion: result.configurations.general?.systemVersion || '1.1'
          }, userProfile?.uid);
        } catch (error) {
          console.warn('Error sincronizando información pública:', error);
        }

      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error cargando configuraciones: ' + error.message,
        severity: 'error'
      });
    }
    setLoading(false);
  };

  const handleConfigChange = async (section, key, value) => {
    const newConfigurations = {
      ...configurations,
      [section]: {
        ...configurations[section],
        [key]: value
      }
    };

    setConfigurations(newConfigurations);
    setUnsavedChanges(true);

    // Validación en tiempo real (con debounce)
    if (window.validationTimeout) {
      clearTimeout(window.validationTimeout);
    }

    window.validationTimeout = setTimeout(async () => {
      try {
        const { validateConfigurations } = await import('../services/systemConfigService');
        const validation = validateConfigurations(newConfigurations);

        setValidationErrors(validation.errors);
        setValidationWarnings(validation.warnings);
      } catch (error) {
        console.error('Error en validación en tiempo real:', error);
      }
    }, 500); // Esperar 500ms después del último cambio
  };

  const handleSaveConfiguration = async () => {
    // Validar configuraciones antes de guardar
    const { validateConfigurations } = await import('../services/systemConfigService');
    const validation = validateConfigurations(configurations);

    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings);

    if (!validation.isValid) {
      setSnackbar({
        open: true,
        message: `Error de validación: ${validation.errors.join(', ')}`,
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const { saveSystemConfigurations } = await import('../services/systemConfigService');
      const result = await saveSystemConfigurations(configurations, userProfile?.uid);

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Configuración guardada',
          severity: 'success'
        });
        setUnsavedChanges(false);

        // Mostrar advertencias si las hay
        if (validation.warnings.length > 0) {
          setTimeout(() => {
            setSnackbar({
              open: true,
              message: `Advertencias: ${validation.warnings.join(', ')}`,
              severity: 'warning'
            });
          }, 2000);
        }
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error guardando configuraciones: ' + error.message,
        severity: 'error'
      });
    }
    setLoading(false);
  };

  const handleResetToDefaults = () => {
    setConfirmDialog({
      open: true,
      title: '¿Descartar los cambios?',
      message: 'Se vuelve a cargar la configuración guardada y se pierde lo que no hayas guardado.',
      confirmLabel: 'Descartar',
      onConfirm: () => {
        // Resetear configuraciones
        loadConfigurations();
        setUnsavedChanges(false);
        setSnackbar({
          open: true,
          message: 'Cambios descartados',
          severity: 'info'
        });
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  const handleExportConfig = () => {
    const configData = JSON.stringify(configurations, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wpt-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: 'Configuración exportada',
      severity: 'success'
    });
  };

  const handleImportConfig = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedConfig = JSON.parse(e.target.result);

          // Validar configuraciones importadas
          const { validateConfigurations } = await import('../services/systemConfigService');
          const validation = validateConfigurations(importedConfig);

          setConfigurations(importedConfig);
          setUnsavedChanges(true);
          setValidationErrors(validation.errors);
          setValidationWarnings(validation.warnings);

          if (validation.isValid) {
            setSnackbar({
              open: true,
              message: 'Configuración importada. Revísala y guárdala.',
              severity: 'success'
            });
          } else {
            setSnackbar({
              open: true,
              message: `Configuraciones importadas con ${validation.errors.length} errores. Revisa y corrige antes de guardar.`,
              severity: 'warning'
            });
          }
        } catch (error) {
          setSnackbar({
            open: true,
            message: 'Error importando configuraciones: Archivo inválido',
            severity: 'error'
          });
        }
      };
      reader.readAsText(file);
    }
    // Limpiar el input file
    event.target.value = '';
  };

  const CONFIG_SECTIONS = [
    { value: 'general', label: 'General' },
    { value: 'firebase', label: 'Firebase' },
    { value: 'apis', label: 'APIs' },
    { value: 'security', label: 'Seguridad' },
  ];

  // Piezas de formulario (funciones, no componentes: se pintan dentro de este render).
  const sectionTitle = (title, hint) => (
    <Grid item xs={12}>
      <Typography component="h3" variant="subtitle2" sx={{ color: colors.onSurface }}>
        {title}
      </Typography>
      {hint && (
        <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, mt: 0.25 }}>{hint}</Typography>
      )}
    </Grid>
  );

  const field = (section, key, label, helperText, { number = false, type, sm = 6 } = {}) => (
    <Grid item xs={12} sm={sm} key={key}>
      <TextField
        fullWidth
        label={label}
        type={type || (number ? 'number' : 'text')}
        value={configurations[section]?.[key] || ''}
        onChange={(e) => handleConfigChange(section, key, number ? parseInt(e.target.value) : e.target.value)}
        helperText={helperText}
        InputLabelProps={{ shrink: true }}
      />
    </Grid>
  );

  const toggle = (section, key, label, hint) => (
    <Box
      key={key}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        py: 1.25,
        '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography id={`cfg-${section}-${key}`} sx={{ fontSize: '0.875rem', color: colors.onSurface }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>{hint}</Typography>
      </Box>
      <Switch
        checked={Boolean(configurations[section]?.[key])}
        onChange={(e) => handleConfigChange(section, key, e.target.checked)}
        inputProps={{ 'aria-labelledby': `cfg-${section}-${key}` }}
      />
    </Box>
  );

  const renderGeneralSection = () => {
    const maintenance = Boolean(configurations.general?.maintenanceMode);
    return (
      <Grid container spacing={2}>
        {sectionTitle('General', 'Datos del sistema y límites de uso.')}
        {field('general', 'systemName', 'Nombre del sistema', 'El que aparece en la interfaz')}
        {field('general', 'systemVersion', 'Versión', 'Versión actual del sistema')}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="URL base"
            value={configurations.general?.baseUrl || ''}
            onChange={(e) => handleConfigChange('general', 'baseUrl', e.target.value)}
            helperText="Se detecta según el entorno: localhost, wptassig.kyudenzone.com, Firebase Hosting, Vercel o Netlify"
            InputLabelProps={{ shrink: true }}
          />
          {configurations.general?.baseUrl !== window.location.origin && (
            <Button
              size="small"
              onClick={() => handleConfigChange('general', 'baseUrl', window.location.origin)}
              sx={{ ...mutedButtonSx, mt: 0.5 }}
            >
              Usar la URL actual ({window.location.origin})
            </Button>
          )}
        </Grid>
        {field('general', 'supportEmail', 'Email de soporte', 'Contacto para soporte técnico', { type: 'email' })}
        {field('general', 'maxFileSize', 'Tamaño máximo de archivo (MB)', 'Límite para los archivos subidos', { number: true })}
        {field('general', 'maxUsersPerProject', 'Máximo de personas por proyecto', 'Cuántas pueden trabajar en un mismo proyecto', { number: true })}

        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              p: 2,
              borderRadius: `${radius.lg}px`,
              backgroundColor: maintenance ? withAlpha(colors.attention, 0.08) : colors.surfaceContainer,
              transition: 'background-color 200ms ease-out',
            }}
          >
            <ConstructionIcon aria-hidden="true" sx={{ fontSize: 20, mt: 0.25, color: maintenance ? colors.attention : colors.outline }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography id="cfg-general-maintenanceMode" sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.onSurface }}>
                Modo mantenimiento
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant }}>
                {maintenance
                  ? 'Activo: solo la administración puede entrar. El resto del equipo ve la pantalla de mantenimiento.'
                  : 'Al activarlo, solo la administración puede entrar mientras haces cambios.'}
              </Typography>
            </Box>
            <Switch
              checked={maintenance}
              onChange={(e) => handleConfigChange('general', 'maintenanceMode', e.target.checked)}
              inputProps={{ 'aria-labelledby': 'cfg-general-maintenanceMode' }}
            />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box>
            {toggle('general', 'registrationEnabled', 'Permitir el registro', 'Que personas nuevas puedan crearse una cuenta')}
          </Box>
        </Grid>
      </Grid>
    );
  };

  const renderFirebaseSection = () => (
    <Grid container spacing={2}>
      {sectionTitle('Firebase', 'Conexión con la base de datos y copias de seguridad.')}
      {field('firebase', 'workerUrl', 'URL del Cloudflare Worker', 'Worker que entrega la configuración de Firebase', { sm: 12 })}
      {field('firebase', 'databaseRulesVersion', 'Versión de reglas de la base de datos', 'Reglas de Realtime Database')}
      {field('firebase', 'storageRulesVersion', 'Versión de reglas de Storage', 'Reglas de Firebase Storage')}
      <Grid item xs={12} sm={6}>
        <TextField
          select
          fullWidth
          label="Frecuencia de copia de seguridad"
          value={configurations.firebase?.backupFrequency || ''}
          onChange={(e) => handleConfigChange('firebase', 'backupFrequency', e.target.value)}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="hourly">Cada hora</MenuItem>
          <MenuItem value="daily">Diaria</MenuItem>
          <MenuItem value="weekly">Semanal</MenuItem>
          <MenuItem value="monthly">Mensual</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12}>
        <Box>
          {toggle('firebase', 'enableRealtimeSync', 'Sincronización en tiempo real', 'Los datos se actualizan solos en todas las pantallas')}
        </Box>
      </Grid>
    </Grid>
  );

  const renderApisSection = () => (
    <Grid container spacing={2}>
      {sectionTitle('ImageKit', 'Optimización y almacenamiento de imágenes.')}
      <Grid item xs={12}>
        <Box>{toggle('apis', 'imagekitEnabled', 'Usar ImageKit', 'Las imágenes se optimizan y guardan en ImageKit')}</Box>
      </Grid>
      {configurations.apis?.imagekitEnabled && (
        <>
          {field('apis', 'imagekitPublicKey', 'Clave pública de ImageKit', 'Clave pública, no la privada')}
          {field('apis', 'imagekitEndpoint', 'Endpoint de ImageKit', 'URL del endpoint')}
        </>
      )}
      <Grid item xs={12}>
        <Box sx={{ pt: 2, mt: 1, borderTop: `1px solid ${rowDivider}` }} />
      </Grid>
      {sectionTitle('Otros servicios')}
      <Grid item xs={12}>
        <Box>
          {toggle('apis', 'googleDriveEnabled', 'Google Drive', 'Integración con las carpetas de Drive')}
          {toggle('apis', 'cloudflareWorkerEnabled', 'Cloudflare Worker', 'Servicios que pasan por el worker de Cloudflare')}
        </Box>
      </Grid>
      {field('apis', 'notificationEmail', 'Email para notificaciones', 'A dónde llegan los avisos del sistema', { type: 'email', sm: 12 })}
    </Grid>
  );

  const renderSecuritySection = () => (
    <Grid container spacing={2}>
      {sectionTitle('Seguridad', 'Estos cambios afectan a todas las personas del sistema.')}
      {field('security', 'sessionTimeout', 'Cierre de sesión por inactividad (horas)', 'Tiempo sin actividad antes de cerrar la sesión', { number: true })}
      {field('security', 'passwordMinLength', 'Longitud mínima de contraseña', 'Caracteres mínimos', { number: true })}
      {field('security', 'maxLoginAttempts', 'Intentos de inicio de sesión', 'Fallos antes de bloquear la cuenta', { number: true })}
      {field('security', 'lockoutDuration', 'Duración del bloqueo (minutos)', 'Cuánto dura bloqueada una cuenta', { number: true })}
      <Grid item xs={12}>
        <Typography id="cfg-password-rules" sx={{ fontSize: '0.875rem', color: colors.onSurface, mt: 1 }}>
          La contraseña debe llevar
        </Typography>
        <Box role="group" aria-labelledby="cfg-password-rules" sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 3 }}>
          {[
            ['requireUppercase', 'Mayúsculas'],
            ['requireNumbers', 'Números'],
            ['requireSpecialChars', 'Caracteres especiales'],
          ].map(([key, label]) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={Boolean(configurations.security?.[key])}
                  onChange={(e) => handleConfigChange('security', key, e.target.checked)}
                />
              }
              label={<Typography sx={{ fontSize: '0.875rem' }}>{label}</Typography>}
            />
          ))}
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Box>
          {toggle('security', 'enableTwoFactor', 'Verificación en dos pasos', 'Pide un segundo factor al entrar. Necesita configuración adicional')}
        </Box>
      </Grid>
    </Grid>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'firebase':
        return renderFirebaseSection();
      case 'apis':
        return renderApisSection();
      case 'security':
        return renderSecuritySection();
      default:
        return renderGeneralSection();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <FilterControl
          value={currentSection}
          onChange={setCurrentSection}
          options={CONFIG_SECTIONS}
          label="Sección de configuración"
        />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" startIcon={<DownloadIcon />} onClick={handleExportConfig} sx={mutedButtonSx}>
            Exportar
          </Button>
          <Button size="small" component="label" startIcon={<UploadIcon />} sx={mutedButtonSx}>
            Importar
            <input type="file" accept=".json" hidden onChange={handleImportConfig} />
          </Button>
        </Box>
      </Box>

      <Panel aria-label="Ajustes">
        {loading && !configurations.general?.systemName ? loadingBlock('Cargando la configuración') : renderCurrentSection()}
      </Panel>

      {(validationErrors.length > 0 || validationWarnings.length > 0) && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {validationErrors.length > 0 && (
            <Alert severity="error">
              <Typography variant="body2" fontWeight={600}>
                Hay que corregir esto antes de guardar
              </Typography>
              <Box component="ul" sx={{ my: 0.5, pl: 2.5 }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </Box>
            </Alert>
          )}
          {validationWarnings.length > 0 && (
            <Alert severity="warning">
              <Typography variant="body2" fontWeight={600}>
                Conviene revisar
              </Typography>
              <Box component="ul" sx={{ my: 0.5, pl: 2.5 }}>
                {validationWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </Box>
            </Alert>
          )}
        </Box>
      )}

      {/* Barra de guardado: flota abajo mientras haya cambios sin guardar */}
      <Box
        sx={{
          position: unsavedChanges ? 'sticky' : 'static',
          bottom: 16,
          zIndex: 2,
          mt: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          gap: 1,
          p: 1.5,
          borderRadius: `${radius.xl}px`,
          backgroundColor: unsavedChanges ? colors.surfaceHighest : 'transparent',
          boxShadow: unsavedChanges ? '0 12px 32px rgba(0, 0, 0, 0.45)' : 'none',
          transition: 'background-color 200ms ease-out, box-shadow 200ms ease-out',
        }}
      >
        {unsavedChanges && (
          <Typography role="status" sx={{ mr: 'auto', display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.8125rem', color: colors.onSurface }}>
            <Box component="span" aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors.attention }} />
            Tienes cambios sin guardar
          </Typography>
        )}
        <Button onClick={handleResetToDefaults} disabled={loading || !unsavedChanges} sx={mutedButtonSx}>
          Descartar cambios
        </Button>
        <Button variant="contained" onClick={handleSaveConfiguration} disabled={loading || !unsavedChanges}>
          {loading ? 'Guardando…' : 'Guardar configuración'}
        </Button>
      </Box>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        destructive={confirmDialog.destructive !== false}
      />
    </Box>
  );
};


// Componente principal del panel de administrador
const ADMIN_TABS = [
  { label: 'Series', icon: BookIcon },
  { label: 'Personal', icon: PeopleIcon },
  { label: 'Configuración', icon: SettingsIcon },
];

const AdminPanel = () => {
  const { isSuperAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);

  // Solo el superusuario puede acceder
  if (!isSuperAdmin()) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', mt: 6 }}>
        <Panel>
          <EmptyState icon={LockOutlinedIcon} title="No tienes acceso a Administración">
            Esta sección es solo para el superadministrador.
          </EmptyState>
        </Panel>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Administración"
        subtitle="Series, personal y configuración del sistema. Lo que cambies aquí afecta a todo el equipo."
      />

      <Tabs
        value={currentTab}
        onChange={(e, value) => {
          triggerHaptic('light');
          setCurrentTab(value);
        }}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Secciones de administración"
        sx={{ mb: 2 }}
      >
        {ADMIN_TABS.map(({ label, icon: Icon }, index) => (
          <Tab
            key={label}
            label={label}
            icon={<Icon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            id={`admin-tab-${index}`}
            aria-controls={`admin-tabpanel-${index}`}
          />
        ))}
      </Tabs>

      <Box role="tabpanel" id={`admin-tabpanel-${currentTab}`} aria-labelledby={`admin-tab-${currentTab}`}>
        {currentTab === 0 && <MangaManagement />}
        {currentTab === 1 && <StaffManagement />}
        {currentTab === 2 && <SystemConfiguration />}
      </Box>
    </Box>
  );
};

export default AdminPanel;
