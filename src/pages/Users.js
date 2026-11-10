import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Avatar,
  Autocomplete,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Edit,
  PersonOutline,
  SwapHoriz,
  PersonRemove,
  LockOutlined,
  SearchRounded
} from '@mui/icons-material';
import { ref, onValue, set, update, remove, push } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { realtimeDb, auth } from '../services/firebase';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import toast from 'react-hot-toast';
import { PageHeader, Panel, EmptyState, StatusBadge, TaskTypeTag } from '../components/ui';
import { ROLE_LABELS } from '../utils/constants';
import { triggerHaptic } from '../hooks/useWebHaptics';
import { colors, radius, rowDivider, withAlpha } from '../theme/tokens';

const Users = () => {
  const { userProfile, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ROLES.TRADUCTOR,
    password: '',
    active: true,
    isGhost: false
  });

  // Estados para transferencia de asignaciones
  const [transferDialog, setTransferDialog] = useState({
    open: false,
    ghostUser: null,
    targetUser: null,
    assignments: [],
    loading: false
  });

  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({
    open: false,
    ghostUser: null
  });

  // Búsqueda y filtro de la lista
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');

  useEffect(() => {
    // Solo admin y jefes pueden ver usuarios
    if (!hasRole(ROLES.JEFE_EDITOR) && !hasRole(ROLES.JEFE_TRADUCTOR)) {
      return;
    }

    const usersRef = ref(realtimeDb, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = [];
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          // Solo mostrar usuarios que no están eliminados
          if (userData.status !== 'deleted') {
            usersData.push({
              id: childSnapshot.key,
              uid: childSnapshot.key,
              ...userData
            });
          }
        });
        setUsers(usersData);
      } else {
        setUsers([]);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [hasRole]);

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
        setFormData({
          name: user.name,
          email: user.email,
          role: user.role,
          password: '', // No mostrar contraseña existente
          active: user.status === 'active',
          isGhost: user.isGhost || false
        });
    } else {
      setEditingUser(null);
        setFormData({
          name: '',
          email: '',
          role: ROLES.TRADUCTOR,
          password: '',
          active: true,
          isGhost: false
        });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        // Actualizar usuario existente
        const updateData = {
          name: formData.name,
          role: formData.role,
          status: formData.active ? 'active' : 'inactive',
          updatedAt: new Date().toISOString(),
          updatedBy: userProfile.uid,
          isGhost: formData.isGhost
        };

        await update(ref(realtimeDb, `users/${editingUser.uid}`), updateData);
        toast.success('Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        let userId;

        if (formData.isGhost) {
          // Usuario fantasma - no crear cuenta real en Auth
          userId = `ghost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const userData = {
            name: formData.name,
            email: formData.email || 'no-email@ghost.user',
            role: formData.role,
            status: formData.active ? 'active' : 'inactive',
            isGhost: true,
            createdAt: new Date().toISOString(),
            createdBy: userProfile.uid,
            lastActive: 'Usuario Fantasma',
            profileImage: '',
            stats: {
              assignmentsCompleted: 0,
              assignmentsActive: 0
            },
            notes: 'Usuario fantasma creado para dar crédito a trabajo anterior al sistema'
          };

          await set(ref(realtimeDb, `users/${userId}`), userData);
          toast.success('Usuario fantasma creado exitosamente');
        } else {
          // Usuario normal - crear cuenta real
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          );

          const userData = {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            status: formData.active ? 'active' : 'inactive',
            isGhost: false,
            createdAt: new Date().toISOString(),
            createdBy: userProfile.uid,
            lastActive: 'Nunca',
            profileImage: '',
            stats: {
              assignmentsCompleted: 0,
              assignmentsActive: 0
            }
          };

          await set(ref(realtimeDb, `users/${userCredential.user.uid}`), userData);
          toast.success('Usuario creado exitosamente');
        }
      }

      handleCloseDialog();
    } catch (error) {
      //  message removed for production
      if (error.code === 'auth/email-already-in-use') {
        toast.error('El email ya está en uso');
      } else if (error.code === 'auth/weak-password') {
        toast.error('La contraseña debe tener al menos 6 caracteres');
      } else {
        toast.error('Error al guardar el usuario');
      }
    }
  };

  // Función para obtener asignaciones de un usuario fantasma
  const getGhostUserAssignments = async (ghostUserId) => {
    try {
      const assignmentsRef = ref(realtimeDb, 'assignments');
      const snapshot = await new Promise((resolve) => {
        onValue(assignmentsRef, resolve, { onlyOnce: true });
      });

      if (!snapshot.exists()) return [];

      const assignments = [];
      snapshot.forEach((childSnapshot) => {
        const assignment = childSnapshot.val();
        if (assignment.assignedTo === ghostUserId) {
          assignments.push({
            id: childSnapshot.key,
            ...assignment
          });
        }
      });

      return assignments;
    } catch (error) {
      console.error('Error obteniendo asignaciones del usuario fantasma:', error);
      return [];
    }
  };

  // Función para abrir el diálogo de transferencia
  const handleOpenTransferDialog = async (ghostUser) => {
    if (!ghostUser.isGhost) {
      toast.error('Esta función solo está disponible para usuarios fantasma');
      return;
    }

    setTransferDialog({ ...transferDialog, loading: true, open: true, ghostUser });

    try {
      const assignments = await getGhostUserAssignments(ghostUser.uid || ghostUser.id);
      setTransferDialog({
        open: true,
        ghostUser,
        targetUser: null,
        assignments,
        loading: false
      });
    } catch (error) {
      toast.error('Error cargando asignaciones del usuario');
      setTransferDialog({ ...transferDialog, loading: false, open: false });
    }
  };

  // Función para transferir asignaciones
  const handleTransferAssignments = async () => {
    if (!transferDialog.targetUser || !transferDialog.ghostUser) {
      toast.error('Por favor selecciona un usuario destino');
      return;
    }

    if (transferDialog.assignments.length === 0) {
      toast.error('No hay asignaciones para transferir');
      return;
    }

    setTransferDialog({ ...transferDialog, loading: true });

    try {
      const updates = {};
      const targetUserId = transferDialog.targetUser.uid || transferDialog.targetUser.id;
      const targetUserName = transferDialog.targetUser.name;

      // Preparar actualizaciones para todas las asignaciones
      transferDialog.assignments.forEach(assignment => {
        updates[`assignments/${assignment.id}/assignedTo`] = targetUserId;
        updates[`assignments/${assignment.id}/assignedToName`] = targetUserName;
        updates[`assignments/${assignment.id}/transferredFrom`] = transferDialog.ghostUser.name;
        updates[`assignments/${assignment.id}/transferredAt`] = new Date().toISOString();
        updates[`assignments/${assignment.id}/transferredBy`] = userProfile.uid;
      });

      // Actualizar estadísticas del usuario destino
      const completedAssignments = transferDialog.assignments.filter(a =>
        a.status === 'completado' || a.status === 'aprobado' || a.status === 'uploaded'
      ).length;

      const activeAssignments = transferDialog.assignments.filter(a =>
        a.status === 'pendiente' || a.status === 'en_progreso'
      ).length;

      if (completedAssignments > 0) {
        updates[`users/${targetUserId}/stats/assignmentsCompleted`] =
          (transferDialog.targetUser.stats?.assignmentsCompleted || 0) + completedAssignments;
      }

      if (activeAssignments > 0) {
        updates[`users/${targetUserId}/stats/assignmentsActive`] =
          (transferDialog.targetUser.stats?.assignmentsActive || 0) + activeAssignments;
      }

      // Ejecutar todas las actualizaciones
      await update(ref(realtimeDb), updates);

      toast.success(
        `${transferDialog.assignments.length} asignaciones pasadas a ${targetUserName}`
      );

      // Ahora proceder a eliminar el usuario fantasma
      setTransferDialog({ ...transferDialog, open: false, loading: false });
      setConfirmDeleteDialog({ open: true, ghostUser: transferDialog.ghostUser });

    } catch (error) {
      console.error('Error transfiriendo asignaciones:', error);
      toast.error('Error al transferir las asignaciones');
      setTransferDialog({ ...transferDialog, loading: false });
    }
  };

  // Función para eliminar usuario fantasma después de transferir
  const handleDeleteGhostUser = async () => {
    if (!confirmDeleteDialog.ghostUser) return;

    try {
      const ghostUserId = confirmDeleteDialog.ghostUser.uid || confirmDeleteDialog.ghostUser.id;

      // Marcar como eliminado en lugar de eliminar completamente
      await update(ref(realtimeDb, `users/${ghostUserId}`), {
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        deletedBy: userProfile.uid,
        reason: 'Transferencia de asignaciones completada'
      });

      toast.success(`Usuario fantasma "${confirmDeleteDialog.ghostUser.name}" eliminado`);
      setConfirmDeleteDialog({ open: false, ghostUser: null });

    } catch (error) {
      console.error('Error eliminando usuario fantasma:', error);
      toast.error('Error al eliminar el usuario fantasma');
    }
  };

  // Función para cerrar diálogos
  const handleCloseTransferDialog = () => {
    setTransferDialog({
      open: false,
      ghostUser: null,
      targetUser: null,
      assignments: [],
      loading: false
    });
  };

  // Función de eliminación removida - se debe usar el Panel Admin para eliminar usuarios

  const getRoleDisplayName = (role) => {
    return ROLE_LABELS[role] || role;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'suspended': return 'Suspendido';
      case 'deleted': return 'Eliminado';
      case 'ghost': return 'Fantasma';
      default: return status || 'Desconocido';
    }
  };

  const canManageUser = (user) => {
    if (hasRole(ROLES.ADMIN)) return true;

    // Jefe Editor puede manejar editores
    if (hasRole(ROLES.JEFE_EDITOR) && user.role === ROLES.EDITOR) return true;

    // Jefe Traductor puede manejar traductores
    if (hasRole(ROLES.JEFE_TRADUCTOR) && user.role === ROLES.TRADUCTOR) return true;

    return false;
  };

  const getAvailableRoles = () => {
    const roles = [];

    if (hasRole(ROLES.ADMIN)) {
      return Object.values(ROLES);
    }

    if (hasRole(ROLES.JEFE_EDITOR)) {
      roles.push(ROLES.EDITOR);
    }

    if (hasRole(ROLES.JEFE_TRADUCTOR)) {
      roles.push(ROLES.TRADUCTOR);
    }

    return roles;
  };

  // Verificar permisos
  if (!hasRole(ROLES.JEFE_EDITOR) && !hasRole(ROLES.JEFE_TRADUCTOR)) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', mt: 6 }}>
        <Panel>
          <EmptyState icon={LockOutlined} title="No tienes acceso a Usuarios">
            Esta página es para administradores y jefes de equipo.
          </EmptyState>
        </Panel>
      </Box>
    );
  }

  // Estado de la cuenta: suspendido en ámbar (como en RanobeClub), inactivo en humo.
  const USER_STATUS_TONE = {
    active: colors.goodNews,
    inactive: colors.outline,
    suspended: colors.attention,
    deleted: colors.error,
    ghost: colors.outline,
  };

  const USER_FILTERS = [
    { value: 'all', label: 'Todas', test: () => true },
    { value: 'active', label: 'Activas', test: (u) => u.status === 'active' },
    { value: 'inactive', label: 'Inactivas', test: (u) => u.status === 'inactive' },
    { value: 'suspended', label: 'Suspendidas', test: (u) => u.status === 'suspended' },
    { value: 'ghost', label: 'Fantasma', test: (u) => u.isGhost },
  ];

  const term = userSearch.trim().toLowerCase();
  const searched = users.filter(
    (u) => !term || u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
  );
  const activeFilter = USER_FILTERS.find((f) => f.value === userFilter) || USER_FILTERS[0];
  const visibleUsers = searched
    .filter(activeFilter.test)
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));

  const GRID = 'minmax(0, 1.6fr) minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 0.9fr) 150px 80px';

  const renderTag = (children, tone) => (
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
        color: tone || colors.onSurfaceVariant,
        backgroundColor: tone ? withAlpha(tone, 0.1) : colors.surfaceHigh,
      }}
    >
      {children}
    </Box>
  );

  return (
    <Box>
      <PageHeader
        title="Usuarios"
        subtitle={`${users.length} personas · ${users.filter((u) => u.status === 'active').length} activas${
          users.filter((u) => u.status === 'suspended').length > 0
            ? ` · ${users.filter((u) => u.status === 'suspended').length} suspendidas`
            : ''
        }`}
      />

      <Panel
        title="Equipo"
        count={visibleUsers.length}
        action={
          <TextField
            size="small"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Buscar por nombre o email"
            inputProps={{ 'aria-label': 'Buscar personas' }}
            InputProps={{ startAdornment: <SearchRounded sx={{ color: colors.outline, mr: 1, fontSize: 20 }} /> }}
            sx={{ width: { xs: '100%', sm: 280 } }}
          />
        }
        sx={{ '& > div:first-of-type': { flexWrap: 'wrap' } }}
      >
        <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, mb: 1.5 }}>
          Aquí se ven y editan las cuentas. Para crear o eliminar personas, usa Administración.
        </Typography>

        <Box sx={{ overflowX: 'auto', mb: 1.5, mx: -0.5, px: 0.5 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={userFilter}
            onChange={(e, value) => {
              if (value !== null) {
                triggerHaptic('light');
                setUserFilter(value);
              }
            }}
            aria-label="Estado de la cuenta"
          >
            {USER_FILTERS.map((f) => (
              <ToggleButton key={f.value} value={f.value} sx={{ px: 1.25, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                {f.label}
                <Box component="span" sx={{ ml: 0.75, color: colors.outline, fontVariantNumeric: 'tabular-nums' }}>
                  {searched.filter(f.test).length}
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {visibleUsers.length === 0 ? (
          <EmptyState icon={PersonOutline} title="Nadie con estos filtros">
            Prueba con otro estado o borra la búsqueda.
          </EmptyState>
        ) : (
          <Box role="table" aria-label="Personas del equipo" sx={{ mx: -1 }}>
            <Box
              role="row"
              sx={{
                display: { xs: 'none', md: 'grid' },
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
              <span role="columnheader">Persona</span>
              <span role="columnheader">Email</span>
              <span role="columnheader">Rol</span>
              <span role="columnheader">Estado</span>
              <span role="columnheader">Trabajo</span>
              <span role="columnheader" style={{ textAlign: 'right' }}>Acciones</span>
            </Box>
            {visibleUsers.map((user) => (
              <Box
                key={user.id}
                role="row"
                sx={{
                  display: { xs: 'flex', md: 'grid' },
                  flexWrap: 'wrap',
                  gridTemplateColumns: GRID,
                  alignItems: 'center',
                  gap: { xs: 1, md: 2 },
                  px: 1,
                  py: 1.25,
                  borderRadius: `${radius.md}px`,
                  transition: 'background-color 150ms ease-out',
                  '&:hover': { backgroundColor: colors.surfaceContainer },
                  '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` },
                }}
              >
                <Box role="cell" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: { xs: '1 1 100%', md: 'initial' } }}>
                  <Avatar
                    src={user.profileImage || undefined}
                    alt=""
                    sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, opacity: user.isGhost ? 0.6 : 1 }}
                  >
                    {!user.profileImage && (user.name || '?').substring(0, 2).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.onSurface }}>
                      {user.name || 'Sin nombre'}
                    </Typography>
                    {user.isGhost && (
                      <Typography sx={{ fontSize: '0.6875rem', color: colors.onSurfaceVariant }}>
                        Fantasma · solo para dar crédito
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box role="cell" sx={{ minWidth: 0, flex: { xs: '1 1 100%', md: 'initial' } }}>
                  <Typography noWrap sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant }}>
                    {user.email || 'Sin email'}
                  </Typography>
                </Box>
                <Box role="cell">
                  {renderTag(getRoleDisplayName(user.role), user.role === ROLES.ADMIN ? colors.primary : undefined)}
                </Box>
                <Box role="cell">
                  {renderTag(getStatusLabel(user.status), USER_STATUS_TONE[user.status])}
                </Box>
                <Box role="cell">
                  <Tooltip title={`${user.stats?.assignmentsCompleted || 0} completadas · ${user.stats?.assignmentsActive || 0} activas`}>
                    <Typography component="span" sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {user.stats?.assignmentsCompleted || 0} hechas · {user.stats?.assignmentsActive || 0} activas
                    </Typography>
                  </Tooltip>
                </Box>
                <Box role="cell" sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end', ml: { xs: 'auto', md: 0 } }}>
                  {user.isGhost && (
                    <Tooltip title="Pasar sus asignaciones a otra persona">
                      <IconButton size="small" onClick={() => handleOpenTransferDialog(user)} aria-label={`Transferir asignaciones de ${user.name}`}>
                        <SwapHoriz sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canManageUser(user) && (
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleOpenDialog(user)} aria-label={`Editar a ${user.name}`}>
                        <Edit sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Panel>

      {/* Dialog para crear/editar usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar persona' : formData.isGhost ? 'Crear usuario fantasma' : 'Crear usuario'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={formData.isGhost ? "Email (opcional)" : "Email"}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingUser}
                required={!formData.isGhost}
                helperText={formData.isGhost ? "Para usuarios fantasma, el email es opcional" : ""}
              />
            </Grid>
            {!editingUser && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <input
                      type="checkbox"
                      id="isGhost"
                      checked={formData.isGhost}
                      onChange={(e) => setFormData({ ...formData, isGhost: e.target.checked })}
                    />
                    <label htmlFor="isGhost">
                      <Typography variant="body2">
                        <strong>Usuario fantasma</strong>: para dar crédito a trabajo anterior al sistema
                      </Typography>
                    </label>
                  </Box>
                  {formData.isGhost && (
                    <Box sx={{ p: 2, bgcolor: colors.surfaceContainer, borderRadius: 2, mb: 2 }}>
                      <Typography variant="body2" sx={{ color: colors.onSurface, mb: 1 }}>
                        <strong>Un usuario fantasma:</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        • No tendrá cuenta real de Firebase Auth<br/>
                        • No podrá iniciar sesión en el sistema<br/>
                        • Sirve solo para dar crédito en asignaciones<br/>
                        • Email es opcional para usuarios fantasma
                      </Typography>
                    </Box>
                  )}
                </Grid>
                {!formData.isGhost && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Contraseña"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </Grid>
                )}
              </>
            )}
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Rol"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {getAvailableRoles().map((role) => (
                  <MenuItem key={role} value={role}>
                    {getRoleDisplayName(role)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Estado"
                value={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
              >
                <MenuItem value={true}>Activo</MenuItem>
                <MenuItem value={false}>Inactivo</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para transferir asignaciones */}
      <Dialog
        open={transferDialog.open}
        onClose={transferDialog.loading ? undefined : handleCloseTransferDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Pasar asignaciones a otra persona
        </DialogTitle>
        <DialogContent>
          {transferDialog.loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <LinearProgress sx={{ width: '100%', mb: 2 }} />
              <Typography>Cargando asignaciones...</Typography>
            </Box>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Usuario Fantasma:</strong> {transferDialog.ghostUser?.name}
                  <br/>
                  <strong>Asignaciones encontradas:</strong> {transferDialog.assignments.length}
                </Typography>
              </Alert>

              {transferDialog.assignments.length > 0 ? (
                <>
                  {/* Selector de usuario destino */}
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Seleccionar Usuario Destino
                  </Typography>

                  <Autocomplete
                    fullWidth
                    options={users.filter(u => !u.isGhost && u.status !== 'deleted')}
                    value={transferDialog.targetUser}
                    onChange={(event, newValue) => {
                      setTransferDialog({ ...transferDialog, targetUser: newValue });
                    }}
                    getOptionLabel={(option) => option ? option.name || 'Usuario desconocido' : ''}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                        <Avatar
                          src={option.profileImage || option.photoURL || option.avatar}
                          alt=""
                          sx={{ width: 30, height: 30, fontSize: '0.6875rem', fontWeight: 700 }}
                        >
                          {!(option.profileImage || option.photoURL || option.avatar) && option.name &&
                           option.name.substring(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {option.name || 'Usuario desconocido'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ROLE_LABELS[option.role] || option.role} · {option.stats?.assignmentsCompleted || 0} completadas
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Usuario destino"
                        placeholder="Buscar usuario real..."
                        helperText="Selecciona el usuario real al que transferir las asignaciones"
                      />
                    )}
                  />

                  <Divider sx={{ my: 3 }} />

                  {/* Lista de asignaciones */}
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Asignaciones a Transferir ({transferDialog.assignments.length})
                  </Typography>

                  <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                    {transferDialog.assignments.map((assignment) => {
                      return (
                        <ListItem key={assignment.id} divider>
                          <ListItemIcon>
                            <Box sx={{ fontSize: '0.75rem' }}>
                              <TaskTypeTag type={assignment.type} />
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={`${assignment.mangaTitle} - Capítulo ${assignment.chapter}`}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <StatusBadge status={assignment.status} />
                                {assignment.createdAt && (
                                  <Typography variant="caption" color="text.secondary">
                                    Creada: {new Date(assignment.createdAt).toLocaleDateString()}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>

                  <Alert severity="warning" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                      <strong>Esta acción:</strong>
                      <br/>• Transferirá todas las asignaciones al usuario seleccionado
                      <br/>• Actualizará las estadísticas del usuario destino
                      <br/>• Eliminará automáticamente el usuario fantasma después de la transferencia
                      <br/>• <strong>No se puede deshacer</strong>
                    </Typography>
                  </Alert>
                </>
              ) : (
                <Alert severity="info">
                  <Typography variant="body2">
                    Este usuario fantasma no tiene asignaciones para transferir.
                  </Typography>
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseTransferDialog}
            disabled={transferDialog.loading}
          >
            Cancelar
          </Button>
          {transferDialog.assignments.length > 0 && (
            <Button
              onClick={handleTransferAssignments}
              variant="contained"
              disabled={transferDialog.loading || !transferDialog.targetUser}
              color="primary"
            >
              {transferDialog.loading ? 'Transfiriendo...' : 'Transferir y Eliminar Usuario Fantasma'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar usuario fantasma */}
      <Dialog
        open={confirmDeleteDialog.open}
        onClose={() => setConfirmDeleteDialog({ open: false, ghostUser: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          ¿Eliminar el usuario fantasma?
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Las asignaciones ya están en su nueva persona.
            </Typography>
          </Alert>

          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Deseas proceder a eliminar el usuario fantasma <strong>"{confirmDeleteDialog.ghostUser?.name}"</strong>?
          </Typography>

          <Typography variant="body2" color="text.secondary">
            El usuario fantasma será marcado como eliminado y ya no aparecerá en la lista de usuarios.
            Esta acción completará el proceso de transferencia.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDialog({ open: false, ghostUser: null })}>
            Mantenerlo
          </Button>
          <Button
            onClick={handleDeleteGhostUser}
            variant="contained"
            color="error"
            startIcon={<PersonRemove />}
          >
            Eliminar fantasma
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
