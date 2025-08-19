import React from 'react';
import { Badge, Chip, Box, Typography, Tooltip } from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  HourglassTop as HourglassTopIcon 
} from '@mui/icons-material';

// Componente básico de badge para mostrar notificaciones
export const NotificationBadge = ({ 
  count, 
  color = 'error', 
  variant = 'standard',
  invisible = false,
  children,
  max = 99
}) => {
  return (
    <Badge 
      badgeContent={count} 
      color={color}
      variant={variant}
      invisible={invisible || count === 0}
      max={max}
      sx={{
        '& .MuiBadge-badge': {
          animation: count > 0 ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
            },
            '50%': {
              transform: 'scale(1.1)',
            },
            '100%': {
              transform: 'scale(1)',
            },
          },
        }
      }}
    >
      {children}
    </Badge>
  );
};

// Componente especializado para revisiones pendientes
export const PendingReviewBadge = ({ 
  count, 
  showIcon = true, 
  showText = false, 
  size = 'medium',
  onClick,
  tooltip = true 
}) => {
  const getSizeProps = (size) => {
    switch (size) {
      case 'small':
        return {
          iconSize: 'small',
          chipSize: 'small',
          fontSize: '0.875rem'
        };
      case 'large':
        return {
          iconSize: 'large', 
          chipSize: 'medium',
          fontSize: '1.125rem'
        };
      default:
        return {
          iconSize: 'medium',
          chipSize: 'medium', 
          fontSize: '1rem'
        };
    }
  };

  const { iconSize, chipSize, fontSize } = getSizeProps(size);

  const badgeContent = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {showIcon && (
        <NotificationBadge count={count} max={999}>
          <HourglassTopIcon 
            color={count > 0 ? 'warning' : 'action'} 
            fontSize={iconSize}
          />
        </NotificationBadge>
      )}
      
      {showText && (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: fontSize,
            fontWeight: count > 0 ? 600 : 400,
            color: count > 0 ? '#f59e0b' : 'text.secondary'
          }}
        >
          {count > 0 ? `${count} revisión${count > 1 ? 'es' : ''} pendiente${count > 1 ? 's' : ''}` : 'No hay revisiones pendientes'}
        </Typography>
      )}
    </Box>
  );

  const clickableContent = onClick ? (
    <Box 
      onClick={onClick}
      sx={{ 
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: 'scale(1.05)'
        }
      }}
    >
      {badgeContent}
    </Box>
  ) : badgeContent;

  if (tooltip && count > 0) {
    return (
      <Tooltip 
        title={`Tienes ${count} revisión${count > 1 ? 'es' : ''} pendiente${count > 1 ? 's' : ''} de aprobación`}
        arrow
        placement="bottom"
      >
        {clickableContent}
      </Tooltip>
    );
  }

  return clickableContent;
};

// Componente para chip/tarjeta de notificación más prominente
export const ReviewNotificationCard = ({ 
  count, 
  title = "Revisiones Pendientes",
  subtitle,
  onClick,
  variant = 'outlined'
}) => {
  if (count === 0) return null;

  const displaySubtitle = subtitle || 
    `${count} asignación${count > 1 ? 'es' : ''} esperando tu aprobación`;

  return (
    <Chip
      icon={<HourglassTopIcon />}
      label={
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {title}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {displaySubtitle}
          </Typography>
        </Box>
      }
      onClick={onClick}
      variant={variant}
      sx={{
        height: 'auto',
        py: 1,
        px: 2,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        color: '#f59e0b',
        cursor: onClick ? 'pointer' : 'default',
        '& .MuiChip-icon': {
          color: '#f59e0b',
        },
        '&:hover': onClick ? {
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          borderColor: 'rgba(245, 158, 11, 0.4)',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)'
        } : {}
      }}
    />
  );
};

export default NotificationBadge;
