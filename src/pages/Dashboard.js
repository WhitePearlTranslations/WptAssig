import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Button,
  Alert
} from '@mui/material';
import {
  Assignment,
  Edit,
  Translate,
  CheckCircle,
  Schedule,
  AdminPanelSettings,
  Person,
  Warning,
  TrendingUp,
  AccessTime,
  Work,
  BarChart
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LabelList
} from 'recharts';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { userProfile, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [myActiveAssignments, setMyActiveAssignments] = useState([]);
  const [myStats, setMyStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [typeDistribution, setTypeDistribution] = useState([]);

  useEffect(() => {
    // Mis asignaciones y estadísticas personales
    let unsubscribeMyAssignments = null;
    if (userProfile?.uid) {
      unsubscribeMyAssignments = realtimeService.subscribeToAssignments((assignments) => {
        const myAssignments = assignments.filter(assignment => 
          assignment.assignedTo === userProfile.uid
        );
        
        const myActiveAssignments = myAssignments.filter(assignment => 
          assignment.status !== 'completado' && assignment.status !== 'uploaded'
        );
        
        setMyActiveAssignments(myActiveAssignments);
        
        // Calcular estadísticas personales
        const total = myAssignments.length;
        const pending = myAssignments.filter(a => a.status === 'pending' || a.status === 'pendiente').length;
        const inProgress = myAssignments.filter(a => a.status === 'in_progress' || a.status === 'en_progreso').length;
        const completed = myAssignments.filter(a => a.status === 'completed' || a.status === 'completado').length;
        const overdue = myAssignments.filter(a => 
          a.dueDate && new Date(a.dueDate) < new Date() && 
          (a.status === 'pending' || a.status === 'pendiente' || a.status === 'in_progress' || a.status === 'en_progreso')
        ).length;
        
        setMyStats({ total, pending, inProgress, completed, overdue });
        
        // Fechas límite próximas (próximos 7 días)
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const upcoming = myActiveAssignments
          .filter(a => a.dueDate && new Date(a.dueDate) <= nextWeek)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5);
          
        setUpcomingDeadlines(upcoming);
        
        // Generar datos de actividad (últimos 7 días)
        const activityChart = generateActivityData(myAssignments);
        setActivityData(activityChart);
        
        // Generar distribución por tipo de trabajo
        const typeChart = generateTypeDistribution(myAssignments);
        setTypeDistribution(typeChart);
      });
    }

    return () => {
      if (unsubscribeMyAssignments) {
        unsubscribeMyAssignments();
      }
    };
  }, [userProfile]);

  const getTypeIcon = (type) => {
    return type === 'traduccion' ? <Translate /> : <Edit />;
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Administrador',
      jefe_editor: 'Jefe Editor',
      jefe_traductor: 'Jefe Traductor',
      editor: 'Editor',
      traductor: 'Traductor',
      uploader: 'Uploader'
    };
    return roleNames[role] || role;
  };

  const getDaysUntilDeadline = (dueDate) => {
    const now = new Date();
    const deadline = new Date(dueDate);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineColor = (daysUntil) => {
    if (daysUntil < 0) return '#ef4444'; // Vencido - rojo
    if (daysUntil <= 1) return '#f59e0b'; // Urgente - naranja
    if (daysUntil <= 3) return '#eab308'; // Próximo - amarillo
    return '#6b7280'; // Normal - gris
  };

  // Generar datos de actividad para el gráfico
  const generateActivityData = (assignments) => {
    const now = new Date();
    const days = [];
    
    // Generar últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
      const dayNum = date.getDate();
      
      // Contar asignaciones completadas en este día
      const completedToday = assignments.filter(a => {
        const completedDate = a.completedDate || a.updatedAt;
        if (!completedDate) return false;
        
        const assignmentDate = typeof completedDate === 'string' 
          ? completedDate.split('T')[0]
          : completedDate.toDate?.()?.toISOString().split('T')[0];
        
        return assignmentDate === dateStr && (a.status === 'completed' || a.status === 'completado');
      }).length;
      
      // Contar asignaciones creadas/asignadas en este día
      const assignedToday = assignments.filter(a => {
        const assignedDate = a.assignedDate || a.createdAt;
        if (!assignedDate) return false;
        
        const assignmentDate = typeof assignedDate === 'string' 
          ? assignedDate.split('T')[0]
          : assignedDate.toDate?.()?.toISOString().split('T')[0];
        
        return assignmentDate === dateStr;
      }).length;
      
      days.push({
        day: `${dayName} ${dayNum}`,
        completadas: completedToday,
        asignadas: assignedToday,
        fecha: dateStr
      });
    }
    
    return days;
  };

  // Generar distribución por tipo de trabajo
  const generateTypeDistribution = (assignments) => {
    const types = {
      traduccion: { count: 0, color: '#6366f1', label: 'Traducción' },
      proofreading: { count: 0, color: '#ec4899', label: 'Proofreading' },
      cleanRedrawer: { count: 0, color: '#10b981', label: 'Clean/Redraw' },
      type: { count: 0, color: '#f59e0b', label: 'Typesetting' }
    };
    
    assignments.forEach(assignment => {
      if (types[assignment.type]) {
        types[assignment.type].count++;
      }
    });
    
    return Object.entries(types)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => ({
        name: data.label,
        value: data.count,
        color: data.color
      }));
  };


  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box className="animate-fade-in" sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
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
              Dashboard
            </Typography>
            <Typography 
              variant="h6" 
              color="textSecondary"
              sx={{ 
                fontWeight: 400,
                opacity: 0.8,
              }}
            >
              Bienvenido de vuelta, {userProfile?.name || 'Usuario'}
            </Typography>
          </Box>
          
          {/* Botón de Panel de Admin - Solo para Superusuario */}
          {isSuperAdmin() && (
            <Button
              variant="contained"
              size="large"
              startIcon={<AdminPanelSettings />}
              onClick={() => navigate('/admin')}
              sx={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: '16px',
                textTransform: 'none',
                fontSize: '1.1rem',
                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animation: 'pulse 2s infinite',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shine 3s infinite',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(239, 68, 68, 0.5)',
                },
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' },
                },
                '@keyframes shine': {
                  '0%': { left: '-100%' },
                  '100%': { left: '100%' },
                },
              }}
            >
              Panel de Admin
            </Button>
          )}
        </Box>
      </Box>


      {/* Información Personal del Usuario */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Perfil del Usuario */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src={userProfile?.profileImage || userProfile?.photoURL || userProfile?.avatar}
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                border: '3px solid #6366f1',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
              }}
            >
              {!(userProfile?.profileImage || userProfile?.photoURL || userProfile?.avatar) &&
                userProfile?.name?.substring(0, 2).toUpperCase()
              }
            </Avatar>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {userProfile?.name || 'Usuario'}
            </Typography>
            <Chip
              icon={<Work />}
              label={getRoleDisplayName(userProfile?.role)}
              sx={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                fontWeight: 500,
                mb: 2
              }}
            />
            <Typography variant="body2" color="textSecondary">
              Miembro desde {userProfile?.createdAt?.toDate?.()?.toLocaleDateString('es-ES') || 'N/A'}
            </Typography>
          </Card>
        </Grid>

        {/* Estadísticas Personales */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Mis Estadísticas
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {myStats.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {myStats.pending}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pendientes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {myStats.completed}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completadas
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    {myStats.overdue}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Atrasadas
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* Fechas Límite Próximas */}
      {upcomingDeadlines.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            Fechas Límite Próximas
          </Typography>
          <Paper sx={{ p: 2 }}>
            <List sx={{ '& .MuiListItem-root': { borderRadius: '8px', mb: 1 } }}>
              {upcomingDeadlines.map((assignment, index) => {
                const daysUntil = getDaysUntilDeadline(assignment.dueDate);
                const deadlineColor = getDeadlineColor(daysUntil);
                
                return (
                  <ListItem
                    key={assignment.id}
                    sx={{
                      background: `${deadlineColor}10`,
                      border: `1px solid ${deadlineColor}30`,
                      borderRadius: '8px',
                      mb: 1,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box
                        sx={{
                          background: deadlineColor,
                          borderRadius: '8px',
                          p: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {daysUntil < 0 ? (
                          <Warning sx={{ color: 'white', fontSize: '1.2rem' }} />
                        ) : (
                          <AccessTime sx={{ color: 'white', fontSize: '1.2rem' }} />
                        )}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight={600}>
                            {assignment.mangaTitle} - Cap. {assignment.chapter}
                          </Typography>
                          <Chip
                            size="small"
                            label={assignment.type === 'traduccion' ? 'Traducción' : 'Edición'}
                            sx={{
                              background: assignment.type === 'traduccion' ? '#6366f1' : '#ec4899',
                              color: 'white',
                              fontWeight: 500,
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: deadlineColor, fontWeight: 500 }}>
                            {daysUntil < 0
                              ? `Vencido hace ${Math.abs(daysUntil)} días`
                              : daysUntil === 0
                              ? 'Vence hoy'
                              : daysUntil === 1
                              ? 'Vence mañana'
                              : `Vence en ${daysUntil} días`
                            }
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Fecha límite: {new Date(assignment.dueDate).toLocaleDateString('es-ES')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Box>
      )}

      {/* Mensaje de motivación si no hay fechas límite próximas */}
      {upcomingDeadlines.length === 0 && myStats.total > 0 && (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body1">
            ¡Buen trabajo! No tienes fechas límite próximas. Mantén el ritmo.
          </Typography>
        </Alert>
      )}

      {/* Mensaje si no tiene asignaciones */}
      {myStats.total === 0 && (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body1">
            No tienes asignaciones actualmente. Las nuevas tareas aparecerán aquí cuando te sean asignadas.
          </Typography>
        </Alert>
      )}

      {/* Gráficos de Actividad - Solo si tiene datos */}
      {myStats.total > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Gráfico de Actividad (Últimos 7 días) */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <BarChart sx={{ color: '#6366f1' }} />
                <Typography variant="h6" fontWeight={600}>
                  Mi Actividad (Últimos 7 días)
                </Typography>
              </Box>
              
              {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={activityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      labelStyle={{ color: '#e5e7eb' }}
                    />
                    <Bar 
                      dataKey="completadas" 
                      fill="#10b981" 
                      name="Completadas"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="asignadas" 
                      fill="#6366f1" 
                      name="Nuevas Asignaciones"
                      radius={[4, 4, 0, 0]}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, opacity: 0.6 }}>
                  <TrendingUp sx={{ fontSize: '3rem', mb: 2, color: '#6b7280' }} />
                  <Typography color="textSecondary">
                    No hay actividad reciente para mostrar
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Distribución por Tipo de Trabajo */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Distribución por Tipo
              </Typography>
              
              {typeDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={(entry) => entry.value}
                        labelLine={false}
                      >
                        {typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList 
                          dataKey="value" 
                          position="inside"
                          fill="white"
                          fontSize={14}
                          fontWeight={600}
                        />
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Leyenda personalizada */}
                  <Box sx={{ mt: 2 }}>
                    {typeDistribution.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: item.color
                          }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          {item.name}: {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, opacity: 0.6 }}>
                  <Assignment sx={{ fontSize: '2rem', mb: 1, color: '#6b7280' }} />
                  <Typography variant="body2" color="textSecondary">
                    Sin datos para mostrar
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Solo mostrar Mis Asignaciones si el usuario tiene asignaciones */}
      {myActiveAssignments.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h5" 
            component="h2"
            sx={{ 
              fontWeight: 600,
              mb: 2,
            }}
          >
            Mis Asignaciones Activas
          </Typography>
          <Paper sx={{ p: 2 }}>
            <List sx={{ '& .MuiListItem-root': { borderRadius: '8px', mb: 1 } }}>
              {myActiveAssignments.map((assignment, index) => (
                <ListItem 
                  key={assignment.id} 
                  sx={{
                    background: 'rgba(99, 102, 241, 0.03)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    borderRadius: '8px',
                    mb: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box
                      sx={{
                        background: assignment.type === 'traduccion' ? '#6366f1' : '#ec4899',
                        borderRadius: '8px',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {React.cloneElement(getTypeIcon(assignment.type), {
                        sx: { color: 'white', fontSize: '1.2rem' }
                      })}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight={600}>
                        {assignment.mangaTitle} - Cap. {assignment.chapter}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="textSecondary">
                        {assignment.type === 'traduccion' ? 'Traducción' : 'Edición'}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default Dashboard;
