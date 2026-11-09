import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Alert,
  ButtonBase,
  ToggleButton,
  ToggleButtonGroup,
  Drawer
} from '@mui/material';
import {
  Add,
  Edit,
  CheckCircle,
  Assignment,
  Link as LinkIcon,
  CalendarToday,
  Delete,
  DeleteSweep,
  MoreVert,
  Warning,
  Search,
  Clear,
  Person,
  Book,
  Refresh,
  Sync,
  Close,
  ScheduleRounded,
  LockOutlined
} from '@mui/icons-material';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import { getUniqueUsers } from '../utils/cleanDuplicateUsers';
import useAssignmentsSync from '../hooks/useAssignmentsSync';
import { isoStringToDateInput, dateInputToISOString } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import notify from '../utils/notify';
import { triggerHaptic } from '../hooks/useWebHaptics';
import PressIconButton from '../components/motion/PressIconButton';
import { PageHeader, Panel, StatusBadge, TaskTypeTag, MeterBar, EmptyState } from '../components/ui';
import { STATUS_CONFIG, ASSIGNMENT_TYPES, ROLE_LABELS } from '../utils/constants';
import { colors, radius, divider, rowDivider, focusOutline, withAlpha } from '../theme/tokens';

// Importar componentes adicionales para el nuevo diálogo
import { Autocomplete } from '@mui/material';

const Assignments = () => {
  const { userProfile, hasRole, currentUser, checkPermission } = useAuth();
  const [canAssignChapters, setCanAssignChapters] = useState(false);
  const [isPermissionLoading, setIsPermissionLoading] = useState(true);
  const [mangas, setMangas] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Usar hook personalizado para suscripción a asignaciones
  // Si el usuario no tiene permisos para asignar capítulos, solo ve sus propias asignaciones
  const userFilter = (!isPermissionLoading && !canAssignChapters) ? userProfile?.uid : null;
  
  const { 
    assignments, 
    loading: assignmentsLoading, 
    error: assignmentsError,
    forceRefresh
  } = useAssignmentsSync(userFilter);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, data: null });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, group: null });
  const [filters, setFilters] = useState({
    manga: '',
    user: '',
    status: 'pendiente', // Mostrar pendientes por defecto
    search: '',
    week: ''
  });
  const [syncLoading, setSyncLoading] = useState(false);
  const [formData, setFormData] = useState({
    mangaId: '',
    chapter: '',
    tasks: [], // Array de tareas - sin selección por defecto
    assignedTo: '',
    driveLink: '',
    dueDate: '',
    priority: 'normal'
  });

  // Estados para el diálogo estilo SeriesManagement
  const [assignmentDialog, setAssignmentDialog] = useState({ 
    open: false, 
    assignment: null, 
    manga: null
  });

  // Estado para el diálogo de error de capítulo completado
  const [chapterCompletedDialog, setChapterCompletedDialog] = useState({
    open: false,
    mangaTitle: '',
    chapter: '',
    reason: '',
    chapterData: null
  });

  // Estado para el formulario del nuevo diálogo estilo SeriesManagement
  const [newAssignmentForm, setNewAssignmentForm] = useState({
    mangaId: '',
    mangaTitle: '',
    chapter: '',
    tasks: ['traduccion'], // Array de tareas como en el diálogo original
    assignedTo: '',
    dueDate: '',
    notes: '',
    driveLink: '',
    rawLink: '' // Agregado para manejar enlaces RAW
  });

  const TASK_TYPES = {
    traduccion: 'Traducción',
    proofreading: 'Proofreading',
    cleanRedrawer: 'Clean/Redrawer',
    type: 'Typesetting'
  };

  // Mapeo entre los nombres de tareas del AdminPanel y los del componente Assignments
  const ADMIN_TO_ASSIGNMENT_TASK_MAP = {
    traduccion: 'traduccion',
    proofreading: 'proofreading',
    limpieza: 'cleanRedrawer',
    typesetting: 'type'
  };

  // Función para obtener las tareas permitidas para un manga
  const getAvailableTasksForManga = (mangaId) => {
    const manga = mangas.find(m => m.id === mangaId);
    if (!manga) return Object.keys(TASK_TYPES);
    
    // Si es un manga joint y tiene tareas específicas configuradas
    if (manga.isJoint && manga.availableTasks && manga.availableTasks.length > 0) {
      // Convertir las tareas del AdminPanel a las tareas del componente Assignments
      return manga.availableTasks
        .map(adminTask => ADMIN_TO_ASSIGNMENT_TASK_MAP[adminTask])
        .filter(task => task); // Filtrar tareas undefined
    }
    
    // Si no es joint o no tiene restricciones, devolver todas las tareas
    return Object.keys(TASK_TYPES);
  };

  // Función para verificar si un capítulo ya está completado/publicado
  const checkIfChapterCompleted = async (mangaId, chapterNumber) => {
    try {
      //  message removed for production
      
      // Obtener los capítulos del manga
      const chapters = await realtimeService.getChapters(mangaId);
      //  message removed for production
      
      // Buscar el capítulo específico
      const chapter = chapters.find(ch => {
        const chNum = parseFloat(ch.chapter || ch.number);
        const targetNum = parseFloat(chapterNumber);
        return chNum === targetNum;
      });
      
      if (!chapter) {
        //  message removed for production
        return { isCompleted: false, reason: null };
      }
      
      // Debug message removed for production
      
      // Verificar los diferentes indicadores de que el capítulo está completado/publicado
      const checks = {
        // Fechas de subida
        hasValidUploadDate: chapter.fechaSubida && 
                           typeof chapter.fechaSubida === 'string' && 
                           chapter.fechaSubida.trim() !== '' &&
                           chapter.fechaSubida !== 'No especificada',
        hasUploadDate: chapter.uploadDate && 
                      typeof chapter.uploadDate === 'string' &&
                      chapter.uploadDate.trim() !== '',
        hasPublishDate: chapter.publishDate && 
                       typeof chapter.publishDate === 'string' &&
                       chapter.publishDate.trim() !== '',
        
        // Links y URLs
        hasValidLink: chapter.linkCapitulo && 
                     typeof chapter.linkCapitulo === 'string' && 
                     chapter.linkCapitulo.trim() !== '',
        hasUrl: chapter.url && 
               typeof chapter.url === 'string' && 
               chapter.url.trim() !== '',
        
        // Estados explícitos
        hasUploadedStatus: chapter.status && 
                          ['uploaded', 'publicado', 'completado', 'subido', 'published', 'complete', 'listo'].includes(chapter.status.toLowerCase()),
        isUploadedFlag: chapter.uploaded === true || chapter.uploaded === 'true',
        isMarkedAsPublished: chapter.published === true || chapter.published === 'true',
        isMarkedAsCompleted: chapter.completed === true || chapter.completed === 'true',
        
        // Estados adicionales que podrían indicar completado
        hasReleaseDate: chapter.releaseDate && 
                       typeof chapter.releaseDate === 'string' &&
                       chapter.releaseDate.trim() !== '',
        isActive: chapter.active === true || chapter.active === 'true',
        isAvailable: chapter.available === true || chapter.available === 'true',
        
        // Verificar si tiene progreso completo (100%)
        hasCompleteProgress: chapter.progress === 100 || chapter.progress === '100',
        
        // Estados específicos del sistema
        isInGreen: chapter.color === 'green' || chapter.state === 'green' || chapter.status === 'green',
        isFinished: chapter.finished === true || chapter.finished === 'true',
        isDone: chapter.done === true || chapter.done === 'true'
      };
      
      //  message removed for production
      
      const isCompleted = Object.values(checks).some(check => check);
      
      //  message removed for production
      
      // Verificación adicional: revisar si todas las asignaciones de este capítulo ya están completadas
      let allAssignmentsCompleted = false;
      let assignmentCompletionReason = '';
      
      try {
        //  message removed for production
        
        // Obtener todas las asignaciones de este manga y capítulo
        const existingAssignments = assignments.filter(a => 
          a.mangaId === mangaId && 
          a.chapter.toString() === chapterNumber.toString()
        );
        
        //  message removed for production
        
        if (existingAssignments.length > 0) {
          // Debug message removed for production));
          
          // Verificar si todas las asignaciones están completadas
          const completedAssignments = existingAssignments.filter(a => a.status === 'completado');
          const totalAssignments = existingAssignments.length;
          
          //  message removed for production
          
          if (completedAssignments.length === totalAssignments && totalAssignments > 0) {
            allAssignmentsCompleted = true;
            const taskTypes = existingAssignments.map(a => TASK_TYPES[a.type] || a.type).join(', ');
            assignmentCompletionReason = `Todas las asignaciones del capítulo ya están completadas (${taskTypes})`;
            //  message removed for production
          }
        }
      } catch (error) {
        //  message removed for production
      }
      
      const finalIsCompleted = isCompleted || allAssignmentsCompleted;
      //  message removed for production
      
      if (finalIsCompleted) {
        // Determinar la razón específica
        let reason = 'El capítulo ya está ';
        
        if (checks.hasValidUploadDate || checks.hasUploadDate) {
          reason += 'subido con fecha';
        } else if (checks.hasValidLink || checks.hasUrl) {
          reason += 'publicado con enlace';
        } else if (checks.hasUploadedStatus) {
          reason += `marcado como "${chapter.status}"`;
        } else if (checks.isMarkedAsPublished) {
          reason += 'marcado como publicado';
        } else if (checks.isMarkedAsCompleted) {
          reason += 'marcado como completado';
        } else if (checks.hasCompleteProgress) {
          reason += 'completado al 100%';
        } else if (checks.isInGreen) {
          reason += 'marcado en verde (completado)';
        } else if (checks.isFinished || checks.isDone) {
          reason += 'marcado como finalizado';
        } else {
          reason += 'completado';
        }
        
        //  message removed for production
        return { isCompleted: true, reason, chapterData: chapter };
      }
      
      //  message removed for production
      return { isCompleted: false, reason: null };
    } catch (error) {
      //  message removed for production
      return { isCompleted: false, reason: null };
    }
  };

  // Configurar otras suscripciones (mangas y usuarios)
  useEffect(() => {
    if (!userProfile) return;
    
    let unsubscribeMangas = null;
    let unsubscribeUsers = null;
    
    const initSubscriptions = async () => {
      try {
        // Obtener mangas
        unsubscribeMangas = await realtimeService.subscribeToMangas(setMangas);

        // Obtener usuarios (siempre para mostrar nombres correctamente)
        unsubscribeUsers = await realtimeService.subscribeToUsers(setUsers);
      } catch (error) {
        // Error setting up subscriptions - silently handle
      }
    };

    initSubscriptions();

    return () => {
      if (typeof unsubscribeMangas === 'function') {
        unsubscribeMangas();
      }
      if (typeof unsubscribeUsers === 'function') {
        unsubscribeUsers();
      }
    };
  }, [userProfile]);

  // Función para corregir automáticamente nombres incorrectos
  const fixIncorrectUserNames = async () => {
    if (assignments.length === 0 || users.length === 0) return;

    const assignmentsToFix = assignments.filter(assignment => 
      assignment.assignedToName === 'Usuario desconocido' && 
      users.find(u => (u.uid || u.id) === assignment.assignedTo)
    );

    if (assignmentsToFix.length > 0) {
      //  message removed for production
      
      for (const assignment of assignmentsToFix) {
        const correctUser = users.find(u => (u.uid || u.id) === assignment.assignedTo);
        if (correctUser) {
          await realtimeService.updateAssignment(assignment.id, {
            assignedToName: correctUser.name
          });
          //  message removed for production
        }
      }
    }
  };

  // Función para sincronizar estados de asignaciones con capítulos publicados
  const handleSyncAssignments = async () => {
    if (syncLoading) return;
    
    setSyncLoading(true);
    try {
      //  message removed for production
      const result = await realtimeService.syncAssignmentsWithPublishedChapters();
      
      if (result.updated > 0) {
        toast.success(
          `✅ ¡Sincronización completada!\n${result.updated}/${result.total} asignaciones actualizadas`, 
          { duration: 4000 }
        );
        
        // Mostrar detalles de las actualizaciones
        if (result.updates && result.updates.length > 0) {
          //  message removed for production
          result.updates.forEach(update => {
            //  message removed for production
          });
        }
      } else {
        toast.success('✨ Todas las asignaciones ya están sincronizadas', { duration: 2000 });
      }
      
      // Forzar actualización de la vista
      setTimeout(() => {
        forceRefresh();
      }, 500);
      
    } catch (error) {
      //  message removed for production
      toast.error('Error al sincronizar asignaciones: ' + (error.message || 'Error desconocido'));
    } finally {
      setSyncLoading(false);
    }
  };

  // CORREGIDO: Sincronización automática deshabilitada para evitar marcado
  // incorrecto de capítulos como completados cuando solo se completa una asignación.
  // La sincronización ahora es solo manual mediante el botón correspondiente.
  // 
  // useEffect(() => {
  //   if (assignments.length > 0 && users.length > 0 && mangas.length > 0) {
  //     // Ejecutar sincronización automática cada vez que se carga la página
  //     const timeoutId = setTimeout(() => {
  //       handleSyncAssignments();
  //     }, 1500); // Esperar 1.5 segundos para que todo esté cargado
  //     
  //     // Cleanup en caso de que el componente se desmonte antes
  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [assignments.length, users.length, mangas.length]);

  // Ejecutar corrección cuando ambos datos estén cargados
  useEffect(() => {
    if (assignments.length > 0 && users.length > 0) {
      fixIncorrectUserNames();
    }
  }, [assignments.length, users.length]);

  // Effect para verificar permisos
  useEffect(() => {
    const checkAssignmentPermissions = async () => {
      if (currentUser && userProfile) {
        try {
          const hasPermission = await checkPermission('canAssignChapters');
          setCanAssignChapters(hasPermission);
        } catch (error) {
          console.error('Error verificando permiso canAssignChapters:', error);
          setCanAssignChapters(false);
        }
      } else {
        setCanAssignChapters(false);
      }
      setIsPermissionLoading(false);
    };
    
    checkAssignmentPermissions();
  }, [currentUser, userProfile, checkPermission]);

  // Mostrar loading mientras se verifican permisos
  if (isPermissionLoading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography sx={{ color: colors.onSurfaceVariant }}>Verificando permisos…</Typography>
      </Box>
    );
  }

  // Restricción de acceso - verificar permisos personalizados
  if (!userProfile || !canAssignChapters) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', mt: 6 }}>
        <Panel>
          <EmptyState icon={LockOutlined} title="No tienes acceso a Asignaciones">
            Esta página es para quien reparte capítulos. Si deberías poder entrar, pide a un administrador que te dé el permiso «Asignar capítulos».
          </EmptyState>
        </Panel>
      </Box>
    );
  }

  const handleOpenDialog = (assignment = null) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        mangaId: assignment.mangaId,
        chapter: assignment.chapter,
        tasks: assignment.tasks || [assignment.type], // Compatibilidad con versión anterior
        assignedTo: assignment.assignedTo,
        driveLink: assignment.driveLink || '',
        dueDate: assignment.dueDate ? isoStringToDateInput(assignment.dueDate) : '',
        priority: assignment.priority || 'normal'
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        mangaId: '',
        chapter: '',
        tasks: [], // Sin selección automática de tareas
        assignedTo: '',
        driveLink: '',
        dueDate: '',
        priority: 'normal'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAssignment(null);
  };

  const handleSubmit = async () => {
    try {
      // Validaciones básicas
      if (!formData.mangaId || !formData.chapter) {
        toast.error('Por favor completa el manga y el capítulo');
        return;
      }

      // Validar que se haya seleccionado al menos una tarea
      if (!formData.tasks || formData.tasks.length === 0) {
        toast.error('Por favor selecciona al menos una tarea');
        return;
      }

      // Validar que las tareas seleccionadas sean permitidas para el manga joint
      const availableTasks = getAvailableTasksForManga(formData.mangaId);
      const invalidTasks = formData.tasks.filter(task => !availableTasks.includes(task));
      if (invalidTasks.length > 0) {
        const invalidTaskNames = invalidTasks.map(task => TASK_TYPES[task]).join(', ');
        toast.error(`Las siguientes tareas no están disponibles para este manga: ${invalidTaskNames}`);
        return;
      }

      // Validar que el capítulo no esté ya completado/publicado
      const chapterStatus = await checkIfChapterCompleted(formData.mangaId, formData.chapter);
      if (chapterStatus.isCompleted) {
        toast.error(
          `❌ No se puede crear/editar esta asignación: ${chapterStatus.reason}`,
          {
            duration: 5000,
            style: {
              maxWidth: '500px',
            }
          }
        );
        return;
      }

      const manga = mangas.find(m => m.id === formData.mangaId);
      // Buscar usuario por uid o id para manejar ambos casos
      const assignedUser = users.find(u => (u.uid || u.id) === formData.assignedTo);

      const assignmentData = {
        ...formData,
        type: formData.tasks[0], // Mantener compatibilidad con campo type
        mangaTitle: manga?.title || 'Manga desconocido',
        assignedToName: assignedUser?.name || 'Usuario desconocido',
        status: editingAssignment?.status || 'pendiente',
        progress: editingAssignment?.progress || 0,
        createdBy: userProfile.uid,
        createdAt: editingAssignment?.createdAt || new Date().toISOString(),
        dueDate: formData.dueDate ? dateInputToISOString(formData.dueDate) : null
      };

      if (editingAssignment) {
        await realtimeService.updateAssignment(editingAssignment.id, assignmentData);
        toast.success('Asignación actualizada exitosamente');
      } else {
        const result = await realtimeService.createAssignment(assignmentData);
        toast.success(`Asignación creada exitosamente. Link: ${window.location.origin}/shared/${result.shareableId}`);
      }

      handleCloseDialog();
    } catch (error) {
      //  message removed for production
      toast.error('Error al guardar la asignación');
    }
  };

  const handleUpdateProgress = async (assignmentId, newProgress) => {
    try {
      const status = newProgress === 100 ? 'completado' : 'en_progreso';
      await realtimeService.updateAssignment(assignmentId, {
        progress: newProgress,
        status
      });
      toast.success('Progreso actualizado');
    } catch (error) {
      //  message removed for production
      toast.error('Error al actualizar el progreso');
    }
  };

  // Función para determinar si una asignación fue completada con atraso
  const wasCompletedLate = (assignment) => {
    if (!assignment.dueDate) return false;
    
    const finalStates = ['completado', 'aprobado', 'uploaded'];
    if (!finalStates.includes(assignment.status)) return false;
    
    const dueDate = new Date(assignment.dueDate);
    const completedDate = assignment.completedDate ? new Date(assignment.completedDate) : new Date();
    
    return completedDate > dueDate;
  };

  // Función para obtener el texto del estado con indicador de atraso
  const canManageAssignment = (assignment) => {
    // Si tiene permisos de asignación, puede gestionar cualquier asignación
    // O si es el usuario asignado, puede gestionar su propia asignación
    return canAssignChapters || assignment.assignedTo === userProfile?.uid;
  };

  const canMarkAsCompleted = (assignment) => {
    // Si tiene permisos de asignación, puede marcar como completada
    return canAssignChapters;
  };

  const handleMarkAsCompleted = async (assignmentId) => {
    try {
      // Encontrar la asignación para mostrar información más detallada
      const assignment = assignments.find(a => a.id === assignmentId);
      const assignmentInfo = assignment 
        ? `${assignment.mangaTitle} Cap.${assignment.chapter} - ${TASK_TYPES[assignment.type] || assignment.type}`
        : 'Asignación';
      
      await realtimeService.updateAssignment(assignmentId, {
        status: 'completado',
        progress: 100,
        completedDate: new Date().toISOString(),
        completedBy: userProfile.uid
      });
      
      toast.success(
        `✅ Completada: ${assignmentInfo}`,
        {
          duration: 3000,
          icon: '🎉'
        }
      );
    } catch (error) {
      //  message removed for production
      toast.error(`❌ Error al marcar como completada: ${error.message || 'Error desconocido'}`);
    }
  };

  const filteredUsers = users.filter(user => {
    // Si tiene permisos de asignación, puede asignar a cualquier usuario activo
    // En el futuro se pueden implementar permisos más granulares por tipo de tarea
    if (canAssignChapters) {
      return user.status === 'active' || !user.status; // Mostrar usuarios activos o sin estado definido
    }
    
    return false;
  });

  // Función para agrupar asignaciones por manga-capítulo-usuario
  const groupedAssignments = () => {
    const groups = {};
    
    assignments.forEach(assignment => {
      const key = `${assignment.mangaId}-${assignment.chapter}-${assignment.assignedTo}`;
      if (!groups[key]) {
        groups[key] = {
          mangaId: assignment.mangaId,
          mangaTitle: assignment.mangaTitle,
          chapter: assignment.chapter,
          assignedTo: assignment.assignedTo,
          assignedToName: assignment.assignedToName,
          assignments: [],
          driveLink: assignment.driveLink,
          dueDate: assignment.dueDate
        };
      }
      groups[key].assignments.push(assignment);
      // Actualizar fecha límite más próxima
      if (assignment.dueDate && (!groups[key].dueDate || assignment.dueDate < groups[key].dueDate)) {
        groups[key].dueDate = assignment.dueDate;
      }
      // Usar el Drive link si no está definido
      if (assignment.driveLink && !groups[key].driveLink) {
        groups[key].driveLink = assignment.driveLink;
      }
    });
    
    return Object.values(groups);
  };

  const getOverallProgress = (assignments) => {
    if (!assignments || assignments.length === 0) return 0;
    const totalProgress = assignments.reduce((sum, assignment) => sum + (assignment.progress || 0), 0);
    return Math.round(totalProgress / assignments.length);
  };

  const getGroupStatus = (assignments) => {
    // Considerar estados finales: completado, aprobado, uploaded
    const finalStates = ['completado', 'aprobado', 'uploaded'];
    const allCompleted = assignments.every(a => finalStates.includes(a.status));
    const anyInProgress = assignments.some(a => a.status === 'en_progreso');
    
    if (allCompleted) return 'completado';
    if (anyInProgress) return 'en_progreso';
    return 'pendiente';
  };

  const getUserAvatar = (userId) => {
    const user = users.find(u => (u.uid || u.id) === userId);
    if (user && (user.profileImage || user.photoURL || user.avatar)) {
      return user.profileImage || user.photoURL || user.avatar;
    }
    return null;
  };

  const getUserName = (userId, fallbackName) => {
    if (!userId) return 'Usuario desconocido';
    const user = users.find(u => (u.uid || u.id) === userId);
    return user?.name || (fallbackName && fallbackName !== 'Usuario desconocido' ? fallbackName : 'Usuario desconocido');
  };

  const getUserRole = (userId) => {
    if (!userId) return '';
    const user = users.find(u => (u.uid || u.id) === userId);
    return ROLE_LABELS[user?.role] || user?.role || '';
  };

  // Funciones de eliminación
  const handleDeleteSingle = async (assignmentId) => {
    try {
      await realtimeService.deleteAssignment(assignmentId);
      toast.success('Asignación eliminada exitosamente');
      setDeleteDialog({ open: false, type: null, data: null });
    } catch (error) {
      //  message removed for production
      toast.error('Error al eliminar la asignación');
    }
  };

  const handleDeleteGroup = async (group) => {
    try {
      await Promise.all(
        group.assignments.map(assignment => 
          realtimeService.deleteAssignment(assignment.id)
        )
      );
      toast.success(`${group.assignments.length} asignaciones eliminadas exitosamente`);
      setDeleteDialog({ open: false, type: null, data: null });
    } catch (error) {
      //  message removed for production
      toast.error('Error al eliminar las asignaciones');
    }
  };

  const openDeleteDialog = (type, data) => {
    setDeleteDialog({ open: true, type, data });
  };

  const handleMenuClick = (event, group) => {
    setMenuAnchor(event.currentTarget);
    setSelectedGroup(group);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedGroup(null);
  };

  // Funciones para filtros
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      manga: '',
      user: '',
      status: 'pendiente', // Mantener pendiente como defecto
      search: '',
      week: ''
    });
  };

  // Funciones para manejar semanas de asignación
  const getWeekRange = (date) => {
    // Encontrar el sábado de la semana de asignación
    const assignmentDate = new Date(date);
    const dayOfWeek = assignmentDate.getDay(); // 0 = domingo, 6 = sábado
    
    // Si es domingo a viernes, retroceder al sábado anterior
    // Si es sábado, usar ese sábado
    const daysToSubtract = dayOfWeek === 6 ? 0 : (dayOfWeek + 1); // +1 porque domingo es 0
    const saturday = new Date(assignmentDate);
    saturday.setDate(assignmentDate.getDate() - daysToSubtract);
    saturday.setHours(0, 0, 0, 0);
    
    // El domingo de entrega es 8 días después del sábado de asignación
    const deliverySunday = new Date(saturday);
    deliverySunday.setDate(saturday.getDate() + 8);
    deliverySunday.setHours(23, 59, 59, 999);
    
    return { start: saturday, end: deliverySunday };
  };

  const getWeekKey = (date) => {
    const { start } = getWeekRange(date);
    // Formato: YYYY-MM-DD del sábado de asignación
    return start.toISOString().split('T')[0];
  };

  const formatWeekLabel = (weekKey) => {
    const saturday = new Date(weekKey + 'T00:00:00');
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 8);
    
    const options = { day: '2-digit', month: '2-digit' };
    const saturdayStr = saturday.toLocaleDateString('es-ES', options);
    const sundayStr = sunday.toLocaleDateString('es-ES', options);
    
    return `${saturdayStr} - ${sundayStr}`;
  };

  const getCurrentWeek = () => {
    return getWeekKey(new Date());
  };

  const getAvailableWeeks = () => {
    const weeks = new Set();
    
    assignments.forEach(assignment => {
      if (assignment.createdAt) {
        const weekKey = getWeekKey(new Date(assignment.createdAt));
        weeks.add(weekKey);
      }
    });
    
    // Añadir semana actual si no existe
    weeks.add(getCurrentWeek());
    
    // Convertir a array y ordenar por fecha
    return Array.from(weeks).sort().reverse(); // Más reciente primero
  };

  // Función para filtrar asignaciones
  const getFilteredGroups = ({ ignoreStatus = false } = {}) => {
    const groups = groupedAssignments();
    
    return groups.filter(group => {
      // Filtro por manga
      if (filters.manga && group.mangaId !== filters.manga) return false;
      
      // Filtro por usuario
      if (filters.user && group.assignedTo !== filters.user) return false;
      
      // Filtro por estado
      if (filters.status && !ignoreStatus) {
        const groupStatus = getGroupStatus(group.assignments);
        if (groupStatus !== filters.status) return false;
      }
      
      // Filtro por semana de asignación
      if (filters.week) {
        // Verificar si alguna asignación del grupo pertenece a la semana seleccionada
        const groupBelongsToWeek = group.assignments.some(assignment => {
          if (assignment.createdAt) {
            const assignmentWeekKey = getWeekKey(new Date(assignment.createdAt));
            return assignmentWeekKey === filters.week;
          }
          return false;
        });
        
        if (!groupBelongsToWeek) return false;
      }
      
      // Filtro por búsqueda de texto
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchIn = [
          group.mangaTitle,
          group.assignedToName,
          group.chapter.toString(),
          ...group.assignments.map(a => TASK_TYPES[a.type] || a.type)
        ].join(' ').toLowerCase();
        
        if (!searchIn.includes(searchLower)) return false;
      }
      
      return true;
    });
  };

  const closeChapterCompletedDialog = () => {
    setChapterCompletedDialog({ open: false, mangaTitle: '', chapter: '', reason: '', chapterData: null });
    // Limpiar el campo capítulo para que se pueda intentar con otro
    setNewAssignmentForm(prev => ({ ...prev, chapter: '' }));
  };

  // Función para abrir modal de detalles
  const handleOpenDetails = (group) => {
    setDetailsDialog({ open: true, group });
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, group: null });
  };

  // Funciones para el nuevo diálogo estilo SeriesManagement
  const handleOpenAssignmentDialog = () => {
    setNewAssignmentForm({
      mangaId: '',
      mangaTitle: '',
      chapter: '',
      tasks: [], // Sin preselección inicial, se ajustará al seleccionar manga
      assignedTo: '',
      dueDate: '',
      notes: '',
      driveLink: ''
    });
    setAssignmentDialog({ open: true, assignment: null, manga: null });
  };

  const handleCloseAssignmentDialog = () => {
    setAssignmentDialog({ open: false, assignment: null, manga: null });
  };

  const handleSaveNewAssignment = async () => {
    try {
      // Validaciones básicas
      if (!newAssignmentForm.mangaId || !newAssignmentForm.chapter) {
        toast.error('Por favor completa el manga y el capítulo');
        return;
      }

      // Validar que se haya seleccionado al menos una tarea
      if (!newAssignmentForm.tasks || newAssignmentForm.tasks.length === 0) {
        toast.error('Por favor selecciona al menos una tarea');
        return;
      }

      // Validar que las tareas seleccionadas sean permitidas para el manga joint
      const availableTasks = getAvailableTasksForManga(newAssignmentForm.mangaId);
      const invalidTasks = newAssignmentForm.tasks.filter(task => !availableTasks.includes(task));
      if (invalidTasks.length > 0) {
        const invalidTaskNames = invalidTasks.map(task => TASK_TYPES[task]).join(', ');
        toast.error(`Las siguientes tareas no están disponibles para este manga: ${invalidTaskNames}`);
        return;
      }

      // Validar que el capítulo no esté ya completado/publicado
      const chapterStatus = await checkIfChapterCompleted(newAssignmentForm.mangaId, newAssignmentForm.chapter);
      if (chapterStatus.isCompleted) {
        toast.error(
          `❌ No se puede crear esta asignación: ${chapterStatus.reason}`,
          {
            duration: 5000,
            style: {
              maxWidth: '500px',
            }
          }
        );
        return;
      }

      // En la página /assignments, el usuario es obligatorio
      if (!newAssignmentForm.assignedTo) {
        toast.error('Por favor asigna un usuario para la tarea');
        return;
      }

      // Validar que el enlace RAW sea obligatorio para tareas de traducción
      if (newAssignmentForm.tasks.includes('traduccion') && (!newAssignmentForm.rawLink || newAssignmentForm.rawLink.trim() === '')) {
        toast.error('Por favor ingresa el enlace RAW para la traducción');
        return;
      }

      const manga = mangas.find(m => m.id === newAssignmentForm.mangaId);
      const assignedUser = newAssignmentForm.assignedTo 
        ? users.find(u => (u.uid || u.id) === newAssignmentForm.assignedTo)
        : null;

      // Crear una asignación por cada tarea seleccionada
      const createdAssignments = [];
      
      for (const task of newAssignmentForm.tasks) {
        const assignmentData = {
          mangaId: newAssignmentForm.mangaId,
          mangaTitle: manga?.title || 'Manga desconocido',
          chapter: newAssignmentForm.chapter,
          type: task, // Tipo específico para esta asignación
          tasks: [task], // Array con una sola tarea para compatibilidad
          assignedTo: newAssignmentForm.assignedTo || null,
          assignedToName: assignedUser?.name || null,
          dueDate: newAssignmentForm.dueDate ? dateInputToISOString(newAssignmentForm.dueDate) : null,
          notes: newAssignmentForm.notes,
          driveLink: newAssignmentForm.driveLink,
          rawLink: task === 'traduccion' ? newAssignmentForm.rawLink : '', // Solo agregar rawLink para traducciones
          status: newAssignmentForm.assignedTo ? 'pendiente' : 'sin_asignar',
          progress: 0,
          priority: 'normal',
          createdBy: userProfile.uid,
          createdAt: new Date().toISOString()
        };

        const result = await realtimeService.createAssignment(assignmentData);
        createdAssignments.push(result);
      }

      const taskCount = newAssignmentForm.tasks.length;
      const taskNames = newAssignmentForm.tasks.map(task => TASK_TYPES[task]).join(', ');
      
      toast.success(`${taskCount} asignación${taskCount > 1 ? 'es' : ''} creada${taskCount > 1 ? 's' : ''} exitosamente (${taskNames})`);
      handleCloseAssignmentDialog();
    } catch (error) {
      //  message removed for production
      toast.error('Error al crear la asignación');
    }
  };

  // Filtrar usuarios que pueden ser asignados (similar a SeriesManagement)
  const getAssignableUsers = () => {
    return getUniqueUsers(users).filter(user => {
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
  };

  const groupKey = (g) => `${g.mangaId}-${g.chapter}-${g.assignedTo}`;
  const FINAL_STATES = ['completado', 'aprobado', 'uploaded'];
  const isGroupOverdue = (g) =>
    g.dueDate && new Date(g.dueDate) < new Date() && getGroupStatus(g.assignments) !== 'completado';

  // Los recuentos del control de estado salen de los grupos que pasan el resto de filtros.
  const baseGroups = getFilteredGroups({ ignoreStatus: true });
  const statusCounts = baseGroups.reduce(
    (acc, g) => {
      acc[getGroupStatus(g.assignments)] += 1;
      return acc;
    },
    { pendiente: 0, en_progreso: 0, completado: 0 }
  );
  const visibleGroups = (filters.status
    ? baseGroups.filter((g) => getGroupStatus(g.assignments) === filters.status)
    : baseGroups
  )
    .slice()
    .sort((a, b) => {
      // Primero lo retrasado, después por fecha límite; sin fecha al final.
      const ao = isGroupOverdue(a) ? 0 : 1;
      const bo = isGroupOverdue(b) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  const STATUS_FILTERS = [
    { value: 'pendiente', label: 'Pendientes', count: statusCounts.pendiente },
    { value: 'en_progreso', label: 'En progreso', count: statusCounts.en_progreso },
    { value: 'completado', label: 'Completadas', count: statusCounts.completado },
    { value: '', label: 'Todas', count: baseGroups.length },
  ];

  const hasExtraFilters = Boolean(filters.manga || filters.user || filters.search || filters.week);

  // Ficha abierta: se recalcula con los datos en vivo para que refleje cambios al momento.
  const detailsGroup = detailsDialog.group
    ? groupedAssignments().find((g) => groupKey(g) === groupKey(detailsDialog.group)) || detailsDialog.group
    : null;

  const shortDate = (iso) =>
    new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  const markGroupCompleted = async (group) => {
    const pendingAssignments = group.assignments.filter((a) => a.status !== 'completado');
    for (const assignment of pendingAssignments) {
      await handleMarkAsCompleted(assignment.id);
    }
    notify.success(
      `${pendingAssignments.length} ${pendingAssignments.length === 1 ? 'tarea marcada' : 'tareas marcadas'} como completada${pendingAssignments.length === 1 ? '' : 's'}`
    );
  };

  const renderPerson = (group, dense = false) => {
    const name = getUserName(group.assignedTo, group.assignedToName);
    const avatar = getUserAvatar(group.assignedTo);
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Avatar src={avatar || undefined} alt="" sx={{ width: dense ? 22 : 28, height: dense ? 22 : 28, fontSize: '0.6875rem', fontWeight: 700 }}>
          {!avatar && name.substring(0, 2).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: '0.8125rem', color: colors.onSurface, lineHeight: 1.35 }}>
            {name}
          </Typography>
          {!dense && getUserRole(group.assignedTo) && (
            <Typography noWrap sx={{ fontSize: '0.6875rem', color: colors.onSurfaceVariant, lineHeight: 1.35 }}>
              {getUserRole(group.assignedTo)}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // Una insignia corta por tarea (T, P, C, Ty). Las terminadas llevan su tono de fondo lleno.
  const renderTaskChips = (group) => (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {group.assignments.map((a) => {
        const cfg = ASSIGNMENT_TYPES[a.type];
        const color = cfg?.color ?? colors.outline;
        const done = FINAL_STATES.includes(a.status);
        return (
          <Tooltip key={a.id} title={`${cfg?.label ?? a.type} · ${STATUS_CONFIG[a.status]?.label ?? a.status}`}>
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 26,
                height: 22,
                px: 0.5,
                borderRadius: `${radius.DEFAULT}px`,
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: done ? colors.surface : color,
                backgroundColor: done ? color : withAlpha(color, 0.12),
              }}
            >
              {cfg?.short ?? '?'}
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );

  const renderDue = (group) => {
    if (!group.dueDate) return <Typography sx={{ fontSize: '0.8125rem', color: colors.outline }}>Sin fecha</Typography>;
    const overdue = isGroupOverdue(group);
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.8125rem', color: colors.onSurfaceVariant }}>
        {overdue && <ScheduleRounded aria-hidden="true" sx={{ fontSize: 15, color: colors.error }} />}
        <span>{shortDate(group.dueDate)}</span>
        {overdue && (
          <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            (retrasado)
          </Box>
        )}
      </Box>
    );
  };

  const GRID_COLUMNS = 'minmax(0, 2.4fr) minmax(0, 1.5fr) minmax(0, 1.2fr) 120px 96px 72px';

  return (
    <Box>
      <PageHeader
        title="Asignaciones"
        subtitle={
          assignmentsLoading
            ? 'Sincronizando datos…'
            : `${baseGroups.length} ${baseGroups.length === 1 ? 'capítulo' : 'capítulos'} · ${assignments.length} ${assignments.length === 1 ? 'tarea' : 'tareas'}`
        }
        actions={
          <>
            <Tooltip title={syncLoading || assignmentsLoading ? 'Sincronizando…' : 'Sincronizar con capítulos publicados'}>
              <span>
                <PressIconButton
                  onClick={handleSyncAssignments}
                  disabled={syncLoading || assignmentsLoading}
                  aria-label="Sincronizar con capítulos publicados"
                  sx={{ width: 40, height: 40, backgroundColor: colors.surfaceContainer }}
                >
                  <Sync sx={{ fontSize: 20 }} className={syncLoading ? 'rotating' : undefined} />
                </PressIconButton>
              </span>
            </Tooltip>
            <Tooltip title={assignmentsLoading ? 'Actualizando…' : 'Volver a cargar asignaciones'}>
              <span>
                <PressIconButton
                  onClick={() => {
                    forceRefresh();
                    notify.info('Actualizando asignaciones…');
                  }}
                  disabled={assignmentsLoading}
                  aria-label="Volver a cargar asignaciones"
                  sx={{ width: 40, height: 40, backgroundColor: colors.surfaceContainer }}
                >
                  <Refresh sx={{ fontSize: 20 }} />
                </PressIconButton>
              </span>
            </Tooltip>
            {canAssignChapters && (
              <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenAssignmentDialog()}>
                Nueva asignación
              </Button>
            )}
          </>
        }
      />

      {/* Filtros */}
      <Panel sx={{ mb: 2, p: { xs: 1.5, sm: 1.5 } }} aria-label="Filtros">
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'minmax(0, 1.6fr) repeat(3, minmax(0, 1fr)) auto' },
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar serie, capítulo o persona"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            inputProps={{ 'aria-label': 'Buscar' }}
            InputProps={{ startAdornment: <Search sx={{ color: colors.outline, mr: 1, fontSize: 20 }} /> }}
          />
          <TextField
            select
            size="small"
            value={filters.week}
            onChange={(e) => handleFilterChange('week', e.target.value)}
            SelectProps={{ displayEmpty: true }}
            inputProps={{ 'aria-label': 'Semana de asignación' }}
          >
            <MenuItem value="">Todas las semanas</MenuItem>
            <MenuItem value={getCurrentWeek()}>Semana actual</MenuItem>
            {getAvailableWeeks()
              .filter((weekKey) => weekKey !== getCurrentWeek())
              .map((weekKey) => (
                <MenuItem key={weekKey} value={weekKey}>
                  {formatWeekLabel(weekKey)}
                </MenuItem>
              ))}
          </TextField>
          <TextField
            select
            size="small"
            value={filters.manga}
            onChange={(e) => handleFilterChange('manga', e.target.value)}
            SelectProps={{ displayEmpty: true }}
            inputProps={{ 'aria-label': 'Serie' }}
          >
            <MenuItem value="">Todas las series</MenuItem>
            {mangas.map((manga) => (
              <MenuItem key={manga.id} value={manga.id}>
                {manga.title}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            size="small"
            options={[{ uid: '', name: 'Todas las personas' }, ...getUniqueUsers(users)]}
            value={
              getUniqueUsers(users).find((user) => (user.uid || user.id) === filters.user) || { uid: '', name: 'Todas las personas' }
            }
            onChange={(event, newValue) => handleFilterChange('user', newValue ? newValue.uid || newValue.id || '' : '')}
            getOptionLabel={(option) => (option ? option.name || 'Usuario desconocido' : '')}
            isOptionEqualToValue={(option, value) => (option.uid || option.id || '') === (value.uid || value.id || '')}
            renderInput={(params) => <TextField {...params} inputProps={{ ...params.inputProps, 'aria-label': 'Persona' }} />}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.uid || option.id || 'todas'} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Avatar
                  src={option.profileImage || option.photoURL || option.avatar || undefined}
                  alt=""
                  sx={{ width: 26, height: 26, fontSize: '0.6875rem', fontWeight: 700 }}
                >
                  {!(option.profileImage || option.photoURL || option.avatar) && option.uid && option.name?.substring(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.875rem' }}>{option.name || 'Usuario desconocido'}</Typography>
                  {option.role && (
                    <Typography sx={{ fontSize: '0.6875rem', color: colors.onSurfaceVariant }}>{ROLE_LABELS[option.role] || option.role}</Typography>
                  )}
                </Box>
              </Box>
            )}
          />
          {hasExtraFilters ? (
            <Button size="small" startIcon={<Clear />} onClick={clearAllFilters} sx={{ color: colors.onSurfaceVariant, justifySelf: 'start' }}>
              Limpiar
            </Button>
          ) : (
            <Box sx={{ display: { xs: 'none', lg: 'block' }, width: 84 }} />
          )}
        </Box>
      </Panel>

      {/* Lista */}
      <Panel
        title="Capítulos"
        count={visibleGroups.length}
        action={
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filters.status}
            onChange={(e, value) => {
              if (value !== null) {
                triggerHaptic('light');
                handleFilterChange('status', value);
              }
            }}
            aria-label="Estado"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            {STATUS_FILTERS.map((f) => (
              <ToggleButton key={f.value || 'todas'} value={f.value} sx={{ px: 1.25, fontSize: '0.8125rem' }}>
                {f.label}
                <Box component="span" sx={{ ml: 0.75, color: colors.outline, fontVariantNumeric: 'tabular-nums' }}>
                  {f.count}
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        }
      >
        {/* En móvil el control de estado va en su propia fila, con scroll horizontal */}
        <Box sx={{ display: { xs: 'block', sm: 'none' }, overflowX: 'auto', mb: 1.5, mx: -0.5, px: 0.5 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filters.status}
            onChange={(e, value) => value !== null && handleFilterChange('status', value)}
            aria-label="Estado"
          >
            {STATUS_FILTERS.map((f) => (
              <ToggleButton key={f.value || 'todas'} value={f.value} sx={{ px: 1.25, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                {f.label}
                <Box component="span" sx={{ ml: 0.75, color: colors.outline, fontVariantNumeric: 'tabular-nums' }}>
                  {f.count}
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {visibleGroups.length > 0 ? (
          <Box role="table" aria-label="Capítulos asignados" sx={{ mx: { xs: -1, sm: -1 } }}>
            {/* Cabecera (solo escritorio) */}
            <Box
              role="row"
              sx={{
                display: { xs: 'none', md: 'grid' },
                gridTemplateColumns: GRID_COLUMNS,
                gap: 2,
                px: 1,
                pb: 1,
                borderBottom: `1px solid ${rowDivider}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: colors.onSurfaceVariant,
              }}
            >
              <span role="columnheader">Capítulo</span>
              <span role="columnheader">Persona</span>
              <span role="columnheader">Tareas</span>
              <span role="columnheader">Progreso</span>
              <span role="columnheader">Fecha límite</span>
              <span role="columnheader" style={{ textAlign: 'right' }}>
                <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                  Acciones
                </Box>
              </span>
            </Box>

            {visibleGroups.map((group) => {
              const progress = getOverallProgress(group.assignments);
              const overdue = isGroupOverdue(group);
              const status = overdue ? 'retrasado' : getGroupStatus(group.assignments);
              return (
                <Box
                  key={groupKey(group)}
                  role="row"
                  sx={{
                    position: 'relative',
                    borderBottom: `1px solid ${rowDivider}`,
                    '&:last-of-type': { borderBottom: 'none' },
                  }}
                >
                  <ButtonBase
                    onClick={() => {
                      triggerHaptic('light');
                      handleOpenDetails(group);
                    }}
                    aria-label={`Ver ${group.mangaTitle}, capítulo ${group.chapter}`}
                    sx={{
                      width: '100%',
                      display: { xs: 'flex', md: 'grid' },
                      flexDirection: 'column',
                      alignItems: { xs: 'stretch', md: 'center' },
                      gridTemplateColumns: GRID_COLUMNS,
                      gap: { xs: 0.75, md: 2 },
                      px: 1,
                      py: { xs: 1.5, md: 1.25 },
                      pr: { xs: 6, md: 1 },
                      borderRadius: `${radius.md}px`,
                      textAlign: 'left',
                      transition: 'background-color 150ms ease-out',
                      '&:hover': { backgroundColor: colors.surfaceContainer },
                      '&.Mui-focusVisible': { ...focusOutline, outlineOffset: -2 },
                    }}
                  >
                    {/* Capítulo */}
                    <Box role="cell" sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, minWidth: 0 }}>
                          <Typography noWrap component="span" sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.onSurface, minWidth: 0 }}>
                            {group.mangaTitle}
                          </Typography>
                          <Box component="span" sx={{ flexShrink: 0, fontSize: '0.875rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                            Cap. {group.chapter}
                          </Box>
                        </Box>
                        <Box sx={{ mt: 0.5 }}>
                          <StatusBadge status={status} />
                        </Box>
                      </Box>
                    </Box>
                    {/* Persona */}
                    <Box role="cell" sx={{ minWidth: 0 }}>
                      {renderPerson(group)}
                    </Box>
                    {/* Tareas */}
                    <Box role="cell">
                      {renderTaskChips(group)}
                    </Box>
                    {/* Progreso */}
                    <Box role="cell" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <MeterBar value={progress} max={100} color={progress === 100 ? colors.goodNews : colors.primary} />
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>
                        {progress}%
                      </Typography>
                    </Box>
                    {/* Fecha */}
                    <Box role="cell">
                      {renderDue(group)}
                    </Box>
                    <Box role="cell" sx={{ display: { xs: 'none', md: 'block' } }} />
                  </ButtonBase>

                  {/* Acciones (fuera del botón de fila para no anidar botones) */}
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 4,
                      top: { xs: 10, md: '50%' },
                      transform: { md: 'translateY(-50%)' },
                      display: 'flex',
                      gap: 0.25,
                    }}
                  >
                    {group.driveLink && (
                      <Tooltip title="Abrir carpeta de Drive">
                        <IconButton
                          size="small"
                          component="a"
                          href={group.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Abrir carpeta de Drive"
                          sx={{ display: { xs: 'none', md: 'inline-flex' } }}
                        >
                          <LinkIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Más opciones">
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, group)} aria-label="Más opciones">
                        <MoreVert sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <EmptyState icon={Assignment} title={hasExtraFilters || filters.status ? 'Nada con estos filtros' : 'Todavía no hay asignaciones'}>
            {hasExtraFilters || filters.status
              ? 'Prueba con otro estado o limpia los filtros para ver todos los capítulos.'
              : 'Crea una con «Nueva asignación»: elige la serie, el capítulo, las tareas y a quién se las das.'}
          </EmptyState>
        )}
      </Panel>

      {/* Dialog para crear/editar asignación */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAssignment ? 'Editar Asignación' : 'Nueva Asignación'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Manga"
                value={formData.mangaId}
                onChange={(e) => setFormData({ ...formData, mangaId: e.target.value })}
              >
                {mangas.map((manga) => (
                  <MenuItem key={manga.id} value={manga.id}>
                    {manga.title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Capítulo"
                type="number"
                value={formData.chapter}
                onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Prioridad"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="media">Media</MenuItem>
                <MenuItem value="alta">Alta</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tareas</InputLabel>
                <Select
                  multiple
                  value={formData.tasks}
                  onChange={(e) => setFormData({ ...formData, tasks: e.target.value })}
                  input={<OutlinedInput label="Tareas" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={TASK_TYPES[value]} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {(() => {
                    const availableTasks = getAvailableTasksForManga(formData.mangaId);
                    return Object.entries(TASK_TYPES)
                      .filter(([key]) => availableTasks.includes(key))
                      .map(([key, value]) => (
                        <MenuItem key={key} value={key}>
                          <Checkbox checked={formData.tasks.indexOf(key) > -1} />
                          {value}
                        </MenuItem>
                      ));
                  })()}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Asignar a"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                {filteredUsers.map((user) => (
                  <MenuItem key={user.uid || user.id} value={user.uid || user.id}>
                    {user.name} - {user.role}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Link de Drive del capítulo"
                value={formData.driveLink}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                InputProps={{
                  startAdornment: <LinkIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                placeholder="https://drive.google.com/..."
                helperText="Enlace al capítulo en Google Drive"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fecha límite"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                helperText="Fecha límite para completar la asignación"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAssignment ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu de opciones */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {selectedGroup && selectedGroup.assignments.length > 1 && (
          <MenuItem 
            onClick={() => {
              openDeleteDialog('group', selectedGroup);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteSweep sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText primary="Eliminar todas las asignaciones" />
          </MenuItem>
        )}
        
        {selectedGroup && selectedGroup.assignments.map((assignment, idx) => (
          <MenuItem 
            key={assignment.id}
            onClick={() => {
              openDeleteDialog('single', assignment);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText 
              primary={`Eliminar: ${TASK_TYPES[assignment.type] || assignment.type}`} 
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, type: null, data: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <Warning />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          {deleteDialog.type === 'group' && deleteDialog.data && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body1">
                ¿Estás seguro de que deseas eliminar <strong>todas las {deleteDialog.data.assignments.length} asignaciones</strong> para:
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • <strong>{deleteDialog.data.mangaTitle}</strong> - Capítulo {deleteDialog.data.chapter}
              </Typography>
              <Typography variant="body2">
                • Usuario: <strong>{getUserName(deleteDialog.data.assignedTo, deleteDialog.data.assignedToName)}</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: 'error.main' }}>
                Esta acción no se puede deshacer.
              </Typography>
            </Alert>
          )}
          
          {deleteDialog.type === 'single' && deleteDialog.data && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body1">
                ¿Estás seguro de que deseas eliminar esta asignación?
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • <strong>Tarea:</strong> {TASK_TYPES[deleteDialog.data.type] || deleteDialog.data.type}
              </Typography>
              <Typography variant="body2">
                • <strong>Manga:</strong> {deleteDialog.data.mangaTitle} - Capítulo {deleteDialog.data.chapter}
              </Typography>
              <Typography variant="body2">
                • <strong>Usuario:</strong> {deleteDialog.data.assignedToName}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: 'error.main' }}>
                Esta acción no se puede deshacer.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, type: null, data: null })}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (deleteDialog.type === 'group') {
                handleDeleteGroup(deleteDialog.data);
              } else if (deleteDialog.type === 'single') {
                handleDeleteSingle(deleteDialog.data.id);
              }
            }}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            {deleteDialog.type === 'group' ? 'Eliminar Todo' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ficha del capítulo: panel lateral derecho (DESIGN.md), datos en vivo */}
      <Drawer
        anchor="right"
        open={detailsDialog.open}
        onClose={handleCloseDetails}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 600 },
            backgroundColor: colors.surfaceLow,
            boxShadow: '-12px 0 32px rgba(0, 0, 0, 0.35)',
          },
        }}
      >
        {detailsGroup && (() => {
          const progress = getOverallProgress(detailsGroup.assignments);
          const overdue = isGroupOverdue(detailsGroup);
          const groupStatus = overdue ? 'retrasado' : getGroupStatus(detailsGroup.assignments);
          const canCompleteAll = canMarkAsCompleted() && detailsGroup.assignments.some((a) => a.status !== 'completado');
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Cabecera */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: { xs: 2, sm: 3 }, pb: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography component="h2" variant="h5" sx={{ textWrap: 'balance' }}>
                    {detailsGroup.mangaTitle}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                      Capítulo {detailsGroup.chapter}
                    </Typography>
                    <StatusBadge status={groupStatus} />
                  </Box>
                </Box>
                <PressIconButton onClick={handleCloseDetails} aria-label="Cerrar" autoFocus sx={{ width: 40, height: 40 }}>
                  <Close sx={{ fontSize: 20 }} />
                </PressIconButton>
              </Box>

              <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3 }, pb: 3 }}>
                {/* Resumen */}
                <Box
                  component="dl"
                  sx={{
                    m: 0,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                    p: 2,
                    borderRadius: `${radius.lg}px`,
                    backgroundColor: colors.surfaceContainer,
                  }}
                >
                  <Box>
                    <Typography component="dt" sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, mb: 0.5 }}>
                      Asignado a
                    </Typography>
                    <Box component="dd" sx={{ m: 0 }}>
                      {renderPerson(detailsGroup)}
                    </Box>
                  </Box>
                  <Box>
                    <Typography component="dt" sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, mb: 0.5 }}>
                      Fecha límite
                    </Typography>
                    <Box component="dd" sx={{ m: 0 }}>
                      {detailsGroup.dueDate ? (
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', color: colors.onSurface }}>
                          {overdue && <ScheduleRounded aria-hidden="true" sx={{ fontSize: 16, color: colors.error }} />}
                          {new Date(detailsGroup.dueDate).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}
                          {overdue && <Box component="span" sx={{ color: colors.onSurfaceVariant }}>· retrasado</Box>}
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: '0.875rem', color: colors.outline }}>Sin fecha</Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                    <Typography component="dt" sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, mb: 0.75 }}>
                      Progreso del capítulo
                    </Typography>
                    <Box component="dd" sx={{ m: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <MeterBar value={progress} max={100} color={progress === 100 ? colors.goodNews : colors.primary} />
                      </Box>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{progress}%</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Acciones */}
                {(canCompleteAll || detailsGroup.driveLink) && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    {canCompleteAll && (
                      <Button variant="contained" startIcon={<CheckCircle />} onClick={() => markGroupCompleted(detailsGroup)}>
                        Marcar todo como completado
                      </Button>
                    )}
                    {detailsGroup.driveLink && (
                      <Button
                        variant="outlined"
                        startIcon={<LinkIcon />}
                        component="a"
                        href={detailsGroup.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir en Drive
                      </Button>
                    )}
                  </Box>
                )}

                {/* Tareas */}
                <Typography component="h3" variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                  Tareas
                  <Box component="span" sx={{ ml: 0.75, color: colors.outline, fontWeight: 500 }}>
                    {detailsGroup.assignments.length}
                  </Box>
                </Typography>
                <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {detailsGroup.assignments.map((assignment) => (
                    <Box
                      component="li"
                      key={assignment.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 1.5,
                        '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', fontSize: '0.875rem' }}>
                          <TaskTypeTag type={assignment.type} sx={{ color: colors.onSurface, fontWeight: 500 }} />
                          <StatusBadge status={assignment.status} />
                          {wasCompletedLate(assignment) && (
                            <Typography component="span" sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
                              con atraso
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
                          <Box sx={{ flex: 1, maxWidth: 240 }}>
                            <MeterBar value={assignment.progress || 0} max={100} color={colors.primary} />
                          </Box>
                          <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                            {assignment.progress || 0}%
                          </Typography>
                          {assignment.createdAt && (
                            <Typography sx={{ fontSize: '0.75rem', color: colors.outline }}>
                              · creada el {new Date(assignment.createdAt).toLocaleDateString('es-ES')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      {canManageAssignment(assignment) && (
                        <Tooltip title="Editar tarea">
                          <IconButton onClick={() => handleOpenDialog(assignment)} aria-label={`Editar ${TASK_TYPES[assignment.type] || assignment.type}`}>
                            <Edit sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          );
        })()}
      </Drawer>

      {/* Nuevo diálogo estilo SeriesManagement */}
      <Dialog 
        open={assignmentDialog.open} 
        onClose={handleCloseAssignmentDialog} 
        maxWidth="md" 
        fullWidth
        scroll="body"
        PaperProps={{ sx: { margin: '32px auto', position: 'relative' } }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${divider}`, py: 2.5 }}>
          Nueva asignación
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, pt: 8, mt: 3 }}>
          <Grid container spacing={3}>
            {/* Selección de Manga */}
            <Grid item xs={12} md={8}>
              <TextField
                select
                fullWidth
                label="Manga"
                value={newAssignmentForm.mangaId}
                onChange={async (e) => {
                  const manga = mangas.find(m => m.id === e.target.value);
                  
                  // Obtener tareas disponibles para el manga seleccionado
                  const availableTasks = getAvailableTasksForManga(e.target.value);
                  
                  // Filtrar tareas actualmente seleccionadas que sean válidas para el nuevo manga
                  const validSelectedTasks = newAssignmentForm.tasks.filter(task => 
                    availableTasks.includes(task)
                  );
                  
                  // Si no hay tareas válidas seleccionadas, preseleccionar una tarea válida
                  let tasksToSet = validSelectedTasks;
                  if (validSelectedTasks.length === 0 && availableTasks.length > 0) {
                    // Preseleccionar 'traduccion' si está disponible, sino la primera disponible
                    tasksToSet = availableTasks.includes('traduccion') 
                      ? ['traduccion'] 
                      : [availableTasks[0]];
                  }
                  
                  setNewAssignmentForm({
                    ...newAssignmentForm,
                    mangaId: e.target.value,
                    mangaTitle: manga?.title || '',
                    tasks: tasksToSet // Actualizar tareas dinámicamente
                  });
                  
                  // Auto-cargar el link de Drive del capítulo si hay un capítulo seleccionado
                  if (newAssignmentForm.chapter && e.target.value) {
                    try {
                      const chapters = await realtimeService.getChapters(e.target.value);
                      const chapter = chapters.find(c => c.number == newAssignmentForm.chapter);
                      // Siempre actualizar el driveLink, sea el del capítulo o vacío si no existe
                      setNewAssignmentForm(prev => ({
                        ...prev,
                        driveLink: (chapter && chapter.driveLink) ? chapter.driveLink : ''
                      }));
                    } catch (error) {
                      //  message removed for production
                      // En caso de error, limpiar el driveLink
                      setNewAssignmentForm(prev => ({
                        ...prev,
                        driveLink: ''
                      }));
                    }
                  } else if (newAssignmentForm.chapter && !e.target.value) {
                    // Si hay capítulo pero no manga, limpiar el driveLink
                    setNewAssignmentForm(prev => ({
                      ...prev,
                      driveLink: ''
                    }));
                  }
                }}
                InputProps={{
                  startAdornment: <Book sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                required
              >
                {mangas.map((manga) => (
                  <MenuItem key={manga.id} value={manga.id}>
                    {manga.title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            {/* Capítulo */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Capítulo"
                type="number"
                value={newAssignmentForm.chapter}
                onChange={async (e) => {
                  const chapterNumber = e.target.value;
                  setNewAssignmentForm({
                    ...newAssignmentForm,
                    chapter: chapterNumber
                  });
                  
                  // Validar si el capítulo ya está completado
                  if (chapterNumber && newAssignmentForm.mangaId) {
                    const chapterStatus = await checkIfChapterCompleted(newAssignmentForm.mangaId, chapterNumber);
                    if (chapterStatus.isCompleted) {
                      // Mostrar diálogo de error personalizado
                      const manga = mangas.find(m => m.id === newAssignmentForm.mangaId);
                      setChapterCompletedDialog({
                        open: true,
                        mangaTitle: manga?.title || 'Manga desconocido',
                        chapter: chapterNumber,
                        reason: chapterStatus.reason,
                        chapterData: chapterStatus.chapterData
                      });
                      return;
                    }
                  }
                  
                  // Auto-cargar el link de Drive del capítulo si existe
                  if (chapterNumber && newAssignmentForm.mangaId) {
                    try {
                      const chapters = await realtimeService.getChapters(newAssignmentForm.mangaId);
                      const chapter = chapters.find(c => c.number == chapterNumber);
                      // Siempre actualizar el driveLink, sea el del capítulo o vacío si no existe
                      setNewAssignmentForm(prev => ({
                        ...prev,
                        driveLink: (chapter && chapter.driveLink) ? chapter.driveLink : ''
                      }));
                    } catch (error) {
                      //  message removed for production
                      // En caso de error, limpiar el driveLink
                      setNewAssignmentForm(prev => ({
                        ...prev,
                        driveLink: ''
                      }));
                    }
                  } else if (chapterNumber && !newAssignmentForm.mangaId) {
                    // Si hay capítulo pero no manga, limpiar el driveLink
                    setNewAssignmentForm(prev => ({
                      ...prev,
                      driveLink: ''
                    }));
                  }
                }}
                required
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            
            {/* Tareas múltiples */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tareas</InputLabel>
                <Select
                  multiple
                  value={newAssignmentForm.tasks}
                  onChange={(e) => setNewAssignmentForm({
                    ...newAssignmentForm,
                    tasks: e.target.value
                  })}
                  input={<OutlinedInput label="Tareas" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={TASK_TYPES[value]} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {(() => {
                    const availableTasks = getAvailableTasksForManga(newAssignmentForm.mangaId);
                    return Object.entries(TASK_TYPES)
                      .filter(([key]) => availableTasks.includes(key))
                      .map(([key, value]) => (
                        <MenuItem key={key} value={key}>
                          <Checkbox checked={newAssignmentForm.tasks.indexOf(key) > -1} />
                          {value}
                        </MenuItem>
                      ));
                  })()}
                </Select>
              </FormControl>
              {(() => {
                const selectedManga = mangas.find(m => m.id === newAssignmentForm.mangaId);
                if (selectedManga?.isJoint && selectedManga?.availableTasks) {
                  const availableTasksCount = getAvailableTasksForManga(newAssignmentForm.mangaId).length;
                  const totalTasks = Object.keys(TASK_TYPES).length;
                  if (availableTasksCount < totalTasks) {
                    return (
                      <Alert severity="info" sx={{ mt: 1, fontSize: '0.875rem' }}>
                        <Typography variant="caption">
                          🤝 <strong>Proyecto Joint:</strong> Solo tareas específicas disponibles ({availableTasksCount}/{totalTasks})
                        </Typography>
                      </Alert>
                    );
                  }
                }
                return null;
              })()}
            </Grid>
            
            {/* Usuario asignado */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                options={getAssignableUsers()}
                getOptionLabel={(option) => option.name || ''}
                value={getAssignableUsers().find(user => (user.uid || user.id) === newAssignmentForm.assignedTo) || null}
                onChange={(event, newValue) => {
                  setNewAssignmentForm({
                    ...newAssignmentForm,
                    assignedTo: newValue ? (newValue.uid || newValue.id) : ''
                  });
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={option.profileImage || option.photoURL || option.avatar}
                      sx={{ width: 24, height: 24 }}
                    >
                      {!option.profileImage && !option.photoURL && !option.avatar && 
                       option.name?.substring(0, 1).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.role}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Asignar a Usuario"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ color: 'text.secondary', mr: 1 }} />
                          {params.InputProps.startAdornment}
                        </Box>
                      )
                    }}
                    placeholder="Seleccionar usuario (opcional)"
                  />
                )}
              />
            </Grid>
            
            {/* Fecha límite */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha Límite"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newAssignmentForm.dueDate}
                onChange={(e) => setNewAssignmentForm({
                  ...newAssignmentForm,
                  dueDate: e.target.value
                })}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              />
            </Grid>
            
            {/* Link de Drive */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Link de Google Drive"
                value={newAssignmentForm.driveLink}
                onChange={(e) => setNewAssignmentForm({
                  ...newAssignmentForm,
                  driveLink: e.target.value
                })}
                InputProps={{
                  startAdornment: <LinkIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                placeholder="https://drive.google.com/..."
              />
            </Grid>
            
            {/* Campo para link de la RAW - Solo aparece si incluye traducción */}
            {newAssignmentForm.tasks.includes('traduccion') && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Link de la RAW a traducir"
                  value={newAssignmentForm.rawLink || ''}
                  onChange={(e) => setNewAssignmentForm({
                    ...newAssignmentForm,
                    rawLink: e.target.value
                  })}
                  InputProps={{
                    startAdornment: <LinkIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                  placeholder="https://ejemplo.com/manga-raw..."
                  helperText="Enlace directo a la RAW para traducir (requerido para traducciones)"
                  required={newAssignmentForm.tasks.includes('traduccion')}
                />
              </Grid>
            )}
            
            {/* Notas */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas (opcional)"
                multiline
                rows={3}
                value={newAssignmentForm.notes}
                onChange={(e) => setNewAssignmentForm({
                  ...newAssignmentForm,
                  notes: e.target.value
                })}
                placeholder="Instrucciones especiales, comentarios..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: `1px solid ${divider}` }}>
          <Button onClick={handleCloseAssignmentDialog} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveNewAssignment}
            variant="contained"
            disabled={!newAssignmentForm.mangaId || !newAssignmentForm.chapter}
          >
            Crear asignación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Aviso: el capítulo ya está terminado (informativo, no destructivo: ámbar, no rojo) */}
      <Dialog
        open={chapterCompletedDialog.open}
        onClose={closeChapterCompletedDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pb: 1 }}>
          <Warning sx={{ color: colors.attention, fontSize: 24, mt: 0.25 }} aria-hidden="true" />
          <Box>
            Este capítulo ya está terminado
            <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant, fontWeight: 400, mt: 0.5 }}>
              {chapterCompletedDialog.reason}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box
            component="dl"
            sx={{
              m: 0,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              p: 2,
              borderRadius: `${radius.lg}px`,
              backgroundColor: colors.surfaceContainer,
            }}
          >
            <Box>
              <Typography component="dt" sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>Serie</Typography>
              <Typography component="dd" sx={{ m: 0, fontSize: '0.875rem', fontWeight: 500 }}>{chapterCompletedDialog.mangaTitle}</Typography>
            </Box>
            <Box>
              <Typography component="dt" sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>Capítulo</Typography>
              <Typography component="dd" sx={{ m: 0, fontSize: '0.875rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {chapterCompletedDialog.chapter}
              </Typography>
            </Box>
            {chapterCompletedDialog.chapterData?.fechaSubida && (
              <Box>
                <Typography component="dt" sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>Subido el</Typography>
                <Typography component="dd" sx={{ m: 0, fontSize: '0.875rem' }}>{chapterCompletedDialog.chapterData.fechaSubida}</Typography>
              </Box>
            )}
            {chapterCompletedDialog.chapterData?.status && (
              <Box>
                <Typography component="dt" sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>Estado</Typography>
                <Typography component="dd" sx={{ m: 0, fontSize: '0.875rem' }}>{chapterCompletedDialog.chapterData.status}</Typography>
              </Box>
            )}
          </Box>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant, mt: 2 }}>
            Elige un capítulo que todavía no se haya completado ni publicado.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          {chapterCompletedDialog.chapterData?.linkCapitulo && (
            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              component="a"
              href={chapterCompletedDialog.chapterData.linkCapitulo}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver capítulo publicado
            </Button>
          )}
          <Button onClick={closeChapterCompletedDialog} variant="contained">
            Elegir otro capítulo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assignments;
