import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, ButtonBase, Grid } from '@mui/material';
import {
  ErrorOutlineRounded,
  ScheduleRounded,
  RateReviewOutlined,
  CheckCircleOutlineRounded,
  ChevronRightRounded,
  AssignmentOutlined,
} from '@mui/icons-material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import { usePendingReviews } from '../hooks/usePendingReviews';
import { triggerHaptic } from '../hooks/useWebHaptics';
import SystemFooter from '../components/SystemFooter';
import { PageHeader, Panel, StatusBadge, TaskTypeTag, MeterBar, EmptyState } from '../components/ui';
import { ASSIGNMENT_TYPES } from '../utils/constants';
import { colors, radius, divider, rowDivider, focusOutline } from '../theme/tokens';

const ROLE_NAMES = {
  admin: 'Administrador',
  jefe_editor: 'Jefe de edición',
  jefe_traductor: 'Jefe de traducción',
  editor: 'Editor',
  traductor: 'Traductor',
  uploader: 'Uploader',
};

const DAY_MS = 24 * 60 * 60 * 1000;

const isPending = (s) => s === 'pending' || s === 'pendiente';
const isInProgress = (s) => s === 'in_progress' || s === 'en_progreso';
const isCompleted = (s) => s === 'completed' || s === 'completado';

const daysUntil = (dueDate) => Math.ceil((new Date(dueDate) - new Date()) / DAY_MS);

const deadlineText = (days) => {
  if (days < 0) return `Venció hace ${Math.abs(days)} ${Math.abs(days) === 1 ? 'día' : 'días'}`;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  return `Vence en ${days} días`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
};

const toDateStr = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.split('T')[0];
  return value.toDate?.()?.toISOString().split('T')[0] ?? null;
};

// Últimos 7 días: asignadas y completadas por día.
const generateActivityData = (assignments) => {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      day: `${date.toLocaleDateString('es-ES', { weekday: 'short' })} ${date.getDate()}`,
      completadas: assignments.filter(
        (a) => isCompleted(a.status) && toDateStr(a.completedDate || a.updatedAt) === dateStr
      ).length,
      asignadas: assignments.filter((a) => toDateStr(a.assignedDate || a.createdAt) === dateStr).length,
    });
  }
  return days;
};

const generateTypeDistribution = (assignments) =>
  Object.entries(ASSIGNMENT_TYPES)
    .map(([type, cfg]) => ({
      type,
      label: cfg.label,
      color: cfg.color,
      value: assignments.filter((a) => a.type === type).length,
    }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value);

/** Una fila de la franja de pendientes: icono teñido, cifra, frase y flecha. */
function PendingItem({ icon: Icon, tone, count, label, detail, onClick }) {
  return (
    <ButtonBase
      onClick={() => {
        triggerHaptic('light');
        onClick();
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flex: '1 1 240px',
        minHeight: 56,
        px: 1.5,
        py: 1,
        borderRadius: `${radius.lg}px`,
        backgroundColor: colors.surfaceContainer,
        textAlign: 'left',
        transition: 'background-color 150ms ease-out, transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': { backgroundColor: colors.surfaceHigh },
        '&:active': { transform: 'scale(0.98)' },
        '&.Mui-focusVisible': focusOutline,
      }}
    >
      <Icon sx={{ fontSize: 20, color: tone, flexShrink: 0 }} aria-hidden="true" />
      <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: colors.onSurface }}>
        {count}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.875rem', color: colors.onSurface, lineHeight: 1.35 }}>{label}</Typography>
        {detail && (
          <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, lineHeight: 1.35 }}>{detail}</Typography>
        )}
      </Box>
      <ChevronRightRounded sx={{ fontSize: 18, color: colors.outline }} aria-hidden="true" />
    </ButtonBase>
  );
}

/** Fila de una asignación activa. Toda la fila lleva a «Mis trabajos». */
function AssignmentRow({ assignment, onOpen }) {
  const days = assignment.dueDate ? daysUntil(assignment.dueDate) : null;
  const overdue = days !== null && days < 0;
  const soon = days !== null && days >= 0 && days <= 2;
  return (
    <Box component="li" sx={{ listStyle: 'none', '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` } }}>
      <ButtonBase
        onClick={onOpen}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1,
          py: 1.25,
          borderRadius: `${radius.md}px`,
          textAlign: 'left',
          transition: 'background-color 150ms ease-out',
          '&:hover': { backgroundColor: colors.surfaceContainer },
          '&.Mui-focusVisible': { ...focusOutline, outlineOffset: -2 },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Se recorta el título de la serie, nunca el número de capítulo. */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, fontSize: '0.875rem', minWidth: 0 }}>
            <Typography noWrap component="span" sx={{ fontSize: 'inherit', fontWeight: 500, color: colors.onSurface, minWidth: 0 }}>
              {assignment.mangaTitle}
            </Typography>
            <Box
              component="span"
              sx={{ flexShrink: 0, color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
            >
              Cap. {assignment.chapter}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, fontSize: '0.75rem', flexWrap: 'wrap' }}>
            <TaskTypeTag type={assignment.type} />
            {days !== null && (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: colors.onSurfaceVariant }}>
                <Box component="span" aria-hidden="true">·</Box>
                {(overdue || soon) && (
                  <ScheduleRounded
                    aria-hidden="true"
                    sx={{ fontSize: 14, color: overdue ? colors.error : colors.attention }}
                  />
                )}
                {deadlineText(days)}
              </Box>
            )}
          </Box>
        </Box>
        <StatusBadge status={assignment.status} />
      </ButtonBase>
    </Box>
  );
}

const chartTooltipStyle = {
  backgroundColor: colors.surfaceHighest,
  border: 'none',
  borderRadius: radius.DEFAULT,
  color: colors.onSurface,
  fontSize: '0.75rem',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
};

const Dashboard = () => {
  const { userProfile, hasRole } = useAuth();
  const navigate = useNavigate();
  const [myAssignments, setMyAssignments] = useState([]);

  const pendingReviews = usePendingReviews();
  const isChief = hasRole(ROLES.ADMIN) || hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR);

  useEffect(() => {
    let unsubscribe = null;
    const init = async () => {
      if (!userProfile?.uid) return;
      try {
        unsubscribe = await realtimeService.subscribeToAssignments((assignments) => {
          setMyAssignments(assignments.filter((a) => a.assignedTo === userProfile.uid));
        });
      } catch (error) {
        // Sin conexión con la base de datos: el panel se queda vacío.
      }
    };
    init();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [userProfile]);

  const data = useMemo(() => {
    const active = myAssignments
      .filter((a) => a.status !== 'completado' && a.status !== 'uploaded')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    const open = (a) => isPending(a.status) || isInProgress(a.status);
    const overdue = myAssignments.filter((a) => a.dueDate && daysUntil(a.dueDate) < 0 && open(a)).length;
    const dueSoon = active.filter((a) => {
      if (!a.dueDate) return false;
      const d = daysUntil(a.dueDate);
      return d >= 0 && d <= 2;
    }).length;
    return {
      active,
      overdue,
      dueSoon,
      stats: {
        total: myAssignments.length,
        pending: myAssignments.filter((a) => isPending(a.status)).length,
        inProgress: myAssignments.filter((a) => isInProgress(a.status)).length,
        completed: myAssignments.filter((a) => isCompleted(a.status)).length,
      },
      activity: generateActivityData(myAssignments),
      types: generateTypeDistribution(myAssignments),
    };
  }, [myAssignments]);

  const reviewsCount = isChief ? pendingReviews.count : 0;
  const reviewsOverdue = pendingReviews.detailedStats?.overdue ?? 0;
  const hasPending = data.overdue > 0 || data.dueSoon > 0 || reviewsCount > 0;
  const goToWorks = () => navigate('/myworks');
  const firstName = (userProfile?.name || '').split(' ')[0];

  const subtitle = [
    firstName ? `${greeting()}, ${firstName}` : greeting(),
    ROLE_NAMES[userProfile?.role],
    `${data.active.length} ${data.active.length === 1 ? 'capítulo activo' : 'capítulos activos'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const maxType = Math.max(0, ...data.types.map((t) => t.value));

  return (
    <Box>
      <PageHeader title="Panel" subtitle={subtitle} />

      {/* Franja de pendientes: solo aparece lo que tiene trabajo */}
      <Panel
        aria-label="Lo que espera"
        sx={{ mb: 2, p: { xs: 1.5, sm: 1.5 } }}
        contentSx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
      >
        {hasPending ? (
          <>
            {data.overdue > 0 && (
              <PendingItem
                icon={ErrorOutlineRounded}
                tone={colors.error}
                count={data.overdue}
                label={data.overdue === 1 ? 'capítulo retrasado' : 'capítulos retrasados'}
                detail="Ya pasó su fecha límite"
                onClick={goToWorks}
              />
            )}
            {data.dueSoon > 0 && (
              <PendingItem
                icon={ScheduleRounded}
                tone={colors.attention}
                count={data.dueSoon}
                label={data.dueSoon === 1 ? 'vence en 48 horas' : 'vencen en 48 horas'}
                onClick={goToWorks}
              />
            )}
            {reviewsCount > 0 && (
              <PendingItem
                icon={RateReviewOutlined}
                tone={colors.attention}
                count={reviewsCount}
                label={reviewsCount === 1 ? 'entrega espera tu revisión' : 'entregas esperan tu revisión'}
                detail={
                  reviewsOverdue > 0
                    ? `${reviewsOverdue} ${reviewsOverdue === 1 ? 'lleva' : 'llevan'} más tiempo del previsto`
                    : pendingReviews.roleDescription
                }
                onClick={() => navigate('/reviews')}
              />
            )}
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.75 }}>
            <CheckCircleOutlineRounded sx={{ fontSize: 18, color: colors.goodNews }} aria-hidden="true" />
            <Typography sx={{ fontSize: '0.875rem', color: colors.onSurface }}>
              Todo al día: nada retrasado ni por revisar.
            </Typography>
          </Box>
        )}
      </Panel>

      <Grid container spacing={2} alignItems="flex-start">
        {/* Izquierda: el trabajo */}
        <Grid item xs={12} md={8}>
          <Panel title="Mis asignaciones activas" count={data.active.length}>
            {data.active.length > 0 ? (
              <Box component="ul" sx={{ m: 0, p: 0, mx: -1 }}>
                {data.active.map((a) => (
                  <AssignmentRow
                    key={a.id}
                    assignment={a}
                    onOpen={() => {
                      triggerHaptic('light');
                      goToWorks();
                    }}
                  />
                ))}
              </Box>
            ) : (
              <EmptyState icon={AssignmentOutlined} title="No tienes capítulos asignados">
                Cuando un jefe te asigne uno, aparecerá aquí ordenado por fecha límite.
              </EmptyState>
            )}
          </Panel>
        </Grid>

        {/* Derecha: cómo va */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Panel title="Tu actividad">
              <Box
                component="dl"
                sx={{ m: 0, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', rowGap: 1.5, columnGap: 2, mb: 2 }}
              >
                {[
                  ['Total', data.stats.total],
                  ['En progreso', data.stats.inProgress],
                  ['Pendientes', data.stats.pending],
                  ['Completadas', data.stats.completed],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography component="dt" sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
                      {label}
                    </Typography>
                    <Typography
                      component="dd"
                      sx={{ m: 0, fontSize: '1.25rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: colors.onSurface }}
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ borderTop: `1px solid ${divider}`, pt: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
                  <Box component="span" sx={{ flex: 1 }}>Últimos 7 días</Box>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="span" sx={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: colors.outline }} />
                    Asignadas
                  </Box>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="span" sx={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: colors.primary }} />
                    Completadas
                  </Box>
                </Box>
                <ResponsiveContainer width="100%" height={150}>
                  <RechartsBarChart data={data.activity} margin={{ top: 4, right: 0, left: -28, bottom: 0 }} barGap={2}>
                    <CartesianGrid vertical={false} stroke={divider} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: colors.outline }} interval={0} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: colors.outline }} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: colors.surfaceContainer }}
                      contentStyle={chartTooltipStyle}
                      labelStyle={{ color: colors.onSurfaceVariant }}
                    />
                    <Bar dataKey="asignadas" fill={colors.outline} name="Asignadas" radius={[3, 3, 0, 0]} maxBarSize={14} />
                    <Bar dataKey="completadas" fill={colors.primary} name="Completadas" radius={[3, 3, 0, 0]} maxBarSize={14} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Box>
            </Panel>

            {data.types.length > 0 && (
              <Panel title="Por tipo de tarea">
                <Box component="ol" sx={{ m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {data.types.map((t) => (
                    <Box component="li" key={t.type} sx={{ listStyle: 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, fontSize: '0.8125rem' }}>
                        <TaskTypeTag type={t.type} />
                        <Box component="span" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: colors.onSurface }}>
                          {t.value}
                        </Box>
                      </Box>
                      <MeterBar value={t.value} max={maxType} color={t.color} />
                    </Box>
                  ))}
                </Box>
              </Panel>
            )}
          </Box>
        </Grid>
      </Grid>

      <SystemFooter size="small" />
    </Box>
  );
};

export default Dashboard;
