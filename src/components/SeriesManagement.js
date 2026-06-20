import React, { useState, useEffect } from 'react';
import './SeriesManagement.css';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Collapse,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  LinearProgress,
  CircularProgress,
  Alert,
  Fab,
  Snackbar,
  DialogContentText,
  Tabs,
  Tab,
  Autocomplete,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  Book as BookIcon,
  CalendarToday as CalendarIcon,
  Link as LinkIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Refresh as RefreshIcon,
  MenuBook as MenuBookIcon,
  PlaylistAdd as PlaylistAddIcon,
  Work as WorkIcon,
  AccountCircle as AccountCircleIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import { getUniqueUsers } from '../utils/cleanDuplicateUsers';
import { formatLocalDate, isoStringToDateInput, dateInputToISOString } from '../utils/dateUtils';

// Estados y configuraciones
const ASSIGNMENT_STATUS = {
  PENDIENTE: 'pendiente',
  EN_PROGRESO: 'en_progreso',
  COMPLETADO: 'completado',
  RETRASADO: 'retrasado',
  SIN_ASIGNAR: 'sin_asignar',
  UPLOADED: 'uploaded'
};

const STATUS_CONFIG = {
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
  [ASSIGNMENT_STATUS.COMPLETADO]: {
    label: 'Completado',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: <CheckCircleIcon />
  },
  'aprobado': {
    label: 'Aprobado',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: <CheckCircleIcon />
  },
  'pendiente_aprobacion': {
    label: 'Esperando Aprobación',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    icon: <ScheduleIcon />
  },
  [ASSIGNMENT_STATUS.RETRASADO]: {
    label: 'Retrasado',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: <WarningIcon />
  },
  [ASSIGNMENT_STATUS.SIN_ASIGNAR]: {
    label: 'Sin Asignar',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    icon: <AssignmentIcon />
  },
  [ASSIGNMENT_STATUS.UPLOADED]: {
    label: 'Subido',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    icon: <UploadIcon />
  }
};

const ASSIGNMENT_TYPES = {
  traduccion: { label: 'Traducción', color: '#6a9eff', short: 'T' },
  proofreading: { label: 'Proofreading', color: '#a78bfa', short: 'P' },
  cleanRedrawer: { label: 'Clean/Redrawer', color: '#10b981', short: 'C' },
  type: { label: 'Typesetting', color: '#f59e0b', short: 'Ty' }
};

const MANGA_STATUS = {
  active: { label: 'Activo', color: '#10b981' },
  completed: { label: 'Completado', color: '#6a9eff' },
  paused: { label: 'Pausado', color: '#f59e0b' },
  cancelled: { label: 'Cancelado', color: '#ef4444' },
  hiatus: { label: 'Hiato', color: '#6b7280' }
};

// Componente para mostrar información de asignación
const AssignmentInfo = ({ assignment, users }) => {
  if (!assignment) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.5 }}>
        <AssignmentIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">
          Sin asignar
        </Typography>
      </Box>
    );
  }

  // Buscar usuario por uid o id
  const assignedUser = users.find(u => (u.uid || u.id) === assignment.assignedTo);
  const statusConfig = STATUS_CONFIG[assignment.status] || STATUS_CONFIG[ASSIGNMENT_STATUS.PENDIENTE];
  const typeConfig = ASSIGNMENT_TYPES[assignment.type] || ASSIGNMENT_TYPES.traduccion;

  // Manejar caso de asignación sin usuario asignado
  if (!assignment.assignedTo || assignment.status === 'sin_asignar') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.7 }}>
        <Tooltip title={`${typeConfig.label}: Capítulo creado sin asignar`}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: '0.65rem',
              bgcolor: `rgba(107, 114, 128, 0.1)`,
              color: '#6b7280',
              border: `1px solid rgba(107, 114, 128, 0.2)`,
              fontWeight: 600,
            }}
          >
            ?
          </Avatar>
        </Tooltip>
        <Box>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 500, color: 'text.secondary' }}>
            Sin asignar
          </Typography>
          <Chip
            size="small"
            label="Sin Asignar"
            sx={{
              fontSize: '0.65rem',
              height: 16,
              backgroundColor: 'rgba(107, 114, 128, 0.1)',
              color: '#6b7280',
              '& .MuiChip-label': { px: 0.5 }
            }}
          />
        </Box>
      </Box>
    );
  }

  // Usar el nombre almacenado en la asignación si no se encuentra el usuario
  const userName = assignedUser?.name || assignment.assignedToName || 'Usuario desconocido';
  // Buscar imagen en múltiples campos posibles
  const userPhotoURL = assignedUser?.profileImage || assignedUser?.photoURL || assignedUser?.avatar;


  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={`${typeConfig.label}: ${userName}`}>
        <Avatar
          src={userPhotoURL} // Usar foto de perfil si está disponible
          sx={{
            width: 32,
            height: 32,
            fontSize: '0.75rem',
            // Diseño cuando HAY foto
            ...(userPhotoURL && {
              bgcolor: 'transparent',
              border: `2px solid ${typeConfig.color}60`,
              boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
            }),
            // Diseño cuando NO hay foto (mostrar iniciales)
            ...(!userPhotoURL && {
              bgcolor: typeConfig.color,
              color: 'white',
              border: `2px solid ${typeConfig.color}`,
              boxShadow: `0 2px 8px ${typeConfig.color}40`,
              background: `linear-gradient(135deg, ${typeConfig.color}, ${typeConfig.color}dd)`,
            }),
            fontWeight: 700,
            letterSpacing: '0.5px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: userPhotoURL 
                ? '0 6px 20px rgba(0,0,0,0.25)' 
                : `0 4px 16px ${typeConfig.color}60`,
            }
          }}
        >
          {/* Solo mostrar iniciales si no hay foto */}
          {!userPhotoURL && userName.substring(0, 2).toUpperCase()}
        </Avatar>
      </Tooltip>
      <Box>
        <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
          {userName}
        </Typography>
        <Chip
          size="small"
          label={statusConfig.label}
          sx={{
            fontSize: '0.65rem',
            height: 16,
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.color,
            '& .MuiChip-label': { px: 0.5 }
          }}
        />
      </Box>
    </Box>
  );
};

// Componente para mostrar asignaciones de un manga organizado por capítulos
const AssignmentsTable = ({ manga, assignments, users, onAssignmentClick, onCreateAssignment, onCreateChapter, onDeleteAssignment, userProfile, chapters, onMarkUploaded, onMarkNotUploaded, onEditUnavailableTask }) => {
  // Mapeo de nombres de tareas de la DB a los nombres internos
  const taskMapping = {
    'traduccion': 'traduccion',
    'proofreading': 'proofreading', 
    'limpieza': 'cleanRedrawer',
    'clean': 'cleanRedrawer',
    'cleanRedrawer': 'cleanRedrawer',
    'typesetting': 'type',
    'type': 'type'
  };

  // Normalizar availableTasks si es un manga joint
  const normalizedAvailableTasks = manga.isJoint && manga.availableTasks 
    ? manga.availableTasks
        .filter(task => task !== 'edicion') // Filtrar completamente la tarea 'edicion'
        .map(task => taskMapping[task] || task)
        .filter(Boolean)
    : null;
    
  // Debug information removed for production

  // Filtrar asignaciones de este manga
  let mangaAssignments = assignments.filter(assignment => assignment.mangaId === manga.id);
  
  // Si es un manga joint, filtrar solo las tareas permitidas
  if (manga.isJoint && normalizedAvailableTasks && normalizedAvailableTasks.length > 0) {
    mangaAssignments = mangaAssignments.filter(assignment => 
      normalizedAvailableTasks.includes(assignment.type)
    );
  }
  
  // Obtener capítulos independientes para este manga
  const independentChapters = chapters[manga.id] || [];
  
  // Agrupar asignaciones por capítulo
  const chapterGroups = mangaAssignments.reduce((groups, assignment) => {
    const chapter = assignment.chapter;
    if (!groups[chapter]) {
      groups[chapter] = {
        traduccion: null,
        proofreading: null,
        cleanRedrawer: null,
        type: null,
        isIndependent: false
      };
    }
    groups[chapter][assignment.type] = assignment;
    return groups;
  }, {});
  
  // Añadir capítulos independientes que no tengan asignaciones
  independentChapters.forEach(chapter => {
    const chapterNumber = chapter.chapter;
    if (!chapterGroups[chapterNumber]) {
      chapterGroups[chapterNumber] = {
        traduccion: null,
        proofreading: null,
        cleanRedrawer: null,
        type: null,
        isIndependent: true,
        chapterData: chapter // Guardar datos del capítulo independiente
      };
    } else {
      // Si ya existe un grupo para este capítulo, marcar que también tiene datos independientes
      chapterGroups[chapterNumber].chapterData = chapter;
    }
  });

  // Obtener capítulos únicos y ordenarlos
  const chapterNumbers = Object.keys(chapterGroups).sort((a, b) => parseInt(a) - parseInt(b));

  if (chapterNumbers.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <PlaylistAddIcon sx={{ fontSize: '3rem', color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No hay asignaciones para este manga
        </Typography>
        {/* Botón para crear primer capítulo - solo para jefes y admins */}
        {(userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') && (
          <Button
            startIcon={<AddIcon />}
            onClick={() => onCreateChapter(manga)}
            sx={{ mt: 2 }}
          >
            Crear primer capítulo
          </Button>
        )}
      </Box>
    );
  }

  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        mb: 2,
        mt: 1.5,
        background: 'rgba(15, 16, 20, 0.5)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '10px',
        boxShadow: 'none',
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { borderBottom: '1px solid rgba(255,255,255,0.06)', py: 1.5 } }}>
            <TableCell sx={{ fontWeight: 600, color: '#7d8190', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cap.</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#7d8190', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Traducción</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#7d8190', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proofreading</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#7d8190', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clean/Redraw</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#7d8190', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Typesetting</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#7d8190', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {chapterNumbers.map(chapter => {
            const chapterData = chapterGroups[chapter];
            
            
            // Verificar si todo el capítulo está completado
            // Para mangas joint, considerar solo las tareas disponibles configuradas
            const validTaskTypes = manga.isJoint && normalizedAvailableTasks
              ? normalizedAvailableTasks
              : ['traduccion', 'proofreading', 'cleanRedrawer', 'type'];
            
            // FILTRAR SOLO ASIGNACIONES VÁLIDAS (con type definido y que no sean datos de capítulo)
            const allAssignments = Object.values(chapterData).filter(assignment => 
              assignment !== null && 
              assignment.type && // Debe tener tipo definido
              assignment.type !== undefined && // No debe ser undefined
              typeof assignment.type === 'string' && // Debe ser string
              validTaskTypes.includes(assignment.type) // Solo tipos válidos para este manga
            );
            
            const assignedAssignments = allAssignments.filter(assignment => 
              assignment.assignedTo && assignment.status !== 'sin_asignar'
            );
            
            // Verificar diferentes estados del capítulo
            const assignedCount = assignedAssignments.length;
            
            // LÓGICA CORREGIDA: Un capítulo está completado (verde) si:
            // - Para mangas NORMALES: Tiene las 4 tareas completas (traduccion, proofreading, cleanRedrawer, type)
            // - Para mangas JOINT: Tiene todas las tareas configuradas en availableTasks completas
            // 
            // Para mangas joint, el total de asignaciones requeridas depende de availableTasks
            const requiredTaskCount = manga.isJoint && normalizedAvailableTasks 
              ? normalizedAvailableTasks.length 
              : 4; // traduccion, proofreading, cleanRedrawer, type
            
            const isChapterCompleted = allAssignments.length === requiredTaskCount && 
              assignedAssignments.length === requiredTaskCount &&
              assignedAssignments.every(assignment => 
                assignment.status === 'completado' || assignment.status === 'aprobado'
              );
              
            // Debug information removed for production
            
            // Un capítulo está subido (azul) si:
            // 1. Tiene al menos una asignación, Y
            // 2. TODAS las asignaciones existentes están asignadas a usuarios, Y
            // 3. TODAS las asignaciones existentes están subidas
            const isChapterUploaded = allAssignments.length > 0 && 
              assignedAssignments.length === allAssignments.length &&
              assignedAssignments.every(assignment => assignment.status === 'uploaded');
            
            // Un capítulo tiene trabajo en progreso (amarillo) si:
            // 1. Hay al menos una asignación asignada a un usuario, Y
            // 2. No está completamente terminado ni subido
            const hasWorkInProgress = assignedCount > 0 && !isChapterCompleted && !isChapterUploaded;
            
            
            const rowColor = isChapterUploaded ? '#3b82f6' 
              : isChapterCompleted ? '#10b981' 
              : hasWorkInProgress ? '#f59e0b' 
              : null;

            return (
              <TableRow
                key={chapter}
                className="sm-table-row"
                sx={{
                  '& td': {
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    py: 1.5,
                    position: 'relative',
                  },
                  ...(rowColor && {
                    backgroundColor: `${rowColor}08`,
                    '& td:first-of-type::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 4,
                      bottom: 4,
                      width: '3px',
                      backgroundColor: rowColor,
                      borderRadius: '0 2px 2px 0',
                    }
                  }),
                }}
              >
                <TableCell>
                  <Typography fontWeight={600} color="text.primary" sx={{ fontSize: '0.875rem' }}>
                    Capítulo {chapter}
                  </Typography>
                </TableCell>
                
                {/* Traducción */}
                <TableCell>
                  {/* Solo mostrar si la traducción está permitida en mangas joint */}
                  {(!manga.isJoint || !normalizedAvailableTasks || normalizedAvailableTasks.includes('traduccion')) ? (
                    chapterData.traduccion ? (
                    // Si existe asignación pero sin usuario asignado
                    (!chapterData.traduccion.assignedTo || chapterData.traduccion.status === 'sin_asignar') ? (
                      // Solo admins y jefes pueden asignar
                      (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => onAssignmentClick(chapterData.traduccion)}
                          sx={{ fontSize: '0.75rem', px: 1, py: 0.5 }}
                        >
                          Asignar
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No Asignado Aún
                        </Typography>
                      )
                    ) : (
                      // Solo admins y jefes pueden editar asignaciones existentes
                      (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                        <Box sx={{ cursor: 'pointer' }} onClick={() => onAssignmentClick(chapterData.traduccion)}>
                          <AssignmentInfo assignment={chapterData.traduccion} users={users} />
                        </Box>
                      ) : (
                        <Box sx={{ cursor: 'default' }}>
                          <AssignmentInfo assignment={chapterData.traduccion} users={users} />
                        </Box>
                      )
                    )
                  ) : (
                    // Solo admins y jefes pueden crear asignaciones
                    (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => onCreateAssignment(manga, chapter, 'traduccion')}
                        sx={{ fontSize: '0.75rem', px: 1, py: 0.5 }}
                      >
                        Asignar
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No Asignado Aún
                      </Typography>
                    )
                  )
                ) : (
                  // Tarea no disponible para este manga joint - mostrar texto personalizable
                  (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                    <Box
                      sx={{ cursor: 'pointer' }}
                      onClick={() => onEditUnavailableTask(manga, chapter, 'traduccion')}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.7, textDecoration: 'underline' }}>
                        {chapterData.chapterData?.unavailableTexts?.traduccion || 'No disponible - Click para editar'}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                      {chapterData.chapterData?.unavailableTexts?.traduccion || 'No disponible'}
                    </Typography>
                  )
                )}
                </TableCell>

                {/* Proofreading */}
                <TableCell>
                  {/* Solo mostrar si el proofreading está permitido en mangas joint */}
                  {(!manga.isJoint || !normalizedAvailableTasks || normalizedAvailableTasks.includes('proofreading')) ? (
                    chapterData.proofreading ? (
                    // Si existe asignación pero sin usuario asignado
                    (!chapterData.proofreading.assignedTo || chapterData.proofreading.status === 'sin_asignar') ? (
                      // Solo admins y jefes pueden asignar
                      (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => onAssignmentClick(chapterData.proofreading)}
                          sx={{ fontSize: '0.75rem', px: 1, py: 0.5 }}
                        >
                          Asignar
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No Asignado Aún
                        </Typography>
                      )
                    ) : (
                      // Solo admins y jefes pueden editar asignaciones existentes
                      (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                        <Box sx={{ cursor: 'pointer' }} onClick={() => onAssignmentClick(chapterData.proofreading)}>
                          <AssignmentInfo assignment={chapterData.proofreading} users={users} />
                        </Box>
                      ) : (
                        <Box sx={{ cursor: 'default' }}>
                          <AssignmentInfo assignment={chapterData.proofreading} users={users} />
                        </Box>
                      )
                    )
                  ) : (
                    // Solo admins y jefes pueden crear asignaciones
                    (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => onCreateAssignment(manga, chapter, 'proofreading')}
                        sx={{ fontSize: '0.75rem', px: 1, py: 0.5 }}
                      >
                        Asignar
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No Asignado Aún
                      </Typography>
                    )
                  )
                ) : (
                  // Tarea no disponible para este manga joint - mostrar texto personalizable
                  (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                    <Box
                      sx={{ cursor: 'pointer' }}
                      onClick={() => onEditUnavailableTask(manga, chapter, 'proofreading')}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.7, textDecoration: 'underline' }}>
                        {chapterData.chapterData?.unavailableTexts?.proofreading || 'No disponible - Click para editar'}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                      {chapterData.chapterData?.unavailableTexts?.proofreading || 'No disponible'}
                    </Typography>
                  )
                )}
                </TableCell>

                {/* Clean/Redrawer */}
                <TableCell>
                  {/* Solo mostrar si el clean/redrawer está permitido en mangas joint */}
                  {(!manga.isJoint || !normalizedAvailableTasks || normalizedAvailableTasks.includes('cleanRedrawer')) ? (
                    chapterData.cleanRedrawer ? (
                    // Si existe asignación pero sin usuario asignado
                    (!chapterData.cleanRedrawer.assignedTo || chapterData.cleanRedrawer.status === 'sin_asignar') ? (
                      // Solo admins y jefes pueden asignar
                      (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => onAssignmentClick(chapterData.cleanRedrawer)}
                          sx={{ fontSize: '0.75rem', px: 1, py: 0.5 }}
                        >
                          Asignar
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No Asignado Aún
                        </Typography>
                      )
                    ) : (
                      // Solo admins y jefes pueden editar asignaciones existentes
                      (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                        <Box sx={{ cursor: 'pointer' }} onClick={() => onAssignmentClick(chapterData.cleanRedrawer)}>
                          <AssignmentInfo assignment={chapterData.cleanRedrawer} users={users} />
                        </Box>
                      ) : (
                        <Box sx={{ cursor: 'default' }}>
                          <AssignmentInfo assignment={chapterData.cleanRedrawer} users={users} />
                        </Box>
                      )
                    )
                  ) : (
                    // Solo admins y jefes pueden crear asignaciones
                    (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => onCreateAssignment(manga, chapter, 'cleanRedrawer')}
                        sx={{ fontSize: '0.75rem', px: 1, py: 0.5 }}
                      >
                        Asignar
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No Asignado Aún
                      </Typography>
                    )
                  )
                ) : (
                  // Tarea no disponible para este manga joint - mostrar texto personalizable
                  (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                    <Box
                      sx={{ cursor: 'pointer' }}
                      onClick={() => onEditUnavailableTask(manga, chapter, 'cleanRedrawer')}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.7, textDecoration: 'underline' }}>
                        {chapterData.chapterData?.unavailableTexts?.cleanRedrawer || 'No disponible - Click para editar'}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                      {chapterData.chapterData?.unavailableTexts?.cleanRedrawer || 'No disponible'}
                    </Typography>
                  )
                )}
                </TableCell>

                {/* Typesetting */}
                <TableCell>
                  {/* Solo mostrar si el typesetting está permitido en mangas joint */}
                  {(!manga.isJoint || !normalizedAvailableTasks || normalizedAvailableTasks.includes('type')) ? (
                    chapterData.type ? (
                    // Si existe asignación pero sin usuario asignado
                    (!chapterData.type.assignedTo || chapterData.type.status === 'sin_asignar') ? (
                      // Solo admins y jefes pueden asignar
                      (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => onAssignmentClick(chapterData.type)}
                          sx={{ fontSize: '0.75rem', px: 1, py: 0.5 }}
                        >
                          Asignar
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No Asignado Aún
                        </Typography>
                      )
                    ) : (
                      // Solo admins y jefes pueden editar asignaciones existentes
                      (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                        <Box sx={{ cursor: 'pointer' }} onClick={() => onAssignmentClick(chapterData.type)}>
                          <AssignmentInfo assignment={chapterData.type} users={users} />
                        </Box>
                      ) : (
                        <Box sx={{ cursor: 'default' }}>
                          <AssignmentInfo assignment={chapterData.type} users={users} />
                        </Box>
                      )
                    )
                  ) : (
                    // Solo admins y jefes pueden crear asignaciones
                    (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => onCreateAssignment(manga, chapter, 'type')}
                        sx={{ fontSize: '0.75rem', px: 1, py: 0.5 }}
                      >
                        Asignar
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No Asignado Aún
                      </Typography>
                    )
                  )
                ) : (
                  // Tarea no disponible para este manga joint - mostrar texto personalizable
                  (userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') ? (
                    <Box
                      sx={{ cursor: 'pointer' }}
                      onClick={() => onEditUnavailableTask(manga, chapter, 'type')}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.7, textDecoration: 'underline' }}>
                        {chapterData.chapterData?.unavailableTexts?.type || 'No disponible - Click para editar'}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                      {chapterData.chapterData?.unavailableTexts?.type || 'No disponible'}
                    </Typography>
                  )
                )}
                </TableCell>

                {/* Acciones */}
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {/* Botón Editar Capítulo - solo para admins y jefes */}
                    {(userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') && (
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          // Buscar datos del capítulo independiente si existe
                          const independentChapters = chapters[manga.id] || [];
                          const chapterData = independentChapters.find(
                            ch => ch.chapter == chapter || ch.number == chapter
                          );
                          
                          // Si existe capítulo independiente, editarlo, sino crear uno nuevo con estos detalles
                          if (chapterData) {
                            // Abrir diálogo para editar capítulo existente
                            onCreateChapter(manga, {
                              ...chapterData,
                              chapter: chapter,
                              isEditing: true
                            });
                          } else {
                            // Crear nuevo capítulo con detalles básicos
                            onCreateChapter(manga, {
                              chapter: chapter,
                              notes: '',
                              driveLink: '',
                              isEditing: false
                            });
                          }
                        }}
                        sx={{ 
                          fontSize: '0.75rem', 
                          px: 1, 
                          py: 0.5,
                          color: 'secondary.main'
                        }}
                      >
                        Editar Cap.
                      </Button>
                    )}
                    
                    {/* Botón para eliminar capítulo completo - solo para jefes */}
                    {(userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor' || userProfile?.role === 'admin') && (
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => onDeleteAssignment(manga, chapter)}
                        sx={{ 
                          fontSize: '0.75rem', 
                          px: 1, 
                          py: 0.5,
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: 'rgba(239, 68, 68, 0.1)'
                          }
                        }}
                      >
                        Eliminar Cap.
                      </Button>
                    )}

                    {/* Botón para marcar como subido - solo para uploaders y superadmin */}
                    {(userProfile?.role === 'uploader' || userProfile?.role === 'admin') && 
                     isChapterCompleted && !isChapterUploaded && (
                      <Button
                        size="small"
                        startIcon={<UploadIcon />}
                        onClick={() => {
                          // Marcar todas las asignaciones completadas/aprobadas de este capítulo como subidas
                          const completedAssignments = assignedAssignments.filter(a => 
                            a.status === 'completado' || a.status === 'aprobado'
                          );
                          completedAssignments.forEach(assignment => {
                            onMarkUploaded(assignment.id);
                          });
                        }}
                        className="sm-btn"
                        sx={{ 
                          fontSize: '0.75rem', 
                          px: 1, 
                          py: 0.5,
                          backgroundColor: '#a78bfa',
                          color: 'white',
                          borderRadius: '6px',
                          '&:hover': {
                            backgroundColor: '#7c3aed',
                          }
                        }}
                      >
                        Marcar Subido
                      </Button>
                    )}

                    {/* Botón para desmarcar como subido - solo para uploaders y superadmin */}
                    {(userProfile?.role === 'uploader' || userProfile?.role === 'admin') && 
                     isChapterUploaded && (
                      <Button
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => {
                          // Desmarcar todas las asignaciones subidas de este capítulo a completado
                          const uploadedAssignments = assignedAssignments.filter(a => a.status === 'uploaded');
                          uploadedAssignments.forEach(assignment => {
                            onMarkNotUploaded(assignment.id);
                          });
                        }}
                        className="sm-btn"
                        sx={{ 
                          fontSize: '0.75rem', 
                          px: 1, 
                          py: 0.5,
                          backgroundColor: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          '&:hover': {
                            backgroundColor: '#059669',
                          }
                        }}
                      >
                        Desmarcar Subido
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
          
          {/* Fila para crear nuevo capítulo - solo para jefes y admins */}
          {(userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') && (
            <TableRow>
              <TableCell colSpan={6} sx={{ textAlign: 'center', py: 2 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => onCreateChapter(manga)}
                  variant="outlined"
                  sx={{
                    color: 'primary.main',
                    textTransform: 'none',
                    fontWeight: 500,
                    mr: 2
                  }}
                >
                  Crear nuevo capítulo
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Dialog para crear/editar capítulo sin asignar
const ChapterDialog = ({ open, onClose, manga, chapterData, onSave }) => {
  const [formData, setFormData] = useState({
    mangaId: manga?.id || '',
    mangaTitle: manga?.title || '',
    chapter: '',
    driveLink: '',
    notes: '',
    authorName: '', // Nuevo campo para el nombre del autor en proyectos joint
    isEditing: false
  });

  useEffect(() => {
    if (manga && chapterData) {
      // Modo edición - llenar con datos del capítulo existente
      setFormData({
        mangaId: manga.id,
        mangaTitle: manga.title,
        chapter: chapterData.chapter || '',
        driveLink: chapterData.driveLink || '',
        notes: chapterData.notes || '',
        authorName: chapterData.authorName || '', // Campo para autor en proyectos joint
        isEditing: chapterData.isEditing || false
      });
    } else if (manga) {
      // Modo creación - formulario vacío
      setFormData({
        mangaId: manga.id,
        mangaTitle: manga.title,
        chapter: '',
        driveLink: '',
        notes: '',
        authorName: '', // Campo para autor en proyectos joint
        isEditing: false
      });
    }
  }, [manga, chapterData]);

  const handleSave = () => {
    if (!formData.chapter) {
      alert('Por favor completa el número de capítulo');
      return;
    }
    onSave(formData);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth onKeyPress={handleKeyPress}>
      <DialogTitle>
        {formData.isEditing ? 'Editar Detalles del Capítulo' : 'Crear Nuevo Capítulo'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Manga"
              value={formData.mangaTitle}
              disabled
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Capítulo"
              type="text"
              value={formData.chapter}
              onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
              onKeyPress={handleKeyPress}
              variant="outlined"
              placeholder="Ej: 1, 7.2, 15.5"
              inputProps={{
                pattern: "[0-9]+(\.[0-9]+)?",
                title: "Ingresa un número válido (ej: 1, 7.2, 15.5)"
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Link de Google Drive"
              value={formData.driveLink}
              onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
              onKeyPress={handleKeyPress}
              variant="outlined"
              placeholder="https://drive.google.com/..."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notas"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              variant="outlined"
              placeholder="Notas adicionales sobre este capítulo..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained">
          {formData.isEditing ? 'Actualizar Capítulo' : 'Crear Capítulo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Dialog para crear/editar asignación
const AssignmentDialog = ({ open, onClose, assignment, manga, users, onSave, prefilledChapter, prefilledType, inheritedDriveLink }) => {
  const [formData, setFormData] = useState({
    mangaId: manga?.id || '',
    mangaTitle: manga?.title || '',
    chapter: prefilledChapter || '',
    type: prefilledType || 'traduccion',
    assignedTo: '',
    dueDate: '',
    notes: '',
    driveLink: '',
    rawLink: ''
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        mangaId: assignment.mangaId || manga?.id || '',
        mangaTitle: assignment.mangaTitle || manga?.title || '',
        chapter: assignment.chapter || '',
        type: assignment.type || 'traduccion',
        assignedTo: assignment.assignedTo || '',
        dueDate: assignment.dueDate ? isoStringToDateInput(assignment.dueDate) : '',
        notes: assignment.notes || '',
        driveLink: assignment.driveLink || '',
        rawLink: assignment.rawLink || ''
      });
    } else if (manga) {
      setFormData({
        mangaId: manga.id,
        mangaTitle: manga.title,
        chapter: prefilledChapter || '',
        type: prefilledType || 'traduccion',
        assignedTo: '',
        dueDate: '',
        notes: '',
        driveLink: inheritedDriveLink || '',
        rawLink: ''
      });
    }
  }, [assignment, manga, prefilledChapter, prefilledType, inheritedDriveLink]);

  const handleSave = () => {
    if (!formData.chapter) {
      alert('Por favor completa el número de capítulo');
      return;
    }
    // El usuario es obligatorio para crear/editar asignaciones
    if (!formData.assignedTo) {
      alert('Por favor asigna un usuario para la tarea');
      return;
    }
    
    // Preparar datos para enviar, convirtiendo la fecha si existe
    const dataToSave = {
      ...formData,
      // Si hay fecha, mantenerla en formato YYYY-MM-DD para evitar problemas de zona horaria
      dueDate: formData.dueDate || ''
    };
    
    onSave(dataToSave, assignment);
  };

  // Filtrar usuarios que pueden ser asignados (editores, traductores, etc.)
  // Primero obtener usuarios únicos para evitar duplicados
  const uniqueUsers = getUniqueUsers(users);
  const assignableUsers = uniqueUsers.filter(user => {
    const role = user.role;
    return role === ROLES.EDITOR || 
           role === ROLES.TRADUCTOR || 
           role === ROLES.UPLOADER ||
           role === ROLES.JEFE_EDITOR ||
           role === ROLES.JEFE_TRADUCTOR ||
           role === 'editor' ||
           role === 'traductor' ||
           role === 'uploader' ||
           role === 'jefe_editor' ||
           role === 'jefe_traductor';
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {assignment ? 'Editar Asignación' : 'Crear Nueva Asignación'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Manga"
              value={formData.mangaTitle}
              disabled
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Capítulo"
              type="text"
              value={formData.chapter}
              onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
              variant="outlined"
              disabled={!!prefilledChapter}
              placeholder="Ej: 1, 7.2, 15.5"
              inputProps={{
                pattern: "[0-9]+(\.[0-9]+)?",
                title: "Ingresa un número válido (ej: 1, 7.2, 15.5)"
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de trabajo</InputLabel>
              <Select
                value={formData.type}
                label="Tipo de trabajo"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                disabled={!!prefilledType}
              >
                <MenuItem value="traduccion">Traducción</MenuItem>
                <MenuItem value="proofreading">Proofreading</MenuItem>
                <MenuItem value="cleanRedrawer">Clean/Redrawer</MenuItem>
                <MenuItem value="type">Typesetting</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              fullWidth
              options={[{ uid: '', name: 'Sin asignar', role: '', profileImage: null }, ...assignableUsers]}
              value={assignableUsers.find(user => (user.uid || user.id) === formData.assignedTo) || 
                     (formData.assignedTo === '' ? { uid: '', name: 'Sin asignar', role: '', profileImage: null } : null)}
              onChange={(event, newValue) => {
                setFormData({ ...formData, assignedTo: newValue ? (newValue.uid || newValue.id || '') : '' });
              }}
              getOptionLabel={(option) => option ? (option.name || 'Usuario desconocido') : ''}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                  <Avatar
                    src={option.profileImage || option.photoURL || option.avatar}
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem',
                      // Diseño cuando HAY foto
                      ...(option.profileImage || option.photoURL || option.avatar) && {
                        bgcolor: 'transparent',
                        border: `2px solid #6a9eff60`,
                        boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
                      },
                      // Diseño cuando NO hay foto (mostrar iniciales)
                      ...(!(option.profileImage || option.photoURL || option.avatar)) && {
                        bgcolor: option.uid ? '#6a9eff' : '#6b7280',
                        color: 'white',
                        border: `2px solid ${option.uid ? '#6a9eff' : '#6b7280'}`,
                        boxShadow: `0 2px 8px ${option.uid ? '#6a9eff' : '#6b7280'}40`,
                        background: `linear-gradient(135deg, ${option.uid ? '#6a9eff' : '#6b7280'}, ${option.uid ? '#6a9effdd' : '#6b7280dd'})`,
                      },
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {/* Solo mostrar iniciales si no hay foto */}
                    {!(option.profileImage || option.photoURL || option.avatar) && option.name && 
                     (option.uid ? option.name.substring(0, 2).toUpperCase() : '?')}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.name || 'Usuario desconocido'}
                    </Typography>
                    {option.role && (
                      <Typography variant="caption" color="text.secondary">
                        {option.role}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Asignar a"
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: formData.assignedTo && (
                      <Avatar
                        src={assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.profileImage ||
                             assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.photoURL ||
                             assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.avatar}
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: '0.65rem',
                          mr: 1,
                          ...(assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.profileImage ||
                              assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.photoURL ||
                              assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.avatar) && {
                            bgcolor: 'transparent',
                            border: `1px solid #6a9eff60`,
                          },
                          ...(!(assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.profileImage ||
                               assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.photoURL ||
                               assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.avatar)) && {
                            bgcolor: '#6a9eff',
                            color: 'white',
                            fontWeight: 700,
                          }
                        }}
                      >
                        {!(assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.profileImage ||
                           assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.photoURL ||
                           assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.avatar) &&
                         assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo)?.name &&
                         assignableUsers.find(u => (u.uid || u.id) === formData.assignedTo).name.substring(0, 2).toUpperCase()}
                      </Avatar>
                    ),
                    ...params.InputProps.endAdornment && { endAdornment: params.InputProps.endAdornment },
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => (option.uid || option.id || '') === (value.uid || value.id || '')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Fecha límite"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Link de Google Drive"
              value={formData.driveLink}
              onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
              variant="outlined"
              placeholder="https://drive.google.com/..."
            />
          </Grid>
          
          {/* Campo para link de la RAW - Solo aparece si el tipo es traducción */}
          {formData.type === 'traduccion' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Link de la RAW a traducir"
                value={formData.rawLink}
                onChange={(e) => setFormData({ ...formData, rawLink: e.target.value })}
                variant="outlined"
                placeholder="https://ejemplo.com/manga-raw..."
                InputProps={{
                  startAdornment: <LinkIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                helperText="Enlace directo a la RAW para que el traductor pueda trabajar"
              />
            </Grid>
          )}
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notas"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              variant="outlined"
              placeholder="Instrucciones especiales, enlaces, etc..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained">
          {assignment ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente para mostrar un capítulo agrupado con todas sus tareas (del staff dashboard)
const ChapterCard = ({ chapterGroup, userRole, onMarkComplete, onMarkUploaded }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'pendiente':
        return 'warning';
      case 'in_progress':
      case 'en_progreso':
        return 'info';
      case 'completed':
      case 'completado':
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
      case 'pendiente':
        return 'Pendiente';
      case 'in_progress':
      case 'en_progreso':
        return 'En Progreso';
      case 'completed':
      case 'completado':
        return 'Completado';
      case 'uploaded':
        return 'Subido';
      default:
        return 'Desconocido';
    }
  };

  const canMarkComplete = (assignment) => {
    return assignment.status === 'pending' || assignment.status === 'pendiente' || assignment.status === 'in_progress' || assignment.status === 'en_progreso';
  };

  const canMarkUploaded = (assignment) => {
    return (userRole === ROLES.UPLOADER || userRole === ROLES.ADMIN) && (assignment.status === 'completed' || assignment.status === 'completado');
  };

  // Determinar si alguna tarea está atrasada
  const hasOverdueTask = chapterGroup.assignments.some(assignment => 
    assignment.dueDate && new Date(assignment.dueDate) < new Date() &&
    (assignment.status === 'pending' || assignment.status === 'pendiente' || assignment.status === 'in_progress' || assignment.status === 'en_progreso')
  );

  // Calcular progreso general del capítulo
  // Incluir tanto tareas completadas como aprobadas en el cálculo de progreso
  const completedTasks = chapterGroup.assignments.filter(a => 
    a.status === 'completed' || 
    a.status === 'completado' || 
    a.status === 'aprobado'
  ).length;
  const totalTasks = chapterGroup.assignments.length;
  const chapterProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isChapterCompleted = completedTasks === totalTasks;
  
  // Determinar si el capítulo está en progreso (algunas tareas completadas, otras pendientes)
  const isChapterInProgress = totalTasks > 1 && completedTasks > 0 && completedTasks < totalTasks;

  return (
    <>
      <Card 
        sx={{ 
          mb: 2,
          border: hasOverdueTask ? '2px solid #ef4444' : 
                  isChapterCompleted ? '2px solid #10b981' : 
                  isChapterInProgress ? '2px solid #f59e0b' : 
                  '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          backgroundColor: hasOverdueTask ? 'inherit' :
                          isChapterCompleted ? 'rgba(16, 185, 129, 0.05)' : 
                          isChapterInProgress ? 'rgba(245, 158, 11, 0.05)' : 
                          'inherit',
          '&::before': hasOverdueTask ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#ef4444',
          } : isChapterCompleted ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#10b981',
          } : isChapterInProgress ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#f59e0b',
          } : {},
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              {/* Header del capítulo */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BookIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  {chapterGroup.mangaTitle}
                </Typography>
                <Chip
                  label={`Cap. ${chapterGroup.chapter}`}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #6a9eff, #a78bfa)',
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
                {isChapterCompleted && (
                  <Chip
                    label="Completado"
                    size="small"
                    sx={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                )}
                {isChapterInProgress && (
                  <Chip
                    label="En Progreso"
                    size="small"
                    sx={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                )}
              </Box>
              
              {/* Lista de tareas */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
                  Tareas asignadas ({chapterGroup.assignments.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {chapterGroup.assignments.map((assignment, index) => {
                    const taskTypeConfig = ASSIGNMENT_TYPES[assignment.type] || ASSIGNMENT_TYPES.traduccion;
                    return (
                      <Chip
                        key={index}
                        label={taskTypeConfig.label}
                        size="small"
                        color={getStatusColor(assignment.status)}
                        sx={{
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setSelectedTask(assignment);
                          setDetailsOpen(true);
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>

              {/* Fecha límite más próxima */}
              {(() => {
                const nextDueDate = chapterGroup.assignments
                  .filter(a => a.dueDate && (a.status === 'pending' || a.status === 'pendiente' || a.status === 'in_progress' || a.status === 'en_progreso'))
                  .map(a => new Date(a.dueDate))
                  .sort((a, b) => a - b)[0];
                
                if (nextDueDate) {
                  const isOverdue = nextDueDate < new Date();
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {isOverdue ? <WarningIcon sx={{ color: '#ef4444', fontSize: '1rem' }} /> : <ScheduleIcon sx={{ fontSize: '1rem', color: 'textSecondary' }} />}
                      <Typography 
                        variant="body2" 
                        color={isOverdue ? 'error' : 'textSecondary'}
                        sx={{ fontWeight: isOverdue ? 600 : 400 }}
                      >
                        Próxima fecha límite: {nextDueDate.toLocaleDateString('es-ES')}
                        {isOverdue && ' (Atrasada)'}
                      </Typography>
                    </Box>
                  );
                }
                return null;
              })()}

              {/* Progreso del capítulo */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Progreso del capítulo
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {completedTasks}/{totalTasks} tareas ({Math.round(chapterProgress)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={chapterProgress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      background: isChapterCompleted ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #6a9eff, #a78bfa)',
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Acciones */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedTask(null);
                  setDetailsOpen(true);
                }}
              >
                Ver Capítulo
              </Button>

              {chapterGroup.driveLink && (
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  href={chapterGroup.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textTransform: 'none' }}
                >
                  Descargar
                </Button>
              )}

              {/* Botones de acción rápida para tareas pendientes */}
              {chapterGroup.assignments.filter(a => canMarkComplete(a)).length > 0 && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => {
                    // Marcar todas las tareas pendientes como completadas
                    const pendingTasks = chapterGroup.assignments.filter(a => canMarkComplete(a));
                    pendingTasks.forEach(task => onMarkComplete(task.id));
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669, #047857)',
                    },
                  }}
                >
                  Completar Todo
                </Button>
              )}

              {chapterGroup.assignments.filter(a => canMarkUploaded(a)).length > 0 && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => {
                    // Marcar todas las tareas completadas como subidas
                    const completedTasks = chapterGroup.assignments.filter(a => canMarkUploaded(a));
                    completedTasks.forEach(task => onMarkUploaded(task.id));
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
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
        </CardContent>
      </Card>

      {/* Dialog con detalles del capítulo o tarea específica */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTask ? 'Detalles de la Tarea' : 'Detalles del Capítulo'}
        </DialogTitle>
        <DialogContent>
          {selectedTask ? (
            // Detalles de una tarea específica
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedTask.mangaTitle || selectedTask.manga} - Capítulo {selectedTask.chapter}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Tarea:</strong> {ASSIGNMENT_TYPES[selectedTask.type]?.label || selectedTask.taskType || selectedTask.type}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Estado:</strong> {getStatusLabel(selectedTask.status)}
                </Typography>
              </Grid>
              {selectedTask.assignedDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Asignado:</strong> {new Date(selectedTask.assignedDate).toLocaleDateString('es-ES')}
                  </Typography>
                </Grid>
              )}
              {selectedTask.dueDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Fecha límite:</strong> {new Date(selectedTask.dueDate).toLocaleDateString('es-ES')}
                  </Typography>
                </Grid>
              )}
              {(selectedTask.description || selectedTask.notes) && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Descripción:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {selectedTask.description || selectedTask.notes}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  {canMarkComplete(selectedTask) && (
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => {
                        onMarkComplete(selectedTask.id);
                        setDetailsOpen(false);
                      }}
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
                  {canMarkUploaded(selectedTask) && (
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => {
                        onMarkUploaded(selectedTask.id);
                        setDetailsOpen(false);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        },
                      }}
                    >
                      Marcar Subido
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          ) : (
            // Detalles del capítulo completo
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {chapterGroup.mangaTitle} - Capítulo {chapterGroup.chapter}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Progreso general:</strong> {completedTasks}/{totalTasks} tareas completadas ({Math.round(chapterProgress)}%)
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Tareas asignadas:</strong>
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tarea</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Fecha límite</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chapterGroup.assignments.map((assignment, index) => (
                      <TableRow key={index}>
                        <TableCell>{ASSIGNMENT_TYPES[assignment.type]?.label || assignment.type}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(assignment.status)}
                            color={getStatusColor(assignment.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('es-ES') : '-'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {canMarkComplete(assignment) && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  onMarkComplete(assignment.id);
                                }}
                              >
                                Completar
                              </Button>
                            )}
                            {canMarkUploaded(assignment) && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  onMarkUploaded(assignment.id);
                                }}
                              >
                                Subir
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Componente principal
const SeriesManagement = () => {
  const { userProfile, hasRole } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [expandedSeries, setExpandedSeries] = useState({});
  const [mangas, setMangas] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [chapters, setChapters] = useState({}); // Nuevo estado para capítulos independientes
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignmentDialog, setAssignmentDialog] = useState({ 
    open: false, 
    assignment: null, 
    manga: null,
    prefilledChapter: null,
    prefilledType: null,
    inheritedDriveLink: ''
  });
  const [chapterDialog, setChapterDialog] = useState({ 
    open: false, 
    manga: null
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [unavailableTextDialog, setUnavailableTextDialog] = useState({ 
    open: false, 
    manga: null,
    chapter: null,
    taskType: null,
    currentText: ''
  });
  
  // Estados para la sección de staff
  const [staffStats, setStaffStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    uploaded: 0,
    overdue: 0
  });
  
  // Estado para filtro del panel de trabajo
  const [staffFilter, setStaffFilter] = useState('all');
  

  // Función para editar texto de tarea no disponible
  const handleEditUnavailableTask = (manga, chapter, taskType) => {
    const independentChapters = chapters[manga.id] || [];
    const chapterData = independentChapters.find(
      ch => ch.chapter == chapter || ch.number == chapter
    );
    
    const currentText = chapterData?.unavailableTexts?.[taskType] || '';
    
    setUnavailableTextDialog({
      open: true,
      manga,
      chapter,
      taskType,
      currentText
    });
  };

  // Función para guardar el texto personalizado
  const handleSaveUnavailableText = async (newText) => {
    const { manga, chapter, taskType } = unavailableTextDialog;
    
    try {
      setLoading(true);
      
      // Guardar posición actual del scroll
      const currentScrollY = window.scrollY;
      
      // Buscar el capítulo existente o crear uno nuevo
      const independentChapters = chapters[manga.id] || [];
      let chapterData = independentChapters.find(
        ch => ch.chapter == chapter || ch.number == chapter
      );
      
      if (!chapterData) {
        // Crear un nuevo capítulo con solo los datos necesarios
        const dynamicStatus = getChapterStatusFromAssignments(manga.id, chapter);
        chapterData = {
          chapter: chapter,
          notes: '',
          driveLink: '',
          authorName: '',
          unavailableTexts: {},
          status: dynamicStatus
        };
      }
      
      // Actualizar el texto personalizado
      const updatedUnavailableTexts = {
        ...(chapterData.unavailableTexts || {}),
        [taskType]: newText
      };
      
      const updatedChapterData = {
        ...chapterData,
        unavailableTexts: updatedUnavailableTexts
      };
      
      if (independentChapters.find(ch => ch.chapter == chapter || ch.number == chapter)) {
        // Actualizar capítulo existente
        await realtimeService.updateChapter(manga.id, chapter, updatedChapterData);
      } else {
        // Crear nuevo capítulo
        await realtimeService.createChapter(manga.id, updatedChapterData);
      }
      
      // Actualizar estado local
      setChapters(prev => ({
        ...prev,
        [manga.id]: prev[manga.id] ? 
          prev[manga.id].map(ch => 
            (ch.chapter == chapter || ch.number == chapter) 
              ? { ...ch, unavailableTexts: updatedUnavailableTexts }
              : ch
          ) :
          [{ ...updatedChapterData, number: chapter }]
      }));
      
      setSnackbar({ 
        open: true, 
        message: 'Texto personalizado actualizado exitosamente', 
        severity: 'success' 
      });
      
      // Restaurar posición del scroll después de la actualización
      setTimeout(() => {
        window.scrollTo(0, currentScrollY);
      }, 100); // Pequeño delay para asegurar que la actualización se haya completado
      
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Error actualizando texto: ' + error.message, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos desde Firebase
  useEffect(() => {
    let unsubscribeMangas = null;
    let unsubscribeAssignments = null;
    let unsubscribeUsers = null;
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Suscribirse a mangas
        unsubscribeMangas = await realtimeService.subscribeToMangas(async (mangasData) => {
          const activeMangas = mangasData.filter(manga => manga.status !== 'deleted');
          setMangas(activeMangas);
          
          // Cargar capítulos independientes para cada manga
          const chaptersData = {};
          for (const manga of activeMangas) {
            try {
              const mangaChapters = await realtimeService.getChapters(manga.id);
              chaptersData[manga.id] = mangaChapters;
            } catch (error) {
              //  message removed for production
              chaptersData[manga.id] = [];
            }
          }
          setChapters(chaptersData);
        });

        // Suscribirse a asignaciones
        unsubscribeAssignments = await realtimeService.subscribeToAssignments((assignmentsData) => {
          setAssignments(assignmentsData);
          
          // Si es la pestaña del staff, calcular estadísticas personales
          if (userProfile && !hasRole(ROLES.ADMIN)) {
            const userAssignments = assignmentsData.filter(a => a.assignedTo === userProfile.uid);
            const total = userAssignments.length;
            const pending = userAssignments.filter(a => a.status === 'pending' || a.status === 'pendiente').length;
            const inProgress = userAssignments.filter(a => a.status === 'in_progress' || a.status === 'en_progreso').length;
            const completed = userAssignments.filter(a => a.status === 'completed' || a.status === 'completado').length;
            const uploaded = userAssignments.filter(a => a.status === 'uploaded').length;
            const overdue = userAssignments.filter(a => 
              a.dueDate && new Date(a.dueDate) < new Date() && 
              (a.status === 'pending' || a.status === 'pendiente' || a.status === 'in_progress' || a.status === 'en_progreso')
            ).length;

            setStaffStats({ total, pending, inProgress, completed, uploaded, overdue });
          }
        });

        // Prueba directa para verificar usuarios en Firebase
        //  message removed for production
        try {
          const directUsers = await realtimeService.getAllUsers();
          //  message removed for production
        } catch (directError) {
          //  message removed for production
        }

        // Inicializar con array vacío - se llenará con datos reales
        setUsers([]);

        // Suscribirse a usuarios (comentado debido a permisos)
        //  message removed for production
        try {
          unsubscribeUsers = await realtimeService.subscribeToUsers((usersData) => {
            //  message removed for production
            //  message removed for production
            //  message removed for production
            //  message removed for production
            //  message removed for production
            if (usersData && usersData.length > 0) {
              //  message removed for production
              setUsers(usersData); // Solo usar datos reales si están disponibles
            }
          });
          //  message removed for production
        } catch (error) {
          //  message removed for production
        }

      } catch (error) {
        //  message removed for production
        setSnackbar({ 
          open: true, 
          message: 'Error cargando datos: ' + error.message, 
          severity: 'error' 
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Cleanup function
    return () => {
      if (typeof unsubscribeMangas === 'function') {
        unsubscribeMangas();
      }
      if (typeof unsubscribeAssignments === 'function') {
        unsubscribeAssignments();
      }
      if (typeof unsubscribeUsers === 'function') {
        unsubscribeUsers();
      }
    };
  }, [userProfile, hasRole]);

  // DESHABILITADO: Efecto para actualizar automáticamente el estado de capítulos cuando cambien las asignaciones
  // Este useEffect causaba que al marcar una asignación individual como completada, se marcara todo el capítulo.
  // Los capítulos ahora deben marcarse manualmente como "listo" o "subido" por los jefes/administradores.
  /*
  useEffect(() => {
    if (assignments.length === 0 || Object.keys(chapters).length === 0) {
      return; // No hacer nada si no hay datos
    }

    const updateChapterStates = async () => {
      //  message removed for production
      
      // Agrupar asignaciones por manga y capítulo
      const assignmentsByChapter = {};
      
      assignments.forEach(assignment => {
        if (!assignment.mangaId || !assignment.chapter) return;
        
        const key = `${assignment.mangaId}-${assignment.chapter}`;
        if (!assignmentsByChapter[key]) {
          assignmentsByChapter[key] = [];
        }
        assignmentsByChapter[key].push(assignment);
      });
      
      // Para cada capítulo que tenga asignaciones, verificar si necesita actualización
      for (const [key, chapterAssignments] of Object.entries(assignmentsByChapter)) {
        if (chapterAssignments.length === 0) continue;
        
        const [mangaId, chapterNumber] = key.split('-');
        
        // Buscar el capítulo correspondiente en nuestra data local
        const mangaChapters = chapters[mangaId] || [];
        const chapter = mangaChapters.find(ch => 
          ch.chapter == chapterNumber || ch.number == chapterNumber
        );
        
        // Si existe el capítulo independiente, verificar si necesita actualización
        if (chapter) {
          // Calcular el estado que debería tener basado en las asignaciones actuales
          const expectedStatus = getChapterStatusFromAssignments(mangaId, chapterNumber);
          
          // Solo actualizar si el estado actual es diferente al esperado
          if (chapter.status !== expectedStatus) {
            //  message removed for production
            
            try {
              // Actualizar en Firebase
              await realtimeService.updateChapter(mangaId, chapterNumber, {
                ...chapter,
                status: expectedStatus
              });
              
              // Actualizar estado local inmediatamente
              setChapters(prev => ({
                ...prev,
                [mangaId]: (prev[mangaId] || []).map(ch => 
                  (ch.chapter == chapterNumber || ch.number == chapterNumber) 
                    ? { ...ch, status: expectedStatus }
                    : ch
                )
              }));
              
              //  message removed for production
            } catch (error) {
              //  message removed for production
            }
          }
        }
      }
    };
    
    // Ejecutar la actualización después de un pequeño delay para evitar actualizaciones excesivas
    const timeoutId = setTimeout(updateChapterStates, 500);
    
    return () => clearTimeout(timeoutId);
  }, [assignments, chapters]); // Se ejecuta cuando cambian las asignaciones o capítulos
  */

  const handleToggleExpand = (seriesId) => {
    setExpandedSeries(prev => ({
      ...prev,
      [seriesId]: !prev[seriesId]
    }));
  };

  const handleAssignmentClick = (assignment) => {
    const manga = mangas.find(m => m.id === assignment.mangaId);
    setAssignmentDialog({ 
      open: true, 
      assignment, 
      manga,
      prefilledChapter: null,
      prefilledType: null
    });
  };

  const handleCreateAssignment = (manga, chapter = null, type = null) => {
    // Buscar si ya existe alguna asignación de este capítulo para heredar el Drive link
    let inheritedDriveLink = '';
    if (chapter) {
      // Primero buscar en asignaciones existentes
      const existingChapterAssignment = assignments.find(
        a => a.mangaId === manga.id && a.chapter === chapter
      );
      inheritedDriveLink = existingChapterAssignment?.driveLink || '';
      
      // Si no hay link en asignaciones, buscar en capítulos independientes
      if (!inheritedDriveLink) {
        const independentChapters = chapters[manga.id] || [];
        const chapterData = independentChapters.find(
          ch => ch.chapter == chapter || ch.number == chapter
        );
        inheritedDriveLink = chapterData?.driveLink || '';
      }
    }
    
    setAssignmentDialog({ 
      open: true, 
      assignment: null, 
      manga,
      prefilledChapter: chapter,
      prefilledType: type,
      inheritedDriveLink
    });
  };

  const handleCreateChapter = (manga, existingChapterData = null) => {
    setChapterDialog({ 
      open: true, 
      manga,
      chapterData: existingChapterData
    });
  };

  const handleDeleteAssignment = async (manga, chapter) => {
    // Confirmar eliminación
    const confirm = window.confirm(
      `¿Estás seguro de que deseas eliminar el capítulo ${chapter} de ${manga.title}?\n\nEsto eliminará TODAS las asignaciones de este capítulo Y el capítulo independiente si existe. Esta acción no se puede deshacer.`
    );
    
    if (!confirm) return;

    try {
      setLoading(true);
      
      // Encontrar todas las asignaciones de este capítulo para este manga
      const chapterAssignments = assignments.filter(
        assignment => assignment.mangaId === manga.id && assignment.chapter === chapter
      );
      
      // Crear array de promesas para eliminar todo
      const deletePromises = [];
      
      // Eliminar todas las asignaciones del capítulo
      chapterAssignments.forEach(assignment => {
        deletePromises.push(realtimeService.deleteAssignment(assignment.id));
      });
      
      // Verificar si existe un capítulo independiente y eliminarlo
      const independentChapters = chapters[manga.id] || [];
      const independentChapter = independentChapters.find(
        ch => ch.chapter == chapter || ch.number == chapter
      );
      
      if (independentChapter) {
        deletePromises.push(realtimeService.deleteChapter(manga.id, chapter));
      }
      
      await Promise.all(deletePromises);
      
      // Actualizar el estado local de capítulos
      setChapters(prev => ({
        ...prev,
        [manga.id]: (prev[manga.id] || []).filter(
          ch => ch.chapter != chapter && ch.number != chapter
        )
      }));
      
      setSnackbar({ 
        open: true, 
        message: `Capítulo ${chapter} eliminado exitosamente (${chapterAssignments.length} asignaciones${independentChapter ? ' y capítulo independiente' : ''} eliminados)`, 
        severity: 'success' 
      });
    } catch (error) {
      //  message removed for production
      setSnackbar({ 
        open: true, 
        message: 'Error eliminando capítulo: ' + error.message, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssignment = async (formData, existingAssignment) => {
    try {
      setLoading(true);
      
      // Guardar posición actual del scroll
      const currentScrollY = window.scrollY;
      
      // Buscar el usuario asignado para obtener su nombre (si hay uno)
      const assignedUser = formData.assignedTo ? users.find(u => (u.uid || u.id) === formData.assignedTo) : null;
      
      
      if (existingAssignment) {
        // Actualizar asignación existente
        const updateData = {
          chapter: formData.chapter,
          type: formData.type,
          assignedTo: formData.assignedTo,
          assignedToName: assignedUser?.name || 'Usuario desconocido',
          dueDate: formData.dueDate ? dateInputToISOString(formData.dueDate) : null,
          notes: formData.notes,
          driveLink: formData.driveLink,
          rawLink: formData.rawLink,
          status: formData.assignedTo ? 'pendiente' : 'sin_asignar'
        };
        
        //  message removed for production
        
        await realtimeService.updateAssignment(existingAssignment.id, updateData);
        setSnackbar({ open: true, message: 'Asignación actualizada exitosamente', severity: 'success' });
      } else {
        // Crear nueva asignación
        await realtimeService.createAssignment({
          mangaId: formData.mangaId,
          mangaTitle: formData.mangaTitle,
          chapter: formData.chapter,
          type: formData.type,
          assignedTo: formData.assignedTo || null,
          assignedToName: assignedUser?.name || null,
          dueDate: formData.dueDate ? dateInputToISOString(formData.dueDate) : null,
          notes: formData.notes,
          driveLink: formData.driveLink,
          rawLink: formData.rawLink,
          status: formData.assignedTo ? 'pendiente' : 'sin_asignar',
          progress: 0
        });
        setSnackbar({ open: true, message: 'Asignación creada exitosamente', severity: 'success' });
      }
      
      setAssignmentDialog({ 
        open: false, 
        assignment: null, 
        manga: null,
        prefilledChapter: null,
        prefilledType: null,
        inheritedDriveLink: ''
      });
      
      // Restaurar posición del scroll después de cerrar el diálogo
      setTimeout(() => {
        window.scrollTo(0, currentScrollY);
      }, 100); // Pequeño delay para asegurar que el diálogo se haya cerrado completamente
      
    } catch (error) {
      //  message removed for production
      setSnackbar({ open: true, message: 'Error guardando asignación: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentStats = (manga) => {
    // Mapeo de nombres de tareas de la DB a los nombres internos
    const taskMapping = {
      'traduccion': 'traduccion',
      'proofreading': 'proofreading', 
      'limpieza': 'cleanRedrawer',
      'clean': 'cleanRedrawer',
      'cleanRedrawer': 'cleanRedrawer',
      'typesetting': 'type',
      'type': 'type'
    };

    // Normalizar availableTasks si es un manga joint
    const normalizedAvailableTasks = manga.isJoint && manga.availableTasks 
      ? manga.availableTasks
          .filter(task => task !== 'edicion') // Filtrar completamente la tarea 'edicion'
          .map(task => taskMapping[task] || task)
          .filter(Boolean)
      : null;

    const mangaAssignments = assignments.filter(a => a.mangaId === manga.id);
    const independentChapters = chapters[manga.id] || [];
    
    // Agrupar por capítulo
    const chapterGroups = mangaAssignments.reduce((groups, assignment) => {
      const chapter = assignment.chapter;
      if (!groups[chapter]) {
        groups[chapter] = {
          traduccion: null,
          proofreading: null,
          cleanRedrawer: null,
          type: null
        };
      }
      groups[chapter][assignment.type] = assignment;
      return groups;
    }, {});

    // Agregar capítulos independientes que no tienen asignaciones
    independentChapters.forEach(chapter => {
      const chapterNumber = chapter.chapter;
      if (!chapterGroups[chapterNumber]) {
        chapterGroups[chapterNumber] = {
          traduccion: null,
          proofreading: null,
          cleanRedrawer: null,
          type: null
        };
      }
    });

    const allChapters = Object.keys(chapterGroups);
    const totalChapters = allChapters.length;
    
    // LÓGICA CORREGIDA: Un capítulo está completado si:
    // - Para mangas NORMALES: Tiene las 4 tareas completas (traduccion, proofreading, cleanRedrawer, type)
    // - Para mangas JOINT: Tiene todas las tareas configuradas en availableTasks completas
    const requiredTaskCount = manga.isJoint && normalizedAvailableTasks 
      ? normalizedAvailableTasks.length 
      : 4; // traduccion, proofreading, cleanRedrawer, type
    
    const completedChapters = allChapters.filter(chapter => {
      const chapterData = chapterGroups[chapter];
      
      // Para mangas joint, considerar solo las tareas disponibles configuradas
      const validTaskTypes = manga.isJoint && normalizedAvailableTasks
        ? normalizedAvailableTasks
        : ['traduccion', 'proofreading', 'cleanRedrawer', 'type'];
      
      // Filtrar solo asignaciones válidas (con type definido y que no sean datos de capítulo)
      const allAssignments = Object.values(chapterData).filter(assignment => 
        assignment !== null && 
        assignment.type && // Debe tener tipo definido
        assignment.type !== undefined && // No debe ser undefined
        typeof assignment.type === 'string' && // Debe ser string
        validTaskTypes.includes(assignment.type) // Solo tipos válidos para este manga
      );
      
      const assignedAssignments = allAssignments.filter(assignment => 
        assignment.assignedTo && assignment.status !== 'sin_asignar'
      );
      
      // Un capítulo está completado SOLO si:
      // 1. Tiene el número completo de tareas requeridas (4 para normales, availableTasks.length para joint)
      // 2. Todas están asignadas
      // 3. Todas están completadas, aprobadas O subidas
      return allAssignments.length === requiredTaskCount && 
        assignedAssignments.length === requiredTaskCount &&
        assignedAssignments.every(assignment => 
          assignment.status === 'completado' || 
          assignment.status === 'aprobado' || 
          assignment.status === 'uploaded'
        );
    }).length;
    
    const progress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
    
    return { 
      completed: completedChapters, 
      total: totalChapters, 
      progress,
      totalAssignments: mangaAssignments.length,
      totalChapters: totalChapters
    };
  };

  // Función para determinar el status del capítulo basado en las asignaciones
  const getChapterStatusFromAssignments = (mangaId, chapterNumber) => {
    const chapterAssignments = assignments.filter(
      assignment => assignment.mangaId === mangaId && assignment.chapter == chapterNumber
    );
    
    // Si no hay asignaciones, el capítulo está solo creado
    if (chapterAssignments.length === 0) {
      return 'created';
    }
    
    // Obtener manga para determinar tipos válidos
    const manga = mangas.find(m => m.id === mangaId);
    
    // Para mangas joint, considerar solo las tareas disponibles configuradas
    const taskMapping = {
      'traduccion': 'traduccion',
      'proofreading': 'proofreading', 
      'limpieza': 'cleanRedrawer',
      'clean': 'cleanRedrawer',
      'cleanRedrawer': 'cleanRedrawer',
      'typesetting': 'type',
      'type': 'type'
    };
    
    const normalizedAvailableTasks = manga?.isJoint && manga.availableTasks 
      ? manga.availableTasks.map(task => taskMapping[task] || task).filter(Boolean)
      : null;
    
    const validTaskTypes = manga?.isJoint && normalizedAvailableTasks
      ? normalizedAvailableTasks
      : ['traduccion', 'proofreading', 'cleanRedrawer', 'type'];
    
    // Filtrar solo asignaciones válidas (con tipo definido)
    const validAssignments = chapterAssignments.filter(assignment => 
      assignment && 
      assignment.type && 
      assignment.type !== undefined && 
      typeof assignment.type === 'string' && 
      validTaskTypes.includes(assignment.type)
    );
    
    if (validAssignments.length === 0) {
      return 'created';
    }
    
    // Obtener asignaciones que están asignadas a usuarios
    const assignedAssignments = validAssignments.filter(assignment => 
      assignment.assignedTo && assignment.status !== 'sin_asignar'
    );
    
    // Si no hay asignaciones asignadas, solo está creado
    if (assignedAssignments.length === 0) {
      return 'created';
    }
    
    // Verificar estados:
    // AZUL (uploaded): Todas las asignaciones están subidas
    const isChapterUploaded = assignedAssignments.length === validAssignments.length &&
      assignedAssignments.every(assignment => assignment.status === 'uploaded');
    
    if (isChapterUploaded) {
      return 'uploaded';
    }
    
  // CORREGIDO: NO marcar capítulos automáticamente como "listo" solo porque
  // las asignaciones están completadas. Esto evita el error crítico donde
  // al marcar una asignación individual como completada, se marca todo el capítulo.
  // 
  // VERDE (listo): Todas las asignaciones están completadas (pero no subidas)
  // Esta lógica se mantiene comentada para prevenir el comportamiento no deseado:
  // const isChapterCompleted = assignedAssignments.length === validAssignments.length &&
  //   assignedAssignments.every(assignment => assignment.status === 'completado');
  // 
  // if (isChapterCompleted) {
  //   return 'listo';
  // }
  //
  // NOTA: Los capítulos ahora deben marcarse manualmente como "listo" o "subido"
  // por los jefes/administradores cuando verifiquen que todas las tareas están realmente
  // completadas y el capítulo está listo para publicación.
    
    // AMARILLO (en progreso): Hay al menos una asignación en progreso
    const hasWorkInProgress = assignedAssignments.length > 0;
    
    if (hasWorkInProgress) {
      return 'en_progreso';
    }
    
    // Por defecto, creado
    return 'created';
  };

  const handleSaveChapter = async (formData) => {
    try {
      setLoading(true);
      
      // Guardar posición actual del scroll
      const currentScrollY = window.scrollY;
      
      // Determinar el status del capítulo basado en las asignaciones actuales
      const dynamicStatus = getChapterStatusFromAssignments(formData.mangaId, formData.chapter);
      
      if (formData.isEditing) {
        // Modo edición - actualizar capítulo existente
        const updatedChapterData = {
          chapter: formData.chapter,
          notes: formData.notes,
          driveLink: formData.driveLink,
          authorName: formData.authorName, // Incluir nombre del autor para proyectos joint
          status: dynamicStatus // Estado dinámico basado en asignaciones
        };
        
        await realtimeService.updateChapter(formData.mangaId, formData.chapter, updatedChapterData);
        
        // Actualizar el estado local
        setChapters(prev => ({
          ...prev,
          [formData.mangaId]: (prev[formData.mangaId] || []).map(ch => 
            (ch.chapter == formData.chapter || ch.number == formData.chapter) 
              ? { ...ch, ...updatedChapterData, number: formData.chapter }
              : ch
          )
        }));
        
        //  message removed for production
        setSnackbar({ open: true, message: `Capítulo actualizado exitosamente (status: ${dynamicStatus})`, severity: 'success' });
      } else {
        // Modo creación - crear nuevo capítulo
        const newChapterData = {
          chapter: formData.chapter,
          notes: formData.notes,
          driveLink: formData.driveLink,
          authorName: formData.authorName, // Incluir nombre del autor para proyectos joint
          status: dynamicStatus // Estado dinámico basado en asignaciones
        };
        
        await realtimeService.createChapter(formData.mangaId, newChapterData);
        
        // Actualizar el estado local de capítulos inmediatamente
        setChapters(prev => ({
          ...prev,
          [formData.mangaId]: [
            ...(prev[formData.mangaId] || []),
            {
              ...newChapterData,
              number: formData.chapter // Asegurar compatibilidad con ambos campos
            }
          ].sort((a, b) => parseInt(a.chapter || a.number) - parseInt(b.chapter || b.number))
        }));
        
        //  message removed for production
        setSnackbar({ open: true, message: `Capítulo creado exitosamente (status: ${dynamicStatus})`, severity: 'success' });
      }
      
      setChapterDialog({ open: false, manga: null, chapterData: null });
      
      // Restaurar posición del scroll después de cerrar el diálogo
      setTimeout(() => {
        window.scrollTo(0, currentScrollY);
      }, 100); // Pequeño delay para asegurar que el diálogo se haya cerrado completamente
      
    } catch (error) {
      //  message removed for production
      setSnackbar({ open: true, message: `Error ${formData.isEditing ? 'actualizando' : 'creando'} capítulo: ` + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Funciones para el staff dashboard
  const handleMarkComplete = async (assignmentId) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        //  message removed for production
        return;
      }
      
      await realtimeService.updateAssignment(assignmentId, { 
        status: 'completado', 
        completedDate: new Date().toISOString().split('T')[0] 
      });
      
      // DESHABILITADO: Actualizar el status del capítulo después de cambiar la asignación
      // Esta función causaba que al marcar una asignación individual como completada, se marcara todo el capítulo.
      // await updateChapterStatusAfterAssignmentChange(assignment.mangaId, assignment.chapter);
      
      setSnackbar({ open: true, message: 'Asignación marcada como completada', severity: 'success' });
    } catch (error) {
      //  message removed for production
      setSnackbar({ open: true, message: 'Error actualizando asignación', severity: 'error' });
    }
  };

  const handleMarkUploaded = async (assignmentId) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        //  message removed for production
        return;
      }
      
      await realtimeService.updateAssignment(assignmentId, { 
        status: 'uploaded', 
        uploadedDate: new Date().toISOString().split('T')[0] 
      });
      
      // DESHABILITADO: Actualizar el status del capítulo después de cambiar la asignación
      // Esta función causaba que al marcar una asignación individual como completada, se marcara todo el capítulo.
      // await updateChapterStatusAfterAssignmentChange(assignment.mangaId, assignment.chapter);
      
      setSnackbar({ open: true, message: 'Asignación marcada como subida', severity: 'success' });
    } catch (error) {
      //  message removed for production
      setSnackbar({ open: true, message: 'Error actualizando asignación', severity: 'error' });
    }
  };

  const handleMarkNotUploaded = async (assignmentId) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        //  message removed for production
        return;
      }
      
      await realtimeService.updateAssignment(assignmentId, { 
        status: 'completado', 
        uploadedDate: null // Remover la fecha de subida
      });
      
      // DESHABILITADO: Actualizar el status del capítulo después de cambiar la asignación
      // Esta función causaba que al marcar una asignación individual como completada, se marcara todo el capítulo.
      // await updateChapterStatusAfterAssignmentChange(assignment.mangaId, assignment.chapter);
      
      setSnackbar({ open: true, message: 'Asignación marcada como completada', severity: 'success' });
    } catch (error) {
      //  message removed for production
      setSnackbar({ open: true, message: 'Error actualizando asignación', severity: 'error' });
    }
  };

  // Funciones para manejar el toggle de estados en capítulos completos
  const handleToggleChapterUploadStatus = async (mangaId, chapter, currentStatus) => {
    try {
      setLoading(true);
      
      // Encontrar todas las asignaciones de este capítulo
      const chapterAssignments = assignments.filter(
        assignment => assignment.mangaId === mangaId && assignment.chapter === chapter
      );

      if (chapterAssignments.length === 0) {
        setSnackbar({ 
          open: true, 
          message: 'No se encontraron asignaciones para este capítulo', 
          severity: 'warning' 
        });
        return;
      }

      // Determinar el nuevo estado
      const isCurrentlyUploaded = chapterAssignments.every(a => a.status === 'uploaded');
      const newStatus = isCurrentlyUploaded ? 'completado' : 'uploaded';
      const updateData = {
        status: newStatus,
        ...(newStatus === 'uploaded' 
          ? { uploadedDate: new Date().toISOString().split('T')[0] }
          : { uploadedDate: null }
        )
      };

      // Actualizar todas las asignaciones del capítulo
      const updatePromises = chapterAssignments.map(assignment =>
        realtimeService.updateAssignment(assignment.id, updateData)
      );

      await Promise.all(updatePromises);
      
      setSnackbar({ 
        open: true, 
        message: `Capítulo marcado como ${newStatus === 'uploaded' ? 'subido' : 'completado'}`, 
        severity: 'success' 
      });
    } catch (error) {
      //  message removed for production
      setSnackbar({ 
        open: true, 
        message: 'Error actualizando estado del capítulo: ' + error.message, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Función helper para determinar si un capítulo está completado
  const isChapterCompleted = (mangaId, chapterNumber) => {
    const chapterAssignments = assignments.filter(
      assignment => assignment.mangaId === mangaId && assignment.chapter === chapterNumber
    );
    return chapterAssignments.length > 0 && 
           chapterAssignments.every(assignment => assignment.status === 'completado' || assignment.status === 'uploaded');
  };

  // Función helper para determinar si un capítulo está subido
  const isChapterUploaded = (mangaId, chapterNumber) => {
    const chapterAssignments = assignments.filter(
      assignment => assignment.mangaId === mangaId && assignment.chapter === chapterNumber
    );
    return chapterAssignments.length > 0 && 
           chapterAssignments.every(assignment => assignment.status === 'uploaded');
  };

  // Función para actualizar el status del capítulo después de cambios en asignaciones
  const updateChapterStatusAfterAssignmentChange = async (mangaId, chapterNumber) => {
    try {
      // Verificar si existe un capítulo independiente para este manga/capítulo
      const independentChapters = chapters[mangaId] || [];
      const existingChapter = independentChapters.find(
        ch => ch.chapter == chapterNumber || ch.number == chapterNumber
      );
      
      if (!existingChapter) {
        // No hay capítulo independiente, no hacer nada
        //  message removed for production
        return;
      }
      
      // Determinar el nuevo status basado en las asignaciones actuales
      const newStatus = getChapterStatusFromAssignments(mangaId, chapterNumber);
      
      // Solo actualizar si el status ha cambiado
      if (existingChapter.status !== newStatus) {
        //  message removed for production
        
        await realtimeService.updateChapter(mangaId, chapterNumber, {
          ...existingChapter,
          status: newStatus
        });
        
        // Actualizar el estado local
        setChapters(prev => ({
          ...prev,
          [mangaId]: (prev[mangaId] || []).map(ch => 
            (ch.chapter == chapterNumber || ch.number == chapterNumber) 
              ? { ...ch, status: newStatus }
              : ch
          )
        }));
        
        //  message removed for production
      } else {
        //  message removed for production
      }
    } catch (error) {
      //  message removed for production
    }
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
        return <CloudUploadIcon sx={{ color: '#a78bfa' }} />;
      case ROLES.EDITOR:
      case ROLES.TRADUCTOR:
        return <WorkIcon sx={{ color: '#6a9eff' }} />;
      default:
        return <AccountCircleIcon />;
    }
  };

  // Filtrar asignaciones del usuario actual
  const allUserAssignments = userProfile ? assignments.filter(a => a.assignedTo === userProfile.uid) : [];
  
  // Aplicar filtro a las asignaciones del usuario
  const filteredUserAssignments = allUserAssignments.filter(assignment => {
    if (staffFilter === 'all') return true;
    
    const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date() &&
      (assignment.status === 'pending' || assignment.status === 'pendiente' || 
       assignment.status === 'in_progress' || assignment.status === 'en_progreso');
    
    switch (staffFilter) {
      case 'pending':
        return assignment.status === 'pending' || assignment.status === 'pendiente';
      case 'in_progress':
        return assignment.status === 'in_progress' || assignment.status === 'en_progreso';
      case 'completed':
        return assignment.status === 'completed' || assignment.status === 'completado';
      case 'overdue':
        return isOverdue;
      case 'uploaded':
        return assignment.status === 'uploaded';
      default:
        return true;
    }
  });

  // Agrupar asignaciones por manga y capítulo
  const groupedUserAssignments = filteredUserAssignments.reduce((groups, assignment) => {
    const key = `${assignment.mangaId}-${assignment.chapter}`;
    if (!groups[key]) {
      groups[key] = {
        mangaId: assignment.mangaId,
        mangaTitle: assignment.mangaTitle || assignment.manga,
        chapter: assignment.chapter,
        assignments: [],
        driveLink: assignment.driveLink // Usar el drive link de la primera asignación
      };
    }
    groups[key].assignments.push(assignment);
    // Actualizar el drive link si no existe pero la nueva asignación sí tiene uno
    if (!groups[key].driveLink && assignment.driveLink) {
      groups[key].driveLink = assignment.driveLink;
    }
    return groups;
  }, {});

  // Convertir a array y ordenar por manga y capítulo
  const userChapterGroups = Object.values(groupedUserAssignments).sort((a, b) => {
    if (a.mangaTitle !== b.mangaTitle) {
      return a.mangaTitle.localeCompare(b.mangaTitle);
    }
    return parseInt(a.chapter) - parseInt(b.chapter);
  });

  // Filtrar mangas
  const filteredMangas = mangas.filter(manga => {
    const matchesSearch = manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (manga.author && manga.author.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || manga.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box className="sm-loading-spinner" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={48} sx={{ color: '#6a9eff' }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="sm-container" sx={{ mt: 4, mb: 4, minHeight: '100vh' }}>

      {/* ── Header ── */}
      <Box
        className="sm-header"
        sx={{
          mb: 5,
          p: { xs: 3, md: 4 },
          borderRadius: '16px',
          background: 'rgba(20, 21, 27, 0.72)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box
            className="sm-header-icon"
            sx={{
              width: 52,
              height: 52,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6a9eff, #a78bfa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MenuBookIcon sx={{ fontSize: 26, color: 'white' }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: '#e2e4e9',
                fontSize: { xs: '1.5rem', md: '2rem' },
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Gestión por Series
            </Typography>
            <Typography variant="body2" sx={{ color: '#7d8190', mt: 0.5, fontWeight: 400 }}>
              Vista organizada por series mostrando todas las asignaciones
            </Typography>
          </Box>
        </Box>

        {/* Stat pills */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3 }}>
          <Box className="sm-stat-pill" sx={{
            px: 2, py: 1, borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.18)',
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <MenuBookIcon sx={{ color: '#10b981', fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
              {filteredMangas.length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(16,185,129,0.7)', fontWeight: 500 }}>
              series
            </Typography>
          </Box>

          <Box className="sm-stat-pill" sx={{
            px: 2, py: 1, borderRadius: '10px',
            background: 'rgba(106, 158, 255, 0.1)',
            border: '1px solid rgba(106, 158, 255, 0.18)',
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <AssignmentIcon sx={{ color: '#6a9eff', fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: '#6a9eff', fontWeight: 600 }}>
              {assignments.length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(106,158,255,0.7)', fontWeight: 500 }}>
              asignaciones
            </Typography>
          </Box>

          <Box className="sm-stat-pill" sx={{
            px: 2, py: 1, borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.18)',
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <CheckCircleIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 600 }}>
              {assignments.filter(a => a.status === 'completado').length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(245,158,11,0.7)', fontWeight: 500 }}>
              completadas
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Controls ── */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por título o autor..."
          className="sm-search-field"
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#7d8190', mr: 1, fontSize: 20 }} />,
          }}
          sx={{
            flex: { xs: '1 1 100%', sm: '1 1 280px' },
            maxWidth: { sm: 360 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              height: 42,
              fontSize: '0.875rem',
              transition: 'border-color 200ms ease, box-shadow 200ms ease',
              '& fieldset': { border: 'none' },
              '&:hover': { borderColor: 'rgba(106,158,255,0.2)' },
              '&.Mui-focused': {
                borderColor: 'rgba(106,158,255,0.5)',
                boxShadow: '0 0 0 3px rgba(106,158,255,0.08)',
              },
            },
            '& .MuiOutlinedInput-input': { color: '#e2e4e9' },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            displayEmpty
            sx={{
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              height: 42,
              fontSize: '0.875rem',
              color: '#e2e4e9',
              transition: 'border-color 200ms ease',
              '& fieldset': { border: 'none' },
              '&:hover': { borderColor: 'rgba(106,158,255,0.2)' },
              '& .MuiSelect-icon': { color: '#7d8190' },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  background: 'rgba(20,21,27,0.96)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '10px',
                  mt: 0.5,
                  '& .MuiMenuItem-root': {
                    fontSize: '0.875rem',
                    borderRadius: '6px',
                    mx: 0.5,
                    '&:hover': { background: 'rgba(106,158,255,0.1)' },
                    '&.Mui-selected': { background: 'rgba(106,158,255,0.15)' },
                  },
                },
              },
            }}
          >
            <MenuItem value="all">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon sx={{ fontSize: 16, color: '#7d8190' }} />
                Todos
              </Box>
            </MenuItem>
            <MenuItem value="active">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box className="sm-status-dot sm-status-dot--active" />
                Activo
              </Box>
            </MenuItem>
            <MenuItem value="completed">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box className="sm-status-dot sm-status-dot--completed" />
                Completado
              </Box>
            </MenuItem>
            <MenuItem value="paused">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box className="sm-status-dot sm-status-dot--progress" />
                Pausado
              </Box>
            </MenuItem>
            <MenuItem value="cancelled">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,85,0.4)' }} />
                Cancelado
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* ── Content ── */}
      {filteredMangas.length === 0 ? (
          <Box sx={{
            p: 6, textAlign: 'center',
            borderRadius: '16px',
            background: 'rgba(20,21,27,0.72)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <MenuBookIcon sx={{ fontSize: 48, color: '#7d8190', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#7d8190', fontWeight: 500 }}>
              {searchTerm || statusFilter !== 'all' ? 
                'No se encontraron series que coincidan con los filtros' : 
                'No hay series disponibles'
              }
            </Typography>
            {!searchTerm && statusFilter === 'all' && (
              <Typography variant="body2" sx={{ color: '#7d8190', mt: 1, opacity: 0.7 }}>
                Las series aparecerán aquí cuando sean creadas desde el panel de administración
              </Typography>
            )}
          </Box>
        ) : (
          filteredMangas.map((manga) => {
            const isExpanded = expandedSeries[manga.id];
            const stats = getAssignmentStats(manga);
            const statusConfig = MANGA_STATUS[manga.status] || MANGA_STATUS.active;

            return (
              <Card
                key={manga.id}
                className="series-card"
                sx={{
                  mb: 2,
                  background: 'rgba(20, 21, 27, 0.72)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  width: '100%',
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  {/* Manga Header */}
                  <Box 
                    sx={{ 
                      p: { xs: 2, md: 2.5 },
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      transition: 'background-color 200ms ease',
                      '&:hover': { backgroundColor: 'rgba(106,158,255,0.03)' },
                    }}
                    onClick={() => handleToggleExpand(manga.id)}
                  >
                    {/* Cover */}
                    {manga.coverImage ? (
                      <Box
                        component="img"
                        src={manga.coverImage}
                        alt={manga.title}
                        className="sm-cover"
                        sx={{
                          width: { xs: 56, md: 68 },
                          height: { xs: 80, md: 96 },
                          objectFit: 'cover',
                          borderRadius: '8px',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <Box
                        className="sm-cover"
                        sx={{
                          width: { xs: 56, md: 68 },
                          height: { xs: 80, md: 96 },
                          borderRadius: '8px',
                          background: 'rgba(106,158,255,0.12)',
                          border: '1px solid rgba(106,158,255,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <BookIcon sx={{ fontSize: 28, color: '#6a9eff' }} />
                      </Box>
                    )}

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            color: '#e2e4e9',
                            fontSize: { xs: '0.95rem', md: '1.05rem' },
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: { xs: 180, sm: 'none' },
                          }}
                        >
                          {manga.title}
                        </Typography>
                        <Chip
                          label={statusConfig.label}
                          size="small"
                          className="sm-chip"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            bgcolor: `${statusConfig.color}15`,
                            color: statusConfig.color,
                            border: `1px solid ${statusConfig.color}25`,
                          }}
                        />
                        {manga.isJoint && (
                          <Chip
                            label={`Joint · ${manga.jointPartner || 'Otro grupo'}`}
                            size="small"
                            className="sm-chip"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              bgcolor: 'rgba(147,51,234,0.1)',
                              color: '#a78bfa',
                              border: '1px solid rgba(147,51,234,0.2)',
                            }}
                          />
                        )}
                        {(userProfile?.role === 'admin' || userProfile?.role === 'jefe_editor' || userProfile?.role === 'jefe_traductor') && manga.driveLink && (
                          <Button
                            size="small"
                            className="sm-btn"
                            startIcon={<LinkIcon sx={{ fontSize: '14px !important' }} />}
                            href={manga.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              minWidth: 'auto',
                              px: 1,
                              py: 0.25,
                              fontSize: '0.7rem',
                              height: 22,
                              backgroundColor: 'rgba(106,158,255,0.08)',
                              color: '#6a9eff',
                              border: '1px solid rgba(106,158,255,0.15)',
                              borderRadius: '6px',
                              textTransform: 'none',
                              fontWeight: 500,
                              '&:hover': { backgroundColor: 'rgba(106,158,255,0.15)' },
                            }}
                          >
                            Drive
                          </Button>
                        )}
                      </Box>

                      {manga.author && (
                        <Typography variant="caption" sx={{ color: '#7d8190', display: 'block', mb: 1 }}>
                          {manga.author}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{ color: '#7d8190' }}>
                          <Box component="span" sx={{ color: '#6a9eff', fontWeight: 600 }}>{stats.totalChapters}</Box> caps
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#7d8190' }}>
                          <Box component="span" sx={{ color: '#6a9eff', fontWeight: 600 }}>{stats.totalAssignments}</Box> asignaciones
                        </Typography>
                        {stats.total > 0 && (
                          <Typography variant="caption" sx={{ color: '#7d8190' }}>
                            <Box component="span" sx={{ color: '#10b981', fontWeight: 600 }}>{stats.completed}</Box>/{stats.total} completados
                          </Typography>
                        )}
                      </Box>

                      {stats.total > 0 && (
                        <Box className="sm-progress-track" sx={{ mt: 1.5 }}>
                          <Box
                            className="sm-progress-fill"
                            sx={{ width: `${stats.progress}%` }}
                          />
                        </Box>
                      )}
                    </Box>

                    <IconButton size="small" sx={{ color: '#7d8190', ml: 1 }}>
                      <ExpandMoreIcon
                        className={`sm-expand-icon ${isExpanded ? 'sm-expand-icon--open' : ''}`}
                      />
                    </IconButton>
                  </Box>

                  {/* Assignments Table */}
                  <Collapse in={isExpanded} timeout={300} unmountOnExit easing={{
                    enter: 'cubic-bezier(0.23, 1, 0.32, 1)',
                    exit: 'cubic-bezier(0.23, 1, 0.32, 1)',
                  }}>
                    <Box sx={{
                      px: { xs: 2, md: 2.5 },
                      pb: 2.5,
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <AssignmentsTable
                        manga={manga}
                        assignments={assignments}
                        users={users}
                        chapters={chapters}
                        onAssignmentClick={handleAssignmentClick}
                        onCreateAssignment={handleCreateAssignment}
                        onCreateChapter={handleCreateChapter}
                        onDeleteAssignment={handleDeleteAssignment}
                        userProfile={userProfile}
                        onMarkUploaded={handleMarkUploaded}
                        onMarkNotUploaded={handleMarkNotUploaded}
                        onEditUnavailableTask={handleEditUnavailableTask}
                      />
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            );
          })
        )}

      {/* Chapter Dialog */}
      <ChapterDialog
        open={chapterDialog.open}
        onClose={() => setChapterDialog({ open: false, manga: null, chapterData: null })}
        manga={chapterDialog.manga}
        chapterData={chapterDialog.chapterData}
        onSave={handleSaveChapter}
      />

      {/* Assignment Dialog */}
      <AssignmentDialog
        open={assignmentDialog.open}
        onClose={() => setAssignmentDialog({ 
          open: false, 
          assignment: null, 
          manga: null,
          prefilledChapter: null,
          prefilledType: null,
          inheritedDriveLink: ''
        })}
        assignment={assignmentDialog.assignment}
        manga={assignmentDialog.manga}
        users={users}
        onSave={handleSaveAssignment}
        prefilledChapter={assignmentDialog.prefilledChapter}
        prefilledType={assignmentDialog.prefilledType}
        inheritedDriveLink={assignmentDialog.inheritedDriveLink}
      />

      {/* Unavailable Text Dialog */}
      <Dialog 
        open={unavailableTextDialog.open} 
        onClose={() => setUnavailableTextDialog({ open: false, manga: null, chapter: null, taskType: null, currentText: '' })}
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(20,21,27,0.96)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
          }
        }}
      >
        <DialogTitle sx={{ color: '#e2e4e9', fontWeight: 600, fontSize: '1.1rem' }}>
          Editar texto personalizado
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Personalizando texto para la tarea "<strong>{ASSIGNMENT_TYPES[unavailableTextDialog.taskType]?.label || unavailableTextDialog.taskType}</strong>" 
            en el capítulo <strong>{unavailableTextDialog.chapter}</strong> de 
            "<strong>{unavailableTextDialog.manga?.title}</strong>"
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Texto personalizado"
            multiline
            rows={3}
            value={unavailableTextDialog.currentText}
            onChange={(e) => setUnavailableTextDialog(prev => ({ ...prev, currentText: e.target.value }))}
            variant="outlined"
            placeholder="Ej: No necesario para este proyecto, Realizado por otro grupo, etc..."
            helperText="Deja vacío para mostrar el texto por defecto 'No disponible'"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button 
            onClick={() => setUnavailableTextDialog({ open: false, manga: null, chapter: null, taskType: null, currentText: '' })}
            className="sm-btn"
            sx={{ color: '#7d8190', textTransform: 'none', fontWeight: 500 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              handleSaveUnavailableText(unavailableTextDialog.currentText);
              setUnavailableTextDialog({ open: false, manga: null, chapter: null, taskType: null, currentText: '' });
            }}
            className="sm-btn"
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              backgroundColor: '#6a9eff',
              '&:hover': { backgroundColor: '#5b8de6' },
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: '10px',
            fontWeight: 500,
            fontSize: '0.875rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SeriesManagement;
