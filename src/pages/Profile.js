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
  LinearProgress,
  Alert,
  Tab,
  Tabs,
  Fade
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
  TrendingUp,
  PhotoCamera,
  Wallpaper,
  Settings
} from '@mui/icons-material';
import { ref, update, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { realtimeDb } from '../services/firebase';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import { usePageTour } from '../hooks/usePageTour';
import ImageUploader from '../components/ImageUploader';
import imagekitService from '../services/imagekitService';
import toast from 'react-hot-toast';

const Profile = () => {
  const { currentUser, userProfile } = useAuth();
  
  // Hook para tour de página
  const { startTour: startPageTour, isTourAvailable } = usePageTour();
  
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    profileImage: '',
    bannerImage: '',
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
  const [imagekitStatus, setImagekitStatus] = useState({ configured: false });

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        name: userProfile.name || '',
        profileImage: userProfile.profileImage || '',
        bannerImage: userProfile.bannerImage || ''
      }));
    }
    
    // Verificar estado de ImageKit
    setImagekitStatus(imagekitService.getConfigStatus());
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile?.uid) return;

    let unsubscribeAssignments = null;
    let unsubscribeMangas = null;

    // Initialize async subscriptions
    const initSubscriptions = async () => {
      try {
        // Get user assignments from Realtime Database
        unsubscribeAssignments = await realtimeService.subscribeToAssignments((assignments) => {
          // Filter only assignments for current user
          const userAssignments = assignments.filter(assignment => assignment.assignedTo === userProfile.uid);
          
          // Calculate statistics
          const completed = userAssignments.filter(assignment => assignment.status === 'completado').length;
          const active = userAssignments.filter(assignment => assignment.status !== 'completado').length;
          const total = userAssignments.length;
          
          setUserStats({
            assignmentsCompleted: completed,
            assignmentsActive: active,
            assignmentsTotal: total
          });
          
          // Get recent assignments (last 5, sorted by update date)
          const recentAssignments = userAssignments
            .sort((a, b) => {
              const dateA = new Date(a.updatedAt || a.createdAt);
              const dateB = new Date(b.updatedAt || b.createdAt);
              return dateB - dateA;
            })
            .slice(0, 5);
          
          setRecentAssignments(recentAssignments);
        }, userProfile.uid);
        
        // Get manga information to show correct titles
        unsubscribeMangas = await realtimeService.subscribeToMangas(setMangas);
      } catch (error) {
        // Error setting up subscriptions - silently handle
      }
    };

    initSubscriptions();
    
    return () => {
      if (typeof unsubscribeAssignments === 'function') unsubscribeAssignments();
      if (typeof unsubscribeMangas === 'function') unsubscribeMangas();
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

      // Actualizar banner si cambió
      if (formData.bannerImage !== userProfile.bannerImage) {
        updates.bannerImage = formData.bannerImage;
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
      //  message removed for production
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
      bannerImage: userProfile?.bannerImage || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setEditing(false);
  };

  // Funciones para manejo de imágenes
  const handleProfileImageUpdate = (imageUrl, imageData) => {
    setFormData(prev => ({ ...prev, profileImage: imageUrl }));
    toast.success('Imagen de perfil actualizada');
  };

  const handleBannerImageUpdate = (imageUrl, imageData) => {
    setFormData(prev => ({ ...prev, bannerImage: imageUrl }));
    toast.success('Banner actualizado');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
      {/* Header con banner */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        {/* Banner */}
        <Box
          sx={{
            height: 200,
            bgcolor: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            background: formData.bannerImage || userProfile.bannerImage 
              ? `url(${formData.bannerImage || userProfile.bannerImage}) center/cover` 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          {/* Overlay para mejor legibilidad */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 4
            }}
          />
        </Box>

        {/* Avatar y título superpuestos */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            left: 32,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 3
          }}
        >
          <Avatar
            src={formData.profileImage || userProfile.profileImage}
            data-tour="profile-avatar"
            sx={{
              width: 120,
              height: 120,
              bgcolor: getRoleColor(userProfile.role) + '.main',
              border: '4px black solid',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
          >
            {!formData.profileImage && !userProfile.profileImage && (
              <Person sx={{ fontSize: 60 }} />
            )}
          </Avatar>
          
          <Box sx={{ pb: 2, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {userProfile.name || 'Usuario'}
            </Typography>
            <Chip
              label={getRoleDisplayName(userProfile.role)}
              color={getRoleColor(userProfile.role)}
              icon={<Badge />}
              sx={{ bgcolor: 'rgba(10, 112, 32, 0.9)', color: 'text.primary' }}
            />
          </Box>
        </Box>

        {/* Botón editar en la esquina */}
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          {!editing ? (
            <Button
              startIcon={<Edit />}
              onClick={() => setEditing(true)}
              variant="contained"
              data-tour="profile-edit-button"
              sx={{
                bgcolor: '#FFC107 !important', // Amarillo sólido
                background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%) !important',
                backdropFilter: 'blur(10px)',
                border: 'none',
                color: 'white !important',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
                '&:hover': {
                  bgcolor: '#FFB300 !important',
                  background: 'linear-gradient(135deg, #FFB300 0%, #F57C00 100%) !important',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(255, 193, 7, 0.4)'
                }
              }}
            >
              Editar Perfil
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<Save />}
                onClick={handleSave}
                variant="contained"
                sx={{
                  bgcolor: '#4CAF50 !important', // Verde sólido
                  background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%) !important',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  color: 'white !important',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  '&:hover': { 
                    bgcolor: '#43A047 !important',
                    background: 'linear-gradient(135deg, #43A047 0%, #1B5E20 100%) !important',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
                  }
                }}
              >
                Guardar
              </Button>
              <Button
                startIcon={<Cancel />}
                onClick={handleCancel}
                variant="contained"
                sx={{
                  bgcolor: '#F44336 !important', // Rojo sólido
                  background: 'linear-gradient(135deg, #F44336 0%, #C62828 100%) !important',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  color: 'white !important',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                  '&:hover': { 
                    bgcolor: '#E53935 !important',
                    background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%) !important',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)'
                  }
                }}
              >
                Cancelar
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Espacio para el avatar superpuesto */}
      <Box sx={{ mt: 6 }} />

      {/* Estado de ImageKit */}
      {!imagekitStatus.configured && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>ImageKit no configurado:</strong> Las funciones de subida de imágenes no están disponibles. 
            Configure las credenciales de ImageKit en el archivo .env para habilitar esta funcionalidad.
          </Typography>
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            icon={<Settings />}
            label="Información Personal"
            iconPosition="start"
          />
          <Tab
            icon={<PhotoCamera />}
            label="Imágenes de Perfil"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {/* Contenido de tabs */}
        <Grid item xs={12} md={8}>
          {/* Tab 0: Información Personal */}
          {activeTab === 0 && (
            <Fade in={activeTab === 0}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  🔧 Información Personal
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

                  {editing && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        🔒 Cambiar Contraseña
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Fade>
          )}

          {/* Tab 1: Imágenes de Perfil (Perfil + Banner) */}
          {activeTab === 1 && (
            <Fade in={activeTab === 1}>
              <Box>
                {/* Descripción de la sección */}
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>🎨 Personaliza tu perfil</strong><br/>
                    Sube tu imagen de perfil y banner. Ambas imágenes se optimizarán automáticamente y se guardará un historial de las últimas versiones.
                  </Typography>
                </Alert>
                
                {/* Indicador de estado */}
                {!editing ? (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      🔒 <strong>Modo solo lectura:</strong> Haz clic en "Editar Perfil" en la esquina superior derecha para poder subir imágenes.
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      ✅ <strong>Modo edición activo:</strong> Ahora puedes subir y cambiar tus imágenes. No olvides hacer clic en "Guardar" cuando termines.
                    </Typography>
                  </Alert>
                )}
                
                {imagekitStatus.configured ? (
                  <Grid container spacing={3}>
                    {/* Imagen de Perfil */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhotoCamera color="primary" />
                          Imagen de Perfil
                        </Typography>
                        <ImageUploader
                          userId={userProfile?.uid}
                          imageType="profile"
                          currentImage={formData.profileImage || userProfile.profileImage}
                          onImageUpdate={handleProfileImageUpdate}
                          disabled={!editing}
                          showHistory={true}
                          maxWidth={400}
                          maxHeight={150}
                        />
                      </Paper>
                    </Grid>
                    
                    {/* Banner */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Wallpaper color="primary" />
                          Banner de Perfil
                        </Typography>
                        <ImageUploader
                          userId={userProfile?.uid}
                          imageType="banner"
                          currentImage={formData.bannerImage || userProfile.bannerImage}
                          onImageUpdate={handleBannerImageUpdate}
                          disabled={!editing}
                          showHistory={true}
                          maxWidth={400}
                          maxHeight={150}
                        />
                      </Paper>
                    </Grid>
                  </Grid>
                ) : (
                  <Grid container spacing={3}>
                    {/* Fallback para imagen de perfil */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhotoCamera color="primary" />
                          Imagen de Perfil
                        </Typography>
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>ImageKit no configurado</strong><br/>
                            Para usar la función de subida de imágenes, configure las credenciales de ImageKit en el archivo .env
                          </Typography>
                        </Alert>
                        
                        <TextField
                          fullWidth
                          label="URL de imagen de perfil"
                          value={formData.profileImage}
                          onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                          disabled={!editing}
                          placeholder="https://ejemplo.com/mi-imagen.jpg"
                          helperText="Introduce la URL de tu imagen de perfil"
                          data-tour="profile-image-field"
                          InputProps={{
                            startAdornment: <PhotoCamera sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      </Paper>
                    </Grid>
                    
                    {/* Fallback para banner */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Wallpaper color="primary" />
                          Banner de Perfil
                        </Typography>
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>ImageKit no configurado</strong><br/>
                            Para usar la función de subida de banners, configure las credenciales de ImageKit en el archivo .env
                          </Typography>
                        </Alert>
                        
                        <TextField
                          fullWidth
                          label="URL del banner"
                          value={formData.bannerImage}
                          onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                          disabled={!editing}
                          placeholder="https://ejemplo.com/mi-banner.jpg"
                          helperText="Introduce la URL de tu banner (recomendado: 1200x300px)"
                          InputProps={{
                            startAdornment: <Wallpaper sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </Box>
            </Fade>
          )}
        </Grid>

        {/* Estadísticas y asignaciones recientes */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }} data-tour="profile-stats">
            <Typography variant="h6" gutterBottom>
              📊 Estadísticas
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'primary.50' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary">
                      {userStats.assignmentsTotal}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total de Asignaciones
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card sx={{ bgcolor: 'warning.50' }}>
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
              
              <Grid item xs={6}>
                <Card sx={{ bgcolor: 'success.50' }}>
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
          <Paper sx={{ p: 3 }} data-tour="recent-assignments">
            <Typography variant="h6" gutterBottom>
              📋 Asignaciones Recientes
            </Typography>
            
            {recentAssignments.length === 0 ? (
              <Typography color="textSecondary">
                No tienes asignaciones recientes
              </Typography>
            ) : (
              <List sx={{ p: 0 }}>
                {recentAssignments.map((assignment) => (
                  <ListItem key={assignment.id} divider sx={{ px: 0 }}>
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
                        <Box component="span" sx={{ display: 'block' }}>
                          <Chip
                            size="small"
                            label={getTaskTypeLabel(assignment.tasks || [assignment.type])}
                            color={assignment.tasks?.includes('traduccion') || assignment.type === 'traduccion' ? 'primary' : 'secondary'}
                            sx={{ mr: 1, mb: 0.5 }}
                          />
                          <Chip
                            size="small"
                            label={assignment.status === 'completado' ? 'Completado' : 
                                   assignment.status === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                            color={getStatusColor(assignment.status)}
                          />
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
