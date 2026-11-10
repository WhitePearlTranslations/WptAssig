/**
 * Piezas de interfaz compartidas (DESIGN.md). Las páginas de la fase 2 se
 * construyen con estas en lugar de repetir estilos a mano.
 */
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { colors, radius } from '../../theme/tokens';
import { STATUS_CONFIG, ASSIGNMENT_TYPES } from '../../utils/constants';

/** Título de página (headline 24/32) con subtítulo y acciones a la derecha. */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'flex-end' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h1" variant="h4" sx={{ textWrap: 'balance' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: colors.onSurfaceVariant, mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>{actions}</Box>}
    </Box>
  );
}

/** Panel de contenido: Pizarra Honda, radio 24, sin borde ni sombra. */
export function Panel({ title, count, action, children, sx, contentSx, ...props }) {
  return (
    <Paper
      component="section"
      sx={{ borderRadius: `${radius.xl}px`, p: { xs: 2, sm: 2.5 }, ...sx }}
      {...props}
    >
      {(title || action) && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
          <Typography component="h2" variant="subtitle2" sx={{ color: colors.onSurface }}>
            {title}
            {count != null && (
              <Box component="span" sx={{ ml: 0.75, color: colors.outline, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {count}
              </Box>
            )}
          </Typography>
          {action}
        </Box>
      )}
      <Box sx={contentSx}>{children}</Box>
    </Paper>
  );
}

/** Insignia de estado: texto en el tono, fondo del tono al 10 %, radio 12. */
export function StatusBadge({ status, sx }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 22,
        px: 0.875,
        borderRadius: `${radius.md}px`,
        backgroundColor: config.bgColor,
        color: config.color,
        fontSize: '0.6875rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...sx,
      }}
    >
      {config.label}
    </Box>
  );
}

/** Tipo de tarea: punto de color (el tono va en el icono) + nombre en Niebla. */
export function TaskTypeTag({ type, sx }) {
  const config = ASSIGNMENT_TYPES[type];
  const color = config?.color ?? colors.outline;
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: colors.onSurfaceVariant, ...sx }}>
      <Box component="span" aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      {config?.label ?? 'Otro'}
    </Box>
  );
}

/** Barra horizontal fina para rankings y repartos. */
export function MeterBar({ value, max, color = colors.primary }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <Box sx={{ height: 4, borderRadius: 999, backgroundColor: colors.surfaceHigh, overflow: 'hidden' }}>
      {/* Se anima con transform (no con width) para no recalcular el layout. */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 999,
          backgroundColor: color,
          transform: `scaleX(${pct / 100})`,
          transformOrigin: 'left center',
          transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </Box>
  );
}

/** Estado vacío que explica qué aparecerá ahí, no solo «no hay nada». */
export function EmptyState({ icon: Icon, title, children }) {
  return (
    <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
      {Icon && <Icon sx={{ fontSize: 28, color: colors.outline, mb: 1 }} aria-hidden="true" />}
      <Typography variant="subtitle2" sx={{ color: colors.onSurface }}>
        {title}
      </Typography>
      {children && (
        <Typography variant="body2" sx={{ color: colors.onSurfaceVariant, mt: 0.5, maxWidth: '42ch', mx: 'auto' }}>
          {children}
        </Typography>
      )}
    </Box>
  );
}
