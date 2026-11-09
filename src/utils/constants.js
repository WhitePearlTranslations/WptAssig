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
import { colors, taskColors, withAlpha } from '../theme/tokens';

// Tono de una insignia de estado: texto en el tono, fondo del mismo tono al 10 %.
const tone = (color) => ({ color, bgColor: withAlpha(color, 0.1) });

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

// Configuración de estados (colores, iconos, etc.). Tonos según DESIGN.md:
// humo = nadie trabaja, niebla = en marcha, ámbar = espera a un jefe,
// lavanda = listo para el siguiente paso, verde = subido, rojo = retrasado.
export const STATUS_CONFIG = {
  [ASSIGNMENT_STATUS.SIN_ASIGNAR]: {
    label: 'Sin asignar',
    ...tone(colors.outline),
    icon: <AssignmentIcon />
  },
  [ASSIGNMENT_STATUS.PENDIENTE]: {
    label: 'Pendiente',
    ...tone(colors.onSurfaceVariant),
    icon: <AssignmentIcon />
  },
  [ASSIGNMENT_STATUS.EN_PROGRESO]: {
    label: 'En progreso',
    ...tone(colors.onSurface),
    icon: <ScheduleIcon />
  },
  [ASSIGNMENT_STATUS.PENDIENTE_APROBACION]: {
    label: 'Esperando aprobación',
    ...tone(colors.attention),
    icon: <HourglassTopIcon />
  },
  [ASSIGNMENT_STATUS.APROBADO]: {
    label: 'Aprobado',
    ...tone(colors.primary),
    icon: <ThumbUpIcon />
  },
  [ASSIGNMENT_STATUS.COMPLETADO]: {
    label: 'Completado',
    ...tone(colors.primary),
    icon: <CheckCircleIcon />
  },
  [ASSIGNMENT_STATUS.RETRASADO]: {
    label: 'Retrasado',
    ...tone(colors.error),
    icon: <WarningIcon />
  },
  // Devuelto por un jefe: espera que la persona lo rehaga (Rojo Espera)
  rechazado: {
    label: 'Rechazado',
    ...tone(colors.error),
    icon: <WarningIcon />
  },
  [ASSIGNMENT_STATUS.UPLOADED]: {
    label: 'Subido',
    ...tone(colors.goodNews),
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

// Nombre visible de cada rol (caja de frase)
export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.JEFE_EDITOR]: 'Jefe de edición',
  [ROLES.JEFE_TRADUCTOR]: 'Jefe de traducción',
  [ROLES.EDITOR]: 'Editor',
  [ROLES.TRADUCTOR]: 'Traductor',
  [ROLES.UPLOADER]: 'Uploader',
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
  traductor: { label: 'Traductor', color: taskColors.traduccion },
  proofreading: { label: 'Proofreading', color: taskColors.proofreading },
  type: { label: 'Type', color: taskColors.type },
  cleanRedrawer: { label: 'Clean y Redrawer', color: taskColors.cleanRedrawer }
};

// Configuración para tipo de asignaciones
export const ASSIGNMENT_TYPES = {
  traduccion: { label: 'Traducción', color: taskColors.traduccion, short: 'T' },
  proofreading: { label: 'Proofreading', color: taskColors.proofreading, short: 'P' },
  cleanRedrawer: { label: 'Clean/Redrawer', color: taskColors.cleanRedrawer, short: 'C' },
  type: { label: 'Typesetting', color: taskColors.type, short: 'Ty' }
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
