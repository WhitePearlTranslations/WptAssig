import {
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Publish as PublishIcon,
  HourglassTop as HourglassTopIcon,
  ThumbUp as ThumbUpIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';

// Estados de asignación
export const ASSIGNMENT_STATUS = {
  SIN_ASIGNAR: 'sin_asignar',
  PENDIENTE: 'pendiente',
  EN_PROGRESO: 'en_progreso',
  PENDIENTE_APROBACION: 'pendiente_aprobacion', // Nuevo estado
  APROBADO: 'aprobado', // Nuevo estado
  COMPLETADO: 'completado', // Se mantiene para compatibilidad
  RETRASADO: 'retrasado',
  UPLOADED: 'uploaded'
};

// Configuración de estados (colores, iconos, etc.)
export const STATUS_CONFIG = {
  [ASSIGNMENT_STATUS.SIN_ASIGNAR]: {
    label: 'Sin Asignar',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    icon: <AssignmentIcon />
  },
  [ASSIGNMENT_STATUS.PENDIENTE]: {
    label: 'Pendiente',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    icon: <AssignmentIcon />
  },
  [ASSIGNMENT_STATUS.EN_PROGRESO]: {
    label: 'En Progreso',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    icon: <ScheduleIcon />
  },
  [ASSIGNMENT_STATUS.PENDIENTE_APROBACION]: {
    label: 'Esperando Aprobación',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    icon: <HourglassTopIcon />
  },
  [ASSIGNMENT_STATUS.APROBADO]: {
    label: 'Aprobado',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: <ThumbUpIcon />
  },
  [ASSIGNMENT_STATUS.COMPLETADO]: {
    label: 'Completado',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: <CheckCircleIcon />
  },
  [ASSIGNMENT_STATUS.RETRASADO]: {
    label: 'Retrasado',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: <WarningIcon />
  },
  [ASSIGNMENT_STATUS.UPLOADED]: {
    label: 'Subido',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    icon: <UploadIcon />
  }
};

// Roles del sistema
export const ROLES = {
  ADMIN: 'admin',
  JEFE_EDITOR: 'jefe_editor',
  JEFE_TRADUCTOR: 'jefe_traductor',
  EDITOR: 'editor',
  TRADUCTOR: 'traductor',
  UPLOADER: 'uploader',
};

// Tipos de trabajo
export const TASK_TYPES = {
  traduccion: 'Traducción',
  proofreading: 'Proofreading',
  cleanRedrawer: 'Clean/Redrawer',
  type: 'Typesetting'
};

// Configuración de roles para asignaciones
export const ROLE_CONFIG = {
  traductor: { label: 'Traductor', color: '#6366f1' },
  proofreading: { label: 'Proofreading', color: '#ec4899' },
  type: { label: 'Type', color: '#f59e0b' },
  cleanRedrawer: { label: 'Clean y Redrawer', color: '#10b981' }
};

// Configuración para tipo de asignaciones
export const ASSIGNMENT_TYPES = {
  traduccion: { label: 'Traducción', color: '#6366f1', short: 'T' },
  proofreading: { label: 'Proofreading', color: '#ec4899', short: 'P' },
  cleanRedrawer: { label: 'Clean/Redrawer', color: '#10b981', short: 'C' },
  type: { label: 'Typesetting', color: '#f59e0b', short: 'Ty' }
};

// Función para verificar si un usuario es un jefe o no
export const isChiefRole = (role) => {
  return role === ROLES.ADMIN || role === ROLES.JEFE_EDITOR || role === ROLES.JEFE_TRADUCTOR;
};

// Función para determinar el tipo de jefe (editor o traductor) basado en el tipo de asignación
export const matchChiefRoleForAssignmentType = (type) => {
  // Traducción y Proofreading son del área de Traducción
  if (['traduccion', 'proofreading'].includes(type)) {
    return ROLES.JEFE_TRADUCTOR;
  } 
  // Clean/Redrawer y Typesetting son del área de Edición
  if (['cleanRedrawer', 'type'].includes(type)) {
    return ROLES.JEFE_EDITOR;
  }
  return null;
};
