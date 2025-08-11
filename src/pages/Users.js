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
  Avatar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PersonAdd,
  SupervisorAccount
} from '@mui/icons-material';
import { ref, onValue, set, update, remove, push } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { realtimeDb, auth } from '../services/firebase';
import { useAuth, ROLES } from '../contexts/AuthContext';
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
    active: true
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
        active: user.active !== false
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: ROLES.TRADUCTOR,
        password: '',
        active: true
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
          updatedBy: userProfile.uid
        };

        await update(ref(realtimeDb, `users/${editingUser.uid}`), updateData);
        toast.success('Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario
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
          createdAt: new Date().toISOString(),
          createdBy: userProfile.uid,
          lastActive: 'Nunca',
          profileImage: '', // Campo para imagen de perfil
          stats: {
            assignmentsCompleted: 0,
            assignmentsActive: 0
          }
        };

        await set(ref(realtimeDb, `users/${userCredential.user.uid}`), userData);
        toast.success('Usuario creado exitosamente');
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('El email ya está en uso');
      } else if (error.code === 'auth/weak-password') {
        toast.error('La contraseña debe tener al menos 6 caracteres');
      } else {
        toast.error('Error al guardar el usuario');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        // En lugar de eliminar, marcamos como eliminado
        await update(ref(realtimeDb, `users/${userId}`), {
          status: 'deleted',
          deletedAt: new Date().toISOString(),
          deletedBy: userProfile.uid
        });
        toast.success('Usuario eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        toast.error('Error al eliminar el usuario');
      }
    }
  };

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
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => handleOpenDialog()}
        >
          Crear Usuario
        </Button>
      </Box>

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
              {users.filter(u => u.active !== false).length}
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
                          bgcolor: user.profileImage ? 'transparent' : getRoleColor(user.role) + '.main'
                        }}
                      >
                        {!user.profileImage && <SupervisorAccount />}
                      </Avatar>
                      <Typography variant="subtitle2">
                        {user.name}
                      </Typography>
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
                    <Chip
                      size="small"
                      label={user.active !== false ? 'Activo' : 'Inactivo'}
                      color={user.active !== false ? 'success' : 'default'}
                    />
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
                      {canManageUser(user) && (
                        <>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(user)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          {hasRole(ROLES.ADMIN) && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
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
          {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
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
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingUser}
                required
              />
            </Grid>
            {!editingUser && (
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
    </Container>
  );
};

export default Users;
