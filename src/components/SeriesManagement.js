import React, { useState, useEffect } from 'react';
import './SeriesManagement.css';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  CircularProgress,
  Alert,
  Snackbar,
  DialogContentText,
  Autocomplete,
  ButtonBase,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Book as BookIcon,
  Link as LinkIcon,
  Search as SearchIcon,
  MenuBook as MenuBookIcon,
  PlaylistAdd as PlaylistAddIcon,
  Work as WorkIcon,
  AccountCircle as AccountCircleIcon,
  CloudUpload as CloudUploadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import { getUniqueUsers } from '../utils/cleanDuplicateUsers';
import { isoStringToDateInput, dateInputToISOString } from '../utils/dateUtils';
import { ASSIGNMENT_TYPES, ROLE_LABELS, MANGA_STATUS } from '../utils/constants';
import { PageHeader, Panel, MeterBar, EmptyState, StatusBadge } from './ui';
import { triggerHaptic } from '../hooks/useWebHaptics';
import { colors, radius, rowDivider, focusOutline, withAlpha } from '../theme/tokens';

// Estados y configuraciones
// Estados y tipos de tarea compartidos (src/utils/constants.js)

// Componente para mostrar información de asignación
const AssignmentInfo = ({ assignment, users }) => {
  if (!assignment || !assignment.assignedTo || assignment.status === 'sin_asignar') {
    return (
      <Typography sx={{ fontSize: '0.75rem', color: colors.outline }}>Sin asignar</Typography>
    );
  }

  const assignedUser = users.find(u => (u.uid || u.id) === assignment.assignedTo);
  const typeConfig = ASSIGNMENT_TYPES[assignment.type] || ASSIGNMENT_TYPES.traduccion;
  const userName = assignedUser?.name || assignment.assignedToName || 'Usuario desconocido';
  const userPhotoURL = assignedUser?.profileImage || assignedUser?.photoURL || assignedUser?.avatar;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Tooltip title={`${typeConfig.label}: ${userName}`}>
        <Avatar src={userPhotoURL || undefined} alt="" sx={{ width: 26, height: 26, fontSize: '0.6875rem', fontWeight: 700 }}>
          {!userPhotoURL && userName.substring(0, 2).toUpperCase()}
        </Avatar>
      </Tooltip>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: '0.75rem', fontWeight: 500, color: colors.onSurface, lineHeight: 1.3 }}>
          {userName}
        </Typography>
        <StatusBadge status={assignment.status} sx={{ height: 18, px: 0.625, mt: 0.25 }} />
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
        mb: 1,
        mt: 1,
        backgroundColor: colors.surfaceContainer,
        borderRadius: `${radius.lg}px`,
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { py: 1.25 } }}>
            <TableCell >Cap.</TableCell>
            <TableCell >Traducción</TableCell>
            <TableCell >Proofreading</TableCell>
            <TableCell >Clean/Redraw</TableCell>
            <TableCell >Typesetting</TableCell>
            <TableCell >Acciones</TableCell>
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
            
            
            // Estado del capítulo: el tono va en un punto junto al número (nada de franjas)
            const rowColor = isChapterUploaded ? colors.goodNews
              : isChapterCompleted ? colors.primary
              : hasWorkInProgress ? colors.attention
              : null;
            const rowLabel = isChapterUploaded ? 'Subido'
              : isChapterCompleted ? 'Completado'
              : hasWorkInProgress ? 'En curso'
              : 'Sin empezar';

            return (
              <TableRow
                key={chapter}
                className="sm-table-row"
                sx={{
                  '& td': { py: 1.25 },
                  '&:last-of-type td': { borderBottom: 'none' },
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title={rowLabel}>
                      <Box
                        component="span"
                        aria-label={rowLabel}
                        sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: rowColor || colors.outlineVariant }}
                      />
                    </Tooltip>
                    <Typography fontWeight={600} color="text.primary" sx={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      Cap. {chapter}
                    </Typography>
                  </Box>
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
                          color: 'error.main'
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
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', px: 1, py: 0.5 }}
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
                        sx={{ fontSize: '0.75rem', px: 1, py: 0.5 }}
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
                    src={option.profileImage || option.photoURL || option.avatar || undefined}
                    alt=""
                    sx={{ width: 30, height: 30, fontSize: '0.6875rem', fontWeight: 700 }}
                  >
                    {!(option.profileImage || option.photoURL || option.avatar) && option.name &&
                     (option.uid ? option.name.substring(0, 2).toUpperCase() : '?')}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.name || 'Usuario desconocido'}
                    </Typography>
                    {option.role && (
                      <Typography variant="caption" color="text.secondary">
                        {ROLE_LABELS[option.role] || option.role}
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
                        sx={{ width: 24, height: 24, fontSize: '0.625rem', fontWeight: 700, mr: 1 }}
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
        return <CloudUploadIcon sx={{ color: colors.onSurfaceVariant }} />;
      case ROLES.EDITOR:
      case ROLES.TRADUCTOR:
        return <WorkIcon sx={{ color: colors.onSurfaceVariant }} />;
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
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={40} aria-label="Cargando series" />
        </Box>
      </Box>
    );
  }

  // Recuentos del control de estado: series que pasan la búsqueda, por estado.
  const searchMatched = mangas.filter(
    (manga) =>
      manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (manga.author && manga.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const SERIES_FILTERS = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'paused', label: 'Pausadas' },
    { value: 'completed', label: 'Completadas' },
    { value: 'cancelled', label: 'Canceladas' },
  ].map((f) => ({
    ...f,
    count: f.value === 'all' ? searchMatched.length : searchMatched.filter((m) => m.status === f.value).length,
  }));
  const canSeeDrive = ['admin', 'jefe_editor', 'jefe_traductor'].includes(userProfile?.role);
  const completedAssignments = assignments.filter((a) => a.status === 'completado').length;

  return (
    <Box>
      <PageHeader
        title="Series"
        subtitle={`${mangas.length} ${mangas.length === 1 ? 'serie' : 'series'} · ${assignments.length} asignaciones · ${completedAssignments} completadas`}
      />

      <Panel
        title="Catálogo"
        count={filteredMangas.length}
        action={
          <TextField
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título o autor"
            inputProps={{ 'aria-label': 'Buscar series' }}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: colors.outline, mr: 1, fontSize: 20 }} /> }}
            sx={{ width: { xs: '100%', sm: 280 } }}
          />
        }
        sx={{ '& > div:first-of-type': { flexWrap: 'wrap' } }}
      >
        <Box sx={{ overflowX: 'auto', mb: 1.5, mx: -0.5, px: 0.5 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={statusFilter}
            onChange={(e, value) => {
              if (value !== null) {
                triggerHaptic('light');
                setStatusFilter(value);
              }
            }}
            aria-label="Estado de la serie"
          >
            {SERIES_FILTERS.map((f) => (
              <ToggleButton key={f.value} value={f.value} sx={{ px: 1.25, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                {f.label}
                <Box component="span" sx={{ ml: 0.75, color: colors.outline, fontVariantNumeric: 'tabular-nums' }}>
                  {f.count}
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {filteredMangas.length === 0 ? (
          <EmptyState
            icon={MenuBookIcon}
            title={searchTerm || statusFilter !== 'all' ? 'Ninguna serie con estos filtros' : 'Todavía no hay series'}
          >
            {searchTerm || statusFilter !== 'all'
              ? 'Prueba con otro estado o borra la búsqueda.'
              : 'Las series se crean desde Administración. Aparecerán aquí con sus capítulos y asignaciones.'}
          </EmptyState>
        ) : (
          <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', mx: -1 }}>
            {filteredMangas.map((manga) => {
              const isExpanded = Boolean(expandedSeries[manga.id]);
              const stats = getAssignmentStats(manga);
              const statusConfig = MANGA_STATUS[manga.status] || MANGA_STATUS.active;
              const panelId = `serie-${manga.id}`;
              return (
                <Box
                  component="li"
                  key={manga.id}
                  sx={{ '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` } }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <ButtonBase
                      onClick={() => {
                        triggerHaptic('light');
                        handleToggleExpand(manga.id);
                      }}
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        px: 1,
                        py: 1.5,
                        pr: { xs: 6, sm: canSeeDrive && manga.driveLink ? 12 : 6 },
                        borderRadius: `${radius.md}px`,
                        textAlign: 'left',
                        transition: 'background-color 150ms ease-out',
                        '&:hover': { backgroundColor: colors.surfaceContainer },
                        '&.Mui-focusVisible': { ...focusOutline, outlineOffset: -2 },
                      }}
                    >
                      {manga.coverImage ? (
                        <Box
                          component="img"
                          src={manga.coverImage}
                          alt=""
                          loading="lazy"
                          sx={{ width: 44, height: 62, objectFit: 'cover', borderRadius: `${radius.DEFAULT}px`, flexShrink: 0, backgroundColor: colors.surfaceHigh }}
                        />
                      ) : (
                        <Box
                          aria-hidden="true"
                          sx={{
                            width: 44,
                            height: 62,
                            borderRadius: `${radius.DEFAULT}px`,
                            backgroundColor: colors.surfaceHigh,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <BookIcon sx={{ fontSize: 20, color: colors.outline }} />
                        </Box>
                      )}

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                          <Typography noWrap component="h3" sx={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.onSurface, minWidth: 0 }}>
                            {manga.title}
                          </Typography>
                          <Box
                            component="span"
                            sx={{
                              flexShrink: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              height: 20,
                              px: 0.75,
                              borderRadius: `${radius.md}px`,
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              color: statusConfig.color,
                              backgroundColor: withAlpha(statusConfig.color, 0.1),
                            }}
                          >
                            {statusConfig.label}
                          </Box>
                          {manga.isJoint && (
                            <Box
                              component="span"
                              sx={{
                                flexShrink: 0,
                                display: { xs: 'none', sm: 'inline-flex' },
                                alignItems: 'center',
                                height: 20,
                                px: 0.75,
                                borderRadius: `${radius.md}px`,
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                color: colors.onSurfaceVariant,
                                backgroundColor: colors.surfaceHigh,
                              }}
                            >
                              Joint · {manga.jointPartner || 'otro grupo'}
                            </Box>
                          )}
                        </Box>
                        {manga.author && (
                          <Typography noWrap sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, mt: 0.25 }}>
                            {manga.author}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                            {stats.totalChapters} {stats.totalChapters === 1 ? 'capítulo' : 'capítulos'} · {stats.totalAssignments} asignaciones
                          </Typography>
                          {stats.total > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 160px', maxWidth: 260 }}>
                              <Box sx={{ flex: 1 }}>
                                <MeterBar value={stats.completed} max={stats.total} color={colors.primary} />
                              </Box>
                              <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                                {stats.completed}/{stats.total}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </ButtonBase>

                    {/* Acciones de la fila, fuera del botón para no anidar botones */}
                    <Box sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 0.25 }}>
                      {canSeeDrive && manga.driveLink && (
                        <Tooltip title="Abrir carpeta de Drive">
                          <IconButton
                            component="a"
                            href={manga.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Abrir carpeta de Drive de ${manga.title}`}
                            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                          >
                            <LinkIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton
                        onClick={() => handleToggleExpand(manga.id)}
                        aria-label={isExpanded ? 'Ocultar capítulos' : 'Ver capítulos'}
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                      >
                        <ExpandMoreIcon className={`sm-expand-icon ${isExpanded ? 'sm-expand-icon--open' : ''}`} sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Capítulos y asignaciones de la serie */}
                  <Collapse
                    in={isExpanded}
                    timeout={250}
                    unmountOnExit
                    easing={{ enter: 'cubic-bezier(0.16, 1, 0.3, 1)', exit: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                  >
                    <Box id={panelId} sx={{ px: 1, pb: 2, pt: 0.5 }}>
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
                </Box>
              );
            })}
          </Box>
        )}
      </Panel>

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
      >
        <DialogTitle>
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
            sx={{ color: colors.onSurfaceVariant }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              handleSaveUnavailableText(unavailableTextDialog.currentText);
              setUnavailableTextDialog({ open: false, manga: null, chapter: null, taskType: null, currentText: '' });
            }}
            variant="contained"
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
    </Box>
  );
};

export default SeriesManagement;
