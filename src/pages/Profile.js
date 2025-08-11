import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Person,
  Email,
  Badge,
  Edit,
  Save,
  Cancel,
  Assignment,
  CheckCircle,
  TrendingUp
} from '@mui/icons-material';
import { ref, update, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { realtimeDb } from '../services/firebase';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { currentUser, userProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    profileImage: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [userStats, setUserStats] = useState({
    assignmentsCompleted: 0,
    assignmentsActive: 0,
    assignmentsTotal: 0
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [mangas, setMangas] = useState([]);

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        name: userProfile.name || '',
        profileImage: userProfile.profileImage || ''
      }));
    }
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile?.uid) return;

    // Obtener asignaciones del usuario desde Realtime Database
    const unsubscribeAssignments = realtimeService.subscribeToAssignments((assignments) => {
      // Filtrar solo las asignaciones del usuario actual
      const userAssignments = assignments.filter(assignment => assignment.assignedTo === userProfile.uid);
      
      // Calcular estadísticas
      const completed = userAssignments.filter(assignment => assignment.status === 'completado').length;
      const active = userAssignments.filter(assignment => assignment.status !== 'completado').length;
      const total = userAssignments.length;
      
      setUserStats({
        assignmentsCompleted: completed,
        assignmentsActive: active,
        assignmentsTotal: total
      });
      
      // Obtener asignaciones recientes (últimas 5, ordenadas por fecha de actualización)
      const recentAssignments = userAssignments
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB - dateA;
        })
        .slice(0, 5);
      
      setRecentAssignments(recentAssignments);
    }, userProfile.uid);
    
    // Obtener información de mangas para mostrar títulos correctos
    const unsubscribeMangas = realtimeService.subscribeToMangas(setMangas);
    
    return () => {
      if (unsubscribeAssignments) unsubscribeAssignments();
      if (unsubscribeMangas) unsubscribeMangas();
    };
  }, [userProfile]);

  const handleSave = async () => {
    try {
      const updates = {};
      
      // Actualizar nombre si cambió
      if (formData.name !== userProfile.name) {
        updates.name = formData.name;
      }

      // Actualizar imagen de perfil si cambió
      if (formData.profileImage !== userProfile.profileImage) {
        updates.profileImage = formData.profileImage;
      }

      // Actualizar contraseña si se proporcionó
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('Las contraseñas no coinciden');
          return;
        }

        if (formData.newPassword.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres');
          return;
        }

        // Re-autenticar antes de cambiar contraseña
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          formData.currentPassword
        );

        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, formData.newPassword);
        
        toast.success('Contraseña actualizada exitosamente');
      }

      // Actualizar perfil en Realtime Database
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        
        const userRef = ref(realtimeDb, `users/${currentUser.uid}`);
        await update(userRef, updates);
        
        toast.success('Perfil actualizado exitosamente');
      }

      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setEditing(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Contraseña actual incorrecta');
      } else {
        toast.error('Error al actualizar el perfil');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userProfile?.name || '',
      profileImage: userProfile?.profileImage || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setEditing(false);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completado':
        return 'success';
      case 'en_progreso':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getMangaTitle = (mangaId) => {
    const manga = mangas.find(m => m.id === mangaId);
    return manga ? manga.title : 'Manga desconocido';
  };

  const getTaskTypeLabel = (tasks) => {
    if (!tasks || tasks.length === 0) return 'Tarea';
    
    const taskLabels = {
      'traduccion': 'Traducción',
      'proofreading': 'Proofreading', 
      'cleanRedrawer': 'Clean/Redrawer',
      'type': 'Typesetting',
      'typesetting': 'Typesetting'
    };
    
    if (tasks.length === 1) {
      return taskLabels[tasks[0]] || tasks[0];
    }
    
    return `${tasks.length} tareas`;
  };

  if (!userProfile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Cargando perfil...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Mi Perfil
      </Typography>

      <Grid container spacing={3}>
        {/* Información del perfil */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Información Personal
              </Typography>
              {!editing ? (
                <Button
                  startIcon={<Edit />}
                  onClick={() => setEditing(true)}
                  variant="outlined"
                >
                  Editar
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<Save />}
                    onClick={handleSave}
                    variant="contained"
                    size="small"
                  >
                    Guardar
                  </Button>
                  <Button
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                    variant="outlined"
                    size="small"
                  >
                    Cancelar
                  </Button>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={formData.profileImage || userProfile.profileImage}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: getRoleColor(userProfile.role) + '.main',
                  mb: 2
                }}
              >
                {!formData.profileImage && !userProfile.profileImage && (
                  <Person sx={{ fontSize: 40 }} />
                )}
              </Avatar>
              <Chip
                label={getRoleDisplayName(userProfile.role)}
                color={getRoleColor(userProfile.role)}
                icon={<Badge />}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Nombre completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!editing}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />

              <TextField
                fullWidth
                label="Email"
                value={currentUser?.email || ''}
                disabled
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />

              <TextField
                fullWidth
                label="URL de imagen de perfil"
                value={formData.profileImage}
                onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                disabled={!editing}
                placeholder="https://ejemplo.com/mi-imagen.jpg"
                helperText="Introduce la URL de tu imagen de perfil"
              />

              {editing && (
                <>
                  <Divider sx={{ my: 2 }}>Cambiar Contraseña</Divider>
                  
                  <TextField
                    fullWidth
                    label="Contraseña actual"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  />
                  
                  <TextField
                    fullWidth
                    label="Nueva contraseña"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                  
                  <TextField
                    fullWidth
                    label="Confirmar nueva contraseña"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Estadísticas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estadísticas
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary">
                      {userStats.assignmentsTotal}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="warning.main">
                      {userStats.assignmentsActive}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Activas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="success.main">
                      {userStats.assignmentsCompleted}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Completadas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {userStats.assignmentsTotal > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Tasa de completación
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(userStats.assignmentsCompleted / userStats.assignmentsTotal) * 100}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="textSecondary">
                  {Math.round((userStats.assignmentsCompleted / userStats.assignmentsTotal) * 100)}%
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Asignaciones recientes */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Asignaciones Recientes
            </Typography>
            
            {recentAssignments.length === 0 ? (
              <Typography color="textSecondary">
                No tienes asignaciones recientes
              </Typography>
            ) : (
              <List>
                {recentAssignments.map((assignment) => (
                  <ListItem key={assignment.id} divider>
                    <ListItemIcon>
                      {assignment.status === 'completado' ? (
                        <CheckCircle color="success" />
                      ) : (
                        <Assignment color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${getMangaTitle(assignment.mangaId)} - Cap. ${assignment.chapter}`}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            size="small"
                            label={getTaskTypeLabel(assignment.tasks || [assignment.type])}
                            color={assignment.tasks?.includes('traduccion') || assignment.type === 'traduccion' ? 'primary' : 'secondary'}
                          />
                          <Chip
                            size="small"
                            label={assignment.status === 'completado' ? 'Completado' : 
                                   assignment.status === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                            color={getStatusColor(assignment.status)}
                          />
                          {assignment.progress > 0 && (
                            <Typography variant="caption">
                              {assignment.progress}%
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
