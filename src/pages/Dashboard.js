import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  Avatar,
  Button,
  Alert
} from '@mui/material';
import {
  Assignment,
  Edit,
  Translate,
  AdminPanelSettings,
  TrendingUp,
  Work,
  HourglassTop,
  RateReview,
} from '@mui/icons-material';
import {
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
} from 'recharts';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import { useNavigate } from 'react-router-dom';
import { usePendingReviews } from '../hooks/usePendingReviews';
import SystemFooter from '../components/SystemFooter';

const Dashboard = () => {
  const { userProfile, isSuperAdmin, hasRole, userPermissions, refreshPermissions } = useAuth();
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
  
  // Hook para revisiones pendientes (solo para jefes)
  const pendingReviews = usePendingReviews();
  const isChief = hasRole(ROLES.ADMIN) || hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR);


  useEffect(() => {
    let unsubscribeMyAssignments = null;
    
    // Initialize async subscriptions
    const initSubscriptions = async () => {
      if (userProfile?.uid) {
        try {
          unsubscribeMyAssignments = await realtimeService.subscribeToAssignments((assignments) => {
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
        } catch (error) {
          // Error setting up subscriptions - silently handle
        }
      }
    };

    initSubscriptions();

    return () => {
      if (typeof unsubscribeMyAssignments === 'function') {
        unsubscribeMyAssignments();
      }
    };
  }, [userProfile]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'traduccion':
        return <Translate />;
      case 'proofreading':
        return <RateReview />;
      case 'cleanRedrawer':
        return <Edit />;
      case 'type':
        return <HourglassTop />;
      default:
        return <Edit />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'traduccion':
        return 'Traducción';
      case 'proofreading':
        return 'Proofreading';
      case 'cleanRedrawer':
        return 'Clean/Redraw';
      case 'type':
        return 'Typesetting';
      default:
        return 'Edición';
    }
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
      traduccion: { count: 0, color: '#6a9eff', label: 'Traducción' },
      proofreading: { count: 0, color: '#a78bfa', label: 'Proofreading' },
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


  // Motivational quotes pool
  const quotes = [
    'Mark your mission to motivationate to proofers now to hand your mindlist!',
    'Cada capítulo traducido acerca una historia al mundo.',
    'El trabajo en equipo hace el sueño realidad.',
    'La constancia supera al talento.',
  ];
  const dailyQuote = quotes[new Date().getDay() % quotes.length];

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 3 }, mb: 4, px: { xs: 2, sm: 3 } }}>

        {/* ── Admin button (superadmin only) ── */}
        {isSuperAdmin() && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AdminPanelSettings />}
              onClick={() => navigate('/admin')}
              sx={{
                backgroundColor: '#e84855',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#c73a47' },
              }}
            >
              Panel de Admin
            </Button>
          </Box>
        )}

        {/* ── Pending reviews alert (chiefs only) ── */}
        {isChief && pendingReviews.count > 0 && (
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HourglassTop sx={{ color: '#f59e0b' }} />
                <Typography variant="body1" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                  Tienes {pendingReviews.count} revisión{pendingReviews.count > 1 ? 'es' : ''} pendiente{pendingReviews.count > 1 ? 's' : ''}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<RateReview />}
                onClick={() => navigate('/reviews')}
                size="small"
                sx={{
                  backgroundColor: '#f5a623',
                  color: 'white',
                  fontWeight: 600,
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#d9911e' },
                }}
              >
                Ir a Revisar
              </Button>
            </Box>
            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.5)' }}>
              Asignaciones de <strong>{pendingReviews.roleDescription}</strong> esperando tu aprobación
              {pendingReviews.detailedStats && pendingReviews.detailedStats.overdue > 0 && (
                <span style={{ color: '#ef4444', fontWeight: 600, marginLeft: '8px' }}>
                  • {pendingReviews.detailedStats.overdue} vencida{pendingReviews.detailedStats.overdue > 1 ? 's' : ''}
                </span>
              )}
            </Typography>
          </Alert>
        )}

        {/* ── User profile banner ── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            mb: 3,
            backgroundColor: 'rgba(23, 24, 29, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 } }}>
            <Avatar
              src={userProfile?.profileImage || userProfile?.photoURL || userProfile?.avatar}
              sx={{
                width: { xs: 56, sm: 72 },
                height: { xs: 56, sm: 72 },
                border: '2px solid rgba(106, 158, 255, 0.25)',
                flexShrink: 0,
              }}
            >
              {!(userProfile?.profileImage || userProfile?.photoURL || userProfile?.avatar) &&
                userProfile?.name?.substring(0, 2).toUpperCase()
              }
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#e2e4e9', lineHeight: 1.2 }}>
                  {userProfile?.name || 'Usuario'}
                </Typography>
                <Chip
                  label={getRoleDisplayName(userProfile?.role)}
                  size="small"
                  sx={{
                    background: 'rgba(106, 158, 255, 0.12)',
                    color: '#6a9eff',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#7d8190', mt: 0.5 }}>
                Miembro desde: {userProfile?.createdAt?.toDate?.()?.toLocaleDateString('es-ES') || 'N/A'}
              </Typography>
            </Box>
          </Box>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.35)', mt: 2, fontStyle: 'italic', fontSize: '0.8125rem' }}
          >
            {dailyQuote}
          </Typography>
        </Paper>

        {/* ── 4 stat cards ── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { value: myStats.total, label: 'Total', color: '#6a9eff' },
            { value: myStats.pending, label: 'Pendientes', color: '#f5a623' },
            { value: myStats.completed, label: 'Completadas', color: '#34a853' },
            { value: myStats.overdue, label: 'Atrasadas', color: '#e84855' },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Paper
                elevation={0}
                sx={{
                  textAlign: 'center',
                  py: { xs: 2, sm: 2.5 },
                  px: 1,
                  border: `1px solid ${stat.color}25`,
                  backgroundColor: `${stat.color}08`,
                  transition: 'border-color 0.2s ease',
                  '&:hover': { borderColor: `${stat.color}40` },
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: stat.color,
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    lineHeight: 1,
                    mb: 0.5,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ color: stat.color, fontWeight: 500, opacity: 0.8, fontSize: '0.8125rem' }}>
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* ── Info alerts ── */}
        {upcomingDeadlines.length === 0 && myStats.total > 0 && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              ¡Buen trabajo! No tienes fechas límite próximas. Mantén el ritmo.
            </Typography>
          </Alert>
        )}
        {myStats.total === 0 && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              No tienes asignaciones actualmente. Las nuevas tareas aparecerán aquí cuando te sean asignadas.
            </Typography>
          </Alert>
        )}

        {/* ── Charts row ── */}
        {myStats.total > 0 && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Bar chart */}
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Mi Actividad (Últimos 7 días)
                </Typography>
                {activityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <RechartsBarChart data={activityData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#7d8190' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#7d8190' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1b21',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          color: '#e2e4e9',
                          fontSize: '0.8125rem',
                        }}
                        labelStyle={{ color: '#7d8190' }}
                      />
                      <Bar dataKey="asignadas" fill="#6a9eff" name="Asignadas" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="completadas" fill="#34a853" name="Completadas" radius={[3, 3, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6, opacity: 0.5 }}>
                    <TrendingUp sx={{ fontSize: '2.5rem', mb: 1, color: '#7d8190' }} />
                    <Typography variant="body2" color="textSecondary">
                      No hay actividad reciente
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Pie chart */}
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Distribución por Tipo
                </Typography>
                {typeDistribution.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2 }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={typeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {typeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a1b21',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px',
                            color: '#e2e4e9',
                            fontSize: '0.8125rem',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ flexShrink: 0 }}>
                      {typeDistribution.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ color: '#7d8190', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                            {item.value} {item.name}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6, opacity: 0.5 }}>
                    <Assignment sx={{ fontSize: '2rem', mb: 1, color: '#7d8190' }} />
                    <Typography variant="body2" color="textSecondary">Sin datos</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* ── Active assignments table ── */}
        {myActiveAssignments.length > 0 && (
          <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden' }}>
            <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Mis Asignaciones Activas
              </Typography>
            </Box>

            {/* Table header – hidden on mobile */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'grid' },
                gridTemplateColumns: '1fr 140px 100px',
                px: 3,
                py: 1,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Typography variant="caption" sx={{ color: '#7d8190', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Título
              </Typography>
              <Typography variant="caption" sx={{ color: '#7d8190', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tipo
              </Typography>
              <Typography variant="caption" sx={{ color: '#7d8190', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                Acciones
              </Typography>
            </Box>

            {/* Table rows */}
            {myActiveAssignments.map((assignment) => (
              <Box
                key={assignment.id}
                sx={{
                  display: { xs: 'flex', sm: 'grid' },
                  flexDirection: { xs: 'column', sm: 'unset' },
                  gridTemplateColumns: { sm: '1fr 140px 100px' },
                  alignItems: 'center',
                  px: { xs: 2, sm: 3 },
                  py: 1.5,
                  gap: { xs: 0.5, sm: 0 },
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { backgroundColor: 'rgba(106, 158, 255, 0.04)' },
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#e2e4e9', fontSize: '0.875rem' }}>
                  {assignment.mangaTitle} - Cap. {assignment.chapter}
                </Typography>
                <Typography variant="body2" sx={{ color: '#7d8190', fontSize: '0.8125rem' }}>
                  {getTypeLabel(assignment.type)}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate('/my-works')}
                    sx={{
                      minWidth: 0,
                      px: 1.5,
                      py: 0.5,
                      fontSize: '0.75rem',
                      borderRadius: '20px',
                      backgroundColor: '#6a9eff',
                      boxShadow: 'none',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: '#5a8eef' },
                    }}
                  >
                    Ver
                  </Button>
                </Box>
              </Box>
            ))}
          </Paper>
        )}

        {/* ── Upcoming deadlines (compact) ── */}
        {upcomingDeadlines.length > 0 && (
          <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden' }}>
            <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Fechas Límite Próximas
              </Typography>
            </Box>
            {upcomingDeadlines.map((assignment) => {
              const daysUntil = getDaysUntilDeadline(assignment.dueDate);
              const deadlineColor = getDeadlineColor(daysUntil);
              return (
                <Box
                  key={assignment.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: { xs: 2, sm: 3 },
                    py: 1.5,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: deadlineColor,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#e2e4e9', fontSize: '0.875rem' }}>
                      {assignment.mangaTitle} - Cap. {assignment.chapter}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: deadlineColor, fontWeight: 600, flexShrink: 0, fontSize: '0.75rem' }}>
                    {daysUntil < 0
                      ? `Vencido (${Math.abs(daysUntil)}d)`
                      : daysUntil === 0
                      ? 'Hoy'
                      : daysUntil === 1
                      ? 'Mañana'
                      : `${daysUntil} días`
                    }
                  </Typography>
                </Box>
              );
            })}
          </Paper>
        )}

        {/* ── Footer ── */}
        <SystemFooter size="small" />
      </Container>
    </>
  );
};

export default Dashboard;
