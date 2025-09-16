import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
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
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  PersonAdd,
  SupervisorAccount,
  PersonOutline,
  History,
  Warning,
  SwapHoriz,
  Delete,
  PersonRemove
} from '@mui/icons-material';
import { ref, onValue, set, update, remove, push } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { realtimeDb, auth } from '../services/firebase';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import toast from 'react-hot-toast';

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
        `✅ ${transferDialog.assignments.length} asignaciones transferidas exitosamente a ${targetUserName}`
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
      
      toast.success(`👻 Usuario fantasma "${confirmDeleteDialog.ghostUser.name}" eliminado exitosamente`);
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

  const getRoleColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'error';
      case ROLES.JEFE_EDITOR:
      case ROLES.JEFE_TRADUCTOR:
        return 'warning';
      case ROLES.EDITOR:
        return 'secondary';
      case ROLES.TRADUCTOR:
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      [ROLES.ADMIN]: 'Administrador',
      [ROLES.JEFE_EDITOR]: 'Jefe Editor',
      [ROLES.JEFE_TRADUCTOR]: 'Jefe Traductor',
      [ROLES.EDITOR]: 'Editor',
      [ROLES.TRADUCTOR]: 'Traductor'
    };
    return roleNames[role] || role;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      case 'deleted': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'suspended': return 'Suspendido';
      case 'deleted': return 'Eliminado';
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" align="center">
          No tienes permisos para acceder a esta página
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Gestión de Usuarios
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<History />}
            disabled
            sx={{
              borderColor: 'grey.400',
              color: 'grey.400',
              cursor: 'not-allowed'
            }}
          >
            Usuario Fantasma
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            disabled
            sx={{
              bgcolor: 'grey.400',
              color: 'grey.600',
              cursor: 'not-allowed',
              '&:hover': {
                bgcolor: 'grey.400'
              }
            }}
          >
            Crear Usuario
          </Button>
        </Box>
      </Box>

      {/* Advertencia sobre eliminación de usuarios */}
      <Paper sx={{ mb: 4, p: 3, bgcolor: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Warning sx={{ color: 'warning.main' }} />
          <Box>
            <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 600 }}>
              Nota Importante sobre Gestión de Usuarios
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Para <strong>crear o eliminar usuarios</strong> del sistema, utiliza el <strong>Panel de Administración</strong>. 
              Esta página está destinada únicamente para <strong>visualizar y editar</strong> usuarios existentes. 
              La gestión completa de usuarios desde el panel admin garantiza que se realicen todas las 
              validaciones necesarias y se mantenga la integridad de los datos del sistema.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Estadísticas rápidas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {users.length}
            </Typography>
            <Typography color="textSecondary">
              Total Usuarios
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {users.filter(u => u.status === 'active').length}
            </Typography>
            <Typography color="textSecondary">
              Activos
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {users.filter(u => u.role === ROLES.TRADUCTOR).length}
            </Typography>
            <Typography color="textSecondary">
              Traductores
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="secondary">
              {users.filter(u => u.role === ROLES.EDITOR).length}
            </Typography>
            <Typography color="textSecondary">
              Editores
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {users.filter(u => u.status === 'suspended').length}
            </Typography>
            <Typography color="textSecondary">
              Suspendidos
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: 'orange' }}>
              {users.filter(u => u.isGhost).length}
            </Typography>
            <Typography color="textSecondary">
              Usuarios Fantasma
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Estadísticas</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={user.profileImage}
                        sx={{ 
                          bgcolor: user.profileImage ? 'transparent' : user.isGhost ? 'orange' : getRoleColor(user.role) + '.main',
                          opacity: user.isGhost ? 0.7 : 1
                        }}
                      >
                        {!user.profileImage && (user.isGhost ? <PersonOutline /> : <SupervisorAccount />)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {user.name} {user.isGhost && '👻'}
                        </Typography>
                        {user.isGhost && (
                          <Typography variant="caption" sx={{ color: 'orange', fontStyle: 'italic' }}>
                            Usuario Fantasma
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={getRoleDisplayName(user.role)}
                      color={getRoleColor(user.role)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        label={getStatusLabel(user.status)}
                        color={getStatusColor(user.status)}
                      />
                      {user.isGhost && (
                        <Chip
                          size="small"
                          label="Fantasma"
                          sx={{ 
                            backgroundColor: 'rgba(255, 165, 0, 0.2)',
                            color: 'darkorange',
                            border: '1px solid orange'
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      Completadas: {user.stats?.assignmentsCompleted || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Activas: {user.stats?.assignmentsActive || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {user.isGhost && (
                        <Tooltip title="Transferir asignaciones a usuario real">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenTransferDialog(user)}
                          >
                            <SwapHoriz />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canManageUser(user) && (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog para crear/editar usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuario' : formData.isGhost ? '👻 Crear Usuario Fantasma' : 'Crear Nuevo Usuario'}
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
                        🚨 <strong>Usuario Fantasma</strong> - Para dar crédito a trabajo anterior al sistema
                      </Typography>
                    </label>
                  </Box>
                  {formData.isGhost && (
                    <Box sx={{ p: 2, bgcolor: 'rgba(255, 165, 0, 0.1)', borderRadius: 1, mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'darkorange', mb: 1 }}>
                        ⚠️ <strong>Usuario Fantasma:</strong>
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
          👻➡️👤 Transferir Asignaciones de Usuario Fantasma
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
                  <strong>Usuario Fantasma:</strong> {transferDialog.ghostUser?.name} 👻
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
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: '0.75rem',
                            ...(option.profileImage || option.photoURL || option.avatar) && {
                              bgcolor: 'transparent',
                              border: `2px solid #6366f160`,
                            },
                            ...(!(option.profileImage || option.photoURL || option.avatar)) && {
                              bgcolor: '#6366f1',
                              color: 'white',
                              fontWeight: 700,
                            }
                          }}
                        >
                          {!(option.profileImage || option.photoURL || option.avatar) && option.name && 
                           option.name.substring(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {option.name || 'Usuario desconocido'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.role} • {option.stats?.assignmentsCompleted || 0} completadas
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
                      const statusColor = assignment.status === 'completado' || assignment.status === 'aprobado' || assignment.status === 'uploaded' 
                        ? '#10b981' : assignment.status === 'en_progreso' ? '#f59e0b' : '#6b7280';
                      
                      return (
                        <ListItem key={assignment.id} divider>
                          <ListItemIcon>
                            <Chip
                              size="small"
                              label={assignment.type}
                              sx={{ 
                                bgcolor: statusColor + '20',
                                color: statusColor,
                                fontWeight: 500
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${assignment.mangaTitle} - Capítulo ${assignment.chapter}`}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip
                                  size="small"
                                  label={assignment.status}
                                  sx={{ 
                                    bgcolor: statusColor + '20',
                                    color: statusColor,
                                    fontSize: '0.7rem',
                                    height: 20
                                  }}
                                />
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
                      ⚠️ <strong>Esta acción:</strong>
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
          🗑️ Confirmar Eliminación de Usuario Fantasma
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              ✅ Las asignaciones se han transferido exitosamente.
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
            Mantener Usuario Fantasma
          </Button>
          <Button 
            onClick={handleDeleteGhostUser} 
            variant="contained" 
            color="error"
            startIcon={<PersonRemove />}
          >
            Eliminar Usuario Fantasma
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Users;
