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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Book as BookIcon,
  Link as LinkIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Work as WorkIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useAuth, ROLES } from '../contexts/AuthContext';

// Componente para mostrar una asignación individual
const AssignmentCard = ({ assignment, userRole, onMarkComplete, onMarkUploaded }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'uploaded':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completado';
      case 'uploaded':
        return 'Subido';
      default:
        return 'Desconocido';
    }
  };

  const canMarkComplete = () => {
    return assignment.status === 'pending' || assignment.status === 'in_progress';
  };

  const canMarkUploaded = () => {
    return userRole === ROLES.UPLOADER && assignment.status === 'completed';
  };

  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  return (
    <>
      <Card 
        sx={{ 
          mb: 2,
          border: isOverdue ? '2px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.1)',
          position: 'relative',
          '&::before': isOverdue ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#ef4444',
          } : {},
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BookIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  {assignment.manga}
                </Typography>
                <Chip
                  label={`Cap. ${assignment.chapter}`}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
              </Box>
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                <strong>Tarea:</strong> {assignment.taskType}
              </Typography>

              {assignment.dueDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {isOverdue ? <WarningIcon sx={{ color: '#ef4444', fontSize: '1rem' }} /> : <ScheduleIcon sx={{ fontSize: '1rem', color: 'textSecondary' }} />}
                  <Typography 
                    variant="body2" 
                    color={isOverdue ? 'error' : 'textSecondary'}
                    sx={{ fontWeight: isOverdue ? 600 : 400 }}
                  >
                    Fecha límite: {new Date(assignment.dueDate).toLocaleDateString('es-ES')}
                  </Typography>
                </Box>
              )}

              <Chip
                label={getStatusLabel(assignment.status)}
                color={getStatusColor(assignment.status)}
                size="small"
                sx={{ mb: 2 }}
              />

              {assignment.description && (
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {assignment.description}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setDetailsOpen(true)}
              >
                Ver Detalles
              </Button>

              {assignment.driveLink && (
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  href={assignment.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textTransform: 'none' }}
                >
                  Descargar
                </Button>
              )}

              {canMarkComplete() && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => onMarkComplete(assignment.id)}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669, #047857)',
                    },
                  }}
                >
                  Marcar Completado
                </Button>
              )}

              {canMarkUploaded() && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => onMarkUploaded(assignment.id)}
                  sx={{
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    },
                  }}
                >
                  Marcar Subido
                </Button>
              )}
            </Box>
          </Box>

          {assignment.status === 'in_progress' && assignment.progress && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Progreso
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {assignment.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={assignment.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(148, 163, 184, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog con detalles de la asignación */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Detalles de la Asignación
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {assignment.manga} - Capítulo {assignment.chapter}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                <strong>Tarea:</strong> {assignment.taskType}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                <strong>Estado:</strong> {getStatusLabel(assignment.status)}
              </Typography>
            </Grid>
            {assignment.assignedDate && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Asignado:</strong> {new Date(assignment.assignedDate).toLocaleDateString('es-ES')}
                </Typography>
              </Grid>
            )}
            {assignment.dueDate && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Fecha límite:</strong> {new Date(assignment.dueDate).toLocaleDateString('es-ES')}
                </Typography>
              </Grid>
            )}
            {assignment.description && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Descripción:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {assignment.description}
                </Typography>
              </Grid>
            )}
            {assignment.notes && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Notas adicionales:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {assignment.notes}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Componente principal del dashboard del staff
const StaffDashboard = () => {
  const { userProfile, hasRole } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });

  // Mock data basado en el rol del usuario
  useEffect(() => {
    if (!userProfile) return;

    // Simular asignaciones basadas en el rol del usuario
    const mockAssignments = [
      {
        id: '1',
        manga: 'Boku no Oku-san wa Mahou Shoujo Kamoshirenai',
        chapter: '20',
        taskType: userProfile.role === ROLES.TRADUCTOR ? 'Traducción' : 
                  userProfile.role === ROLES.EDITOR ? 'Edición' : 'Subida',
        status: 'in_progress',
        progress: 65,
        assignedDate: '2024-08-05',
        dueDate: '2024-08-15',
        driveLink: 'https://drive.google.com/drive/folders/example1',
        description: 'Capítulo con escenas de acción. Revisar términos técnicos.',
        notes: 'Prioridad alta - Fecha límite estricta'
      },
      {
        id: '2',
        manga: 'Kiyoubinbou, Jou wo Tateru',
        chapter: '7',
        taskType: userProfile.role === ROLES.TRADUCTOR ? 'Traducción' : 
                  userProfile.role === ROLES.EDITOR ? 'Edición' : 'Subida',
        status: 'pending',
        assignedDate: '2024-08-08',
        dueDate: '2024-08-20',
        driveLink: 'https://drive.google.com/drive/folders/example2',
        description: 'Capítulo introductorio de nuevo arco argumental.'
      },
      {
        id: '3',
        manga: 'Manga Ejemplo',
        chapter: '15',
        taskType: userProfile.role === ROLES.TRADUCTOR ? 'Traducción' : 
                  userProfile.role === ROLES.EDITOR ? 'Edición' : 'Subida',
        status: 'completed',
        assignedDate: '2024-07-28',
        dueDate: '2024-08-05',
        completedDate: '2024-08-04',
        driveLink: 'https://drive.google.com/drive/folders/example3',
        description: 'Capítulo completado exitosamente.'
      }
    ];

    // Si es uploader, mostrar tareas de subida
    if (userProfile.role === ROLES.UPLOADER) {
      mockAssignments.forEach(assignment => {
        if (assignment.status === 'completed') {
          assignment.taskType = 'Subir a plataforma';
          assignment.status = 'completed'; // Listo para subir
        }
      });
    }

    setAssignments(mockAssignments);

    // Calcular estadísticas
    const total = mockAssignments.length;
    const pending = mockAssignments.filter(a => a.status === 'pending').length;
    const inProgress = mockAssignments.filter(a => a.status === 'in_progress').length;
    const completed = mockAssignments.filter(a => a.status === 'completed').length;
    const overdue = mockAssignments.filter(a => 
      a.dueDate && new Date(a.dueDate) < new Date() && a.status !== 'completed'
    ).length;

    setStats({ total, pending, inProgress, completed, overdue });
  }, [userProfile]);

  const handleMarkComplete = (assignmentId) => {
    setAssignments(prev => prev.map(assignment => 
      assignment.id === assignmentId 
        ? { ...assignment, status: 'completed', completedDate: new Date().toISOString().split('T')[0] }
        : assignment
    ));
  };

  const handleMarkUploaded = (assignmentId) => {
    setAssignments(prev => prev.map(assignment => 
      assignment.id === assignmentId 
        ? { ...assignment, status: 'uploaded', uploadedDate: new Date().toISOString().split('T')[0] }
        : assignment
    ));
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
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
      case ROLES.UPLOADER:
        return <CloudUploadIcon sx={{ color: '#8b5cf6' }} />;
      case ROLES.EDITOR:
      case ROLES.TRADUCTOR:
        return <WorkIcon sx={{ color: '#6366f1' }} />;
      default:
        return <AccountCircleIcon />;
    }
  };

  if (!userProfile) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="info">
          <Typography>Cargando información del usuario...</Typography>
        </Alert>
      </Container>
    );
  }

  // Solo staff puede acceder (no admin)
  if (hasRole(ROLES.ADMIN)) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="info">
          <Typography variant="h6">Panel de Administrador</Typography>
          <Typography>
            Como administrador, accede al panel de administración desde el menú principal.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box className="animate-fade-in" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            {getRoleIcon(userProfile.role)}
          </Avatar>
          <Box>
            <Typography 
              variant="h3" 
              component="h1"
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Mi Panel de Trabajo
            </Typography>
            <Typography variant="h6" color="textSecondary">
              {userProfile.name} - {getRoleDisplayName(userProfile.role)}
            </Typography>
          </Box>
        </Box>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            📋 Aquí puedes ver todas tus asignaciones actuales y gestionar tu trabajo.
          </Typography>
        </Alert>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {stats.inProgress}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                En Progreso
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {stats.completed}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Completadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {stats.overdue}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Atrasadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Asignaciones */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          Mis Asignaciones
        </Typography>
        
        {assignments.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <AssignmentIcon sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No tienes asignaciones actualmente
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Las nuevas asignaciones aparecerán aquí cuando te sean otorgadas
            </Typography>
          </Card>
        ) : (
          <Box>
            {assignments.map((assignment, index) => (
              <Box
                key={assignment.id}
                sx={{
                  animation: `fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`,
                }}
              >
                <AssignmentCard
                  assignment={assignment}
                  userRole={userProfile.role}
                  onMarkComplete={handleMarkComplete}
                  onMarkUploaded={handleMarkUploaded}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default StaffDashboard;
