import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
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
  FormControlLabel,
  Checkbox,
  FormGroup,
  Card,
  CardContent,
  Avatar,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Stack,
  Menu,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  CheckCircle,
  Schedule,
  Assignment,
  Link as LinkIcon,
  CalendarToday,
  Done,
  ExpandMore,
  Delete,
  DeleteSweep,
  MoreVert,
  Warning,
  Search,
  FilterList,
  Clear,
  Person,
  Book,
  Refresh,
  Sync
} from '@mui/icons-material';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import { getUniqueUsers } from '../utils/cleanDuplicateUsers';
import useAssignmentsSync from '../hooks/useAssignmentsSync';
import { formatLocalDate, isoStringToDateInput, dateInputToISOString } from '../utils/dateUtils';
import toast from 'react-hot-toast';

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
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography>Verificando permisos...</Typography>
      </Container>
    );
  }

  // Restricción de acceso - verificar permisos personalizados
  if (!userProfile || !canAssignChapters) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
            Acceso Restringido
          </Typography>
          <Typography variant="body1">
            No tienes permisos para gestionar asignaciones. Contacta a un administrador si necesitas acceso.
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Si crees que deberías tener acceso, contacta con un administrador.
        </Typography>
      </Container>
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
  const getStatusText = (assignment) => {
    let statusText = assignment.status.replace('_', ' ').toUpperCase();
    
    if (wasCompletedLate(assignment)) {
      statusText += ' (CON ATRASO)';
    }
    
    return statusText;
  };

  const getStatusColor = (assignment) => {
    // Si es un objeto assignment, usar su status, sino asumir que es un string status directo
    const status = typeof assignment === 'string' ? assignment : assignment.status;
    
    switch (status) {
      case 'completado':
      case 'aprobado':
      case 'uploaded':
        return 'success';
      case 'en_progreso':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (assignment) => {
    // Si es un objeto assignment, usar su status, sino asumir que es un string status directo
    const status = typeof assignment === 'string' ? assignment : assignment.status;
    
    switch (status) {
      case 'completado':
      case 'aprobado':
      case 'uploaded':
        return <CheckCircle color="success" />;
      case 'en_progreso':
        return <Schedule color="warning" />;
      default:
        return <Assignment color="action" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta':
        return 'error';
      case 'media':
        return 'warning';
      default:
        return 'info';
    }
  };

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
    return user?.role || '';
  };

  const getTaskColor = (task) => {
    switch (task) {
      case 'traduccion': return { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' };
      case 'proofreading': return { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' };
      case 'cleanRedrawer': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'type': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      default: return { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
    }
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
  const getFilteredGroups = () => {
    const groups = groupedAssignments();
    
    return groups.filter(group => {
      // Filtro por manga
      if (filters.manga && group.mangaId !== filters.manga) return false;
      
      // Filtro por usuario
      if (filters.user && group.assignedTo !== filters.user) return false;
      
      // Filtro por estado
      if (filters.status) {
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
        p: 3,
        borderRadius: 3,
        border: '1px solid rgba(99, 102, 241, 0.2)'
      }}>
        <Box>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 1
            }}
          >
            Asignaciones
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona todas las asignaciones de traducción y edición
          </Typography>
          {assignmentsLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Sync sx={{ color: 'primary.main', fontSize: '1rem' }} className="rotating" />
              <Typography variant="body2" color="primary.main">
                Sincronizando datos...
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Botón de sincronización */}
          <Tooltip title={(syncLoading || assignmentsLoading) ? "Sincronizando..." : "Sincronizar asignaciones con capítulos publicados"}>
            <span>
              <IconButton
                onClick={handleSyncAssignments}
                disabled={syncLoading || assignmentsLoading}
                sx={{
                  backgroundColor: syncLoading ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    transform: syncLoading ? 'none' : 'scale(1.05)'
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                    color: '#6b7280'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Sync 
                  sx={{ 
                    fontSize: '1.2rem',
                    animation: syncLoading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} 
                />
              </IconButton>
            </span>
          </Tooltip>
          
          {/* Botón de refresh */}
          <Tooltip title={assignmentsLoading ? "Actualizando..." : "Forzar actualización de asignaciones"}>
            <span>
              <IconButton
                onClick={() => {
                  forceRefresh();
                  toast.success('Actualizando asignaciones...');
                }}
                disabled={assignmentsLoading}
                sx={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  '&:hover': {
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    transform: 'scale(1.05)'
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                    color: '#6b7280'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Refresh sx={{ fontSize: '1.2rem' }} />
              </IconButton>
            </span>
          </Tooltip>
          
          
          {canAssignChapters && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenAssignmentDialog()}
              sx={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(99, 102, 241, 0.4)',
                }
              }}
            >
              Nueva Asignación
            </Button>
          )}
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ 
        mb: 4,
        background: 'rgba(15, 15, 25, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(148, 163, 184, 0.1)'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <FilterList sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filtros
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {(filters.manga || filters.user || filters.status || filters.search || filters.week) && (
              <Button
                size="small"
                startIcon={<Clear />}
                onClick={clearAllFilters}
                sx={{ color: 'text.secondary' }}
              >
                Limpiar filtros
              </Button>
            )}
          </Box>
          
          <Grid container spacing={2}>
            {/* Búsqueda de texto */}
            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              />
            </Grid>
            
            {/* Filtro por Semana */}
            <Grid item xs={12} md={2.4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Semana de Asignación"
                value={filters.week}
                onChange={(e) => handleFilterChange('week', e.target.value)}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              >
                <MenuItem value="">Todas las semanas</MenuItem>
                <MenuItem value={getCurrentWeek()}>Semana Actual</MenuItem>
                {getAvailableWeeks().map((weekKey) => {
                  const isCurrentWeek = weekKey === getCurrentWeek();
                  if (isCurrentWeek) return null; // Ya está mostrada arriba
                  return (
                    <MenuItem key={weekKey} value={weekKey}>
                      {formatWeekLabel(weekKey)}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
            
            {/* Filtro por Manga */}
            <Grid item xs={12} md={2.4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Manga"
                value={filters.manga}
                onChange={(e) => handleFilterChange('manga', e.target.value)}
                InputProps={{
                  startAdornment: <Book sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              >
                <MenuItem value="">Todos los mangas</MenuItem>
                {mangas.map((manga) => (
                  <MenuItem key={manga.id} value={manga.id}>
                    {manga.title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            {/* Filtro por Usuario */}
            <Grid item xs={12} md={2.4}>
              <Autocomplete
                fullWidth
                size="small"
                options={[{ uid: '', name: 'Todos los usuarios' }, ...getUniqueUsers(users)]}
                value={getUniqueUsers(users).find(user => (user.uid || user.id) === filters.user) || { uid: '', name: 'Todos los usuarios' }}
                onChange={(event, newValue) => {
                  handleFilterChange('user', newValue ? (newValue.uid || newValue.id || '') : '');
                }}
                getOptionLabel={(option) => option ? option.name || 'Usuario desconocido' : ''}
                isOptionEqualToValue={(option, value) => (option.uid || option.id || '') === (value.uid || value.id || '')}
                renderInput={(params) => {
                  const { inputProps, ...restParams } = params;
                  return (
                    <TextField
                      {...restParams}
                      label="Usuario"
                      inputProps={{
                        ...inputProps,
                        placeholder: filters.user === '' ? 'Buscar usuario...' : undefined
                      }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <Person sx={{ color: 'text.secondary', mr: 1 }} />
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  );
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                    <Avatar
                      src={option.profileImage || option.photoURL || option.avatar}
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.75rem',
                        ...(option.profileImage || option.photoURL || option.avatar) && {
                          bgcolor: 'transparent',
                          border: `2px solid #6366f160`,
                        },
                        ...(!(option.profileImage || option.photoURL || option.avatar)) && {
                          bgcolor: option.uid ? '#6366f1' : '#6b7280',
                          color: 'white',
                          fontWeight: 700,
                        }
                      }}
                    >
                      {!(option.profileImage || option.photoURL || option.avatar) && option.name && 
                       (option.uid ? option.name.substring(0, 2).toUpperCase() : '👥')}
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
              />
            </Grid>
            
            {/* Filtro por Estado */}
            <Grid item xs={12} md={2.4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Estado"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">Todos los estados</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="en_progreso">En Progreso</MenuItem>
                <MenuItem value="completado">Completado</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {assignments.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Asignaciones
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {assignments.filter(a => a.status === 'completado').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Completadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)'
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {assignments.filter(a => a.status === 'en_progreso').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                En Progreso
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(107, 114, 128, 0.3)'
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {assignments.filter(a => a.status === 'pendiente').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grouped Assignments */}
      <Grid container spacing={3}>
        {getFilteredGroups().map((group, index) => {
          const overallProgress = getOverallProgress(group.assignments);
          const groupStatus = getGroupStatus(group.assignments);
          const userName = getUserName(group.assignedTo, group.assignedToName);
          const userAvatar = getUserAvatar(group.assignedTo);
          const userRole = getUserRole(group.assignedTo);
          const isOverdue = group.dueDate && new Date(group.dueDate) < new Date() && groupStatus !== 'completado';
          
          return (
            <Grid item xs={12} md={6} lg={4} key={`${group.mangaId}-${group.chapter}-${group.assignedTo}`}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: 'rgba(15, 15, 25, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: isOverdue ? '2px solid #ef4444' : 
                          groupStatus === 'completado' ? '2px solid #10b981' :
                          groupStatus === 'en_progreso' ? '2px solid #f59e0b' :
                          '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: 3,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  },
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: isOverdue ? '#ef4444' : 
                               groupStatus === 'completado' ? 'linear-gradient(90deg, #10b981, #059669)' :
                               groupStatus === 'en_progreso' ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                               'linear-gradient(90deg, #6b7280, #4b5563)',
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={userAvatar}
                        sx={{
                          width: 48,
                          height: 48,
                          fontSize: '1rem',
                          ...(userAvatar ? {
                            border: '3px solid rgba(99, 102, 241, 0.3)',
                          } : {
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white',
                            fontWeight: 700
                          })
                        }}
                      >
                        {!userAvatar && userName.substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          {userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {userRole}
                        </Typography>
                      </Box>
                    </Box>
                    <Badge 
                      badgeContent={group.assignments.length} 
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          fontWeight: 600
                        }
                      }}
                    >
                      <Assignment sx={{ color: 'text.secondary' }} />
                    </Badge>
                  </Box>

                  {/* Manga & Chapter Info */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {group.mangaTitle}
                    </Typography>
                    <Chip 
                      label={`Capítulo ${group.chapter}`} 
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        fontWeight: 500
                      }}
                    />
                  </Box>

                  {/* Tasks */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                      Tareas ({group.assignments.length}):
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {group.assignments.map((assignment, idx) => {
                        const taskColor = getTaskColor(assignment.type);
                        return (
                          <Chip
                            key={idx}
                            size="small"
                            label={TASK_TYPES[assignment.type] || assignment.type}
                            sx={{
                              backgroundColor: taskColor.bg,
                              color: taskColor.color,
                              fontWeight: 500,
                              border: `1px solid ${taskColor.color}30`,
                              position: 'relative',
                              '&::after': assignment.status === 'completado' ? {
                                content: '"✓"',
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                fontSize: '12px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                borderRadius: '50%',
                                width: 16,
                                height: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              } : {}
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </Box>

                  {/* Progress */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progreso General
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {overallProgress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={overallProgress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(148, 163, 184, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: overallProgress === 100 ? 'linear-gradient(90deg, #10b981, #059669)' :
                                     overallProgress >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                                     'linear-gradient(90deg, #ef4444, #dc2626)'
                        }
                      }}
                    />
                  </Box>

                  {/* Due Date */}
                  {group.dueDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <CalendarToday sx={{ fontSize: '1rem', color: isOverdue ? 'error.main' : 'text.secondary' }} />
                      <Typography 
                        variant="body2" 
                        color={isOverdue ? 'error.main' : 'text.secondary'}
                        sx={{ fontWeight: isOverdue ? 600 : 400 }}
                      >
                        {new Date(group.dueDate).toLocaleDateString('es-ES')}
                        {isOverdue && ' (Atrasado)'}
                      </Typography>
                    </Box>
                  )}

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {group.assignments.map((assignment) => (
                        canManageAssignment(assignment) && (
                          <Tooltip key={assignment.id} title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(assignment)}
                              sx={{
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.2)' }
                              }}
                            >
                              <Edit sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                        )
                      ))}
                      
                      {/* Botón para marcar todas las asignaciones pendientes como completadas */}
                      {canMarkAsCompleted() && group.assignments.some(a => a.status !== 'completado') && (
                        <Tooltip title="Marcar todas como completadas">
                          <IconButton
                            size="small"
                            onClick={async () => {
                              const pendingAssignments = group.assignments.filter(a => a.status !== 'completado');
                              for (const assignment of pendingAssignments) {
                                await handleMarkAsCompleted(assignment.id);
                              }
                              toast.success(`${pendingAssignments.length} asignación(es) marcada(s) como completada(s)`);
                            }}
                            sx={{
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              color: '#10b981',
                              '&:hover': { 
                                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            <CheckCircle sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {group.driveLink && (
                        <Tooltip title="Abrir en Google Drive">
                          <IconButton
                            size="small"
                            onClick={() => window.open(group.driveLink, '_blank')}
                            sx={{
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              color: '#10b981',
                              '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.2)' }
                            }}
                          >
                            <LinkIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Ver detalles">
                        <IconButton 
                          size="small"
                          onClick={() => handleOpenDetails(group)}
                          sx={{
                            backgroundColor: 'rgba(107, 114, 128, 0.1)',
                            '&:hover': { backgroundColor: 'rgba(107, 114, 128, 0.2)' }
                          }}
                        >
                          <Visibility sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Opciones">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, group)}
                          sx={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.2)' }
                          }}
                        >
                          <MoreVert sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {getFilteredGroups().length === 0 && (
        <Card sx={{ 
          textAlign: 'center', 
          py: 8,
          background: 'rgba(15, 15, 25, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
          <Assignment sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
            No hay asignaciones disponibles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Las asignaciones aparecerán aquí cuando sean creadas
          </Typography>
        </Card>
      )}

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

      {/* Dialog de detalles del grupo */}
      <Dialog
        open={detailsDialog.open}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={detailsDialog.group && getUserAvatar(detailsDialog.group.assignedTo)}
            sx={{
              width: 40,
              height: 40,
              fontSize: '0.9rem',
              ...(detailsDialog.group && getUserAvatar(detailsDialog.group.assignedTo) ? {
                border: '2px solid rgba(99, 102, 241, 0.3)',
              } : {
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                fontWeight: 700
              })
            }}
          >
            {detailsDialog.group && !getUserAvatar(detailsDialog.group.assignedTo) && 
             getUserName(detailsDialog.group.assignedTo, detailsDialog.group.assignedToName).substring(0, 2).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {detailsDialog.group && detailsDialog.group.mangaTitle} - Capítulo {detailsDialog.group && detailsDialog.group.chapter}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Asignado a: {detailsDialog.group && getUserName(detailsDialog.group.assignedTo, detailsDialog.group.assignedToName)}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {detailsDialog.group && (
            <Grid container spacing={3}>
              {/* Información general */}
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      📋 Información General
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Manga:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {detailsDialog.group.mangaTitle}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Capítulo:</Typography>
                      <Chip 
                        label={`Capítulo ${detailsDialog.group.chapter}`}
                        size="small"
                        sx={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Asignado a:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Avatar
                          src={getUserAvatar(detailsDialog.group.assignedTo)}
                          sx={{ width: 24, height: 24 }}
                        >
                          {!getUserAvatar(detailsDialog.group.assignedTo) && 
                           getUserName(detailsDialog.group.assignedTo, detailsDialog.group.assignedToName).substring(0, 1).toUpperCase()}
                        </Avatar>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {getUserName(detailsDialog.group.assignedTo, detailsDialog.group.assignedToName)}
                        </Typography>
                        <Chip 
                          label={getUserRole(detailsDialog.group.assignedTo)}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Estado General:</Typography>
                      <Chip
                        icon={getStatusIcon(getGroupStatus(detailsDialog.group.assignments))}
                        label={getGroupStatus(detailsDialog.group.assignments).replace('_', ' ').toUpperCase()}
                        color={getStatusColor(getGroupStatus(detailsDialog.group.assignments))}
                        sx={{ mt: 0.5, fontWeight: 500 }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Progreso General:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getOverallProgress(detailsDialog.group.assignments)}
                          sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(148, 163, 184, 0.2)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: getOverallProgress(detailsDialog.group.assignments) === 100 ? 
                                         'linear-gradient(90deg, #10b981, #059669)' :
                                         getOverallProgress(detailsDialog.group.assignments) >= 50 ? 
                                         'linear-gradient(90deg, #f59e0b, #d97706)' :
                                         'linear-gradient(90deg, #ef4444, #dc2626)'
                            }
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                          {getOverallProgress(detailsDialog.group.assignments)}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    {detailsDialog.group.dueDate && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">Fecha límite:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <CalendarToday sx={{ 
                            fontSize: '1rem', 
                            color: new Date(detailsDialog.group.dueDate) < new Date() && 
                                   getGroupStatus(detailsDialog.group.assignments) !== 'completado' ? 
                                   'error.main' : 'text.secondary' 
                          }} />
                          <Typography 
                            variant="body1" 
                            color={new Date(detailsDialog.group.dueDate) < new Date() && 
                                   getGroupStatus(detailsDialog.group.assignments) !== 'completado' ? 
                                   'error.main' : 'text.primary'}
                            sx={{ fontWeight: 500 }}
                          >
                            {new Date(detailsDialog.group.dueDate).toLocaleDateString('es-ES')}
                            {new Date(detailsDialog.group.dueDate) < new Date() && 
                             getGroupStatus(detailsDialog.group.assignments) !== 'completado' && 
                             ' (Atrasado)'}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    {detailsDialog.group.driveLink && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<LinkIcon />}
                          onClick={() => window.open(detailsDialog.group.driveLink, '_blank')}
                          sx={{ 
                            borderColor: '#10b981',
                            color: '#10b981',
                            '&:hover': {
                              borderColor: '#059669',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)'
                            }
                          }}
                        >
                          Abrir en Google Drive
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Lista de tareas */}
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      ✅ Tareas ({detailsDialog.group.assignments.length})
                    </Typography>
                    
                    <Stack spacing={2}>
                      {detailsDialog.group.assignments.map((assignment, idx) => {
                        const taskColor = getTaskColor(assignment.type);
                        return (
                          <Card 
                            key={idx}
                            sx={{ 
                              background: assignment.status === 'completado' ? 
                                         'rgba(16, 185, 129, 0.1)' : 
                                         assignment.status === 'en_progreso' ? 
                                         'rgba(245, 158, 11, 0.1)' : 
                                         'rgba(107, 114, 128, 0.1)',
                              border: `1px solid ${assignment.status === 'completado' ? 
                                                  '#10b981' : 
                                                  assignment.status === 'en_progreso' ? 
                                                  '#f59e0b' : 
                                                  '#6b7280'}30`
                            }}
                          >
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Chip
                                  size="small"
                                  label={TASK_TYPES[assignment.type] || assignment.type}
                                  sx={{
                                    backgroundColor: taskColor.bg,
                                    color: taskColor.color,
                                    fontWeight: 500,
                                    border: `1px solid ${taskColor.color}30`
                                  }}
                                />
                                <Chip
                                  icon={getStatusIcon(assignment)}
                                  label={getStatusText(assignment)}
                                  color={getStatusColor(assignment)}
                                  size="small"
                                  sx={{ fontWeight: 500 }}
                                />
                              </Box>
                              
                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Progreso:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {assignment.progress || 0}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={assignment.progress || 0}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: 'rgba(148, 163, 184, 0.2)',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      background: (assignment.progress || 0) === 100 ? 
                                                 'linear-gradient(90deg, #10b981, #059669)' :
                                                 (assignment.progress || 0) >= 50 ? 
                                                 'linear-gradient(90deg, #f59e0b, #d97706)' :
                                                 'linear-gradient(90deg, #ef4444, #dc2626)'
                                    }
                                  }}
                                />
                              </Box>
                              
                              {assignment.priority && assignment.priority !== 'normal' && (
                                <Box sx={{ mb: 1 }}>
                                  <Chip
                                    label={`Prioridad: ${assignment.priority.toUpperCase()}`}
                                    color={getPriorityColor(assignment.priority)}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                              )}
                              
                              {assignment.createdAt && (
                                <Typography variant="caption" color="text.secondary">
                                  Creada: {new Date(assignment.createdAt).toLocaleDateString('es-ES')}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDetails}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Nuevo diálogo estilo SeriesManagement */}
      <Dialog 
        open={assignmentDialog.open} 
        onClose={handleCloseAssignmentDialog} 
        maxWidth="md" 
        fullWidth
        scroll="body"
        PaperProps={{
          sx: {
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 40, 0.98)' 
              : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 2,
            margin: '32px auto',
            position: 'relative'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          py: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Assignment sx={{ color: 'primary.main', fontSize: '1.8rem' }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Nueva Asignación
            </Typography>
          </Box>
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
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <Button 
            onClick={handleCloseAssignmentDialog}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveNewAssignment}
            variant="contained"
            disabled={!newAssignmentForm.mangaId || !newAssignmentForm.chapter}
            sx={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5b21b6, #7c3aed)'
              },
              '&:disabled': {
                background: 'rgba(107, 114, 128, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)'
              }
            }}
          >
            Crear Asignación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de error para capítulo completado */}
      <Dialog
        open={chapterCompletedDialog.open}
        onClose={() => {
          setChapterCompletedDialog({ open: false, mangaTitle: '', chapter: '', reason: '', chapterData: null });
          // Limpiar el campo capítulo para que el usuario pueda intentar con otro
          setNewAssignmentForm(prev => ({ ...prev, chapter: '' }));
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 40, 0.98)' 
              : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '2px solid #ef4444',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          color: 'error.main'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Warning sx={{ color: 'error.main', fontSize: '2rem' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                No se puede asignar este capítulo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                El capítulo ya está completado
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              {chapterCompletedDialog.reason}
            </Typography>
          </Alert>
          
          <Card sx={{ 
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            mb: 2
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Book sx={{ color: 'primary.main' }} />
                Detalles del Capítulo
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Manga:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {chapterCompletedDialog.mangaTitle}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Número de Capítulo:</Typography>
                  <Chip 
                    label={`Capítulo ${chapterCompletedDialog.chapter}`}
                    size="small"
                    sx={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                </Grid>
                
                {chapterCompletedDialog.chapterData?.fechaSubida && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Fecha de Subida:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {chapterCompletedDialog.chapterData.fechaSubida}
                    </Typography>
                  </Grid>
                )}
                
                {chapterCompletedDialog.chapterData?.linkCapitulo && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Enlace del Capítulo:</Typography>
                    <Button
                      size="small"
                      startIcon={<LinkIcon />}
                      onClick={() => window.open(chapterCompletedDialog.chapterData.linkCapitulo, '_blank')}
                      sx={{ mt: 0.5 }}
                    >
                      Ver Capítulo
                    </Button>
                  </Grid>
                )}
                
                {chapterCompletedDialog.chapterData?.status && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Estado:</Typography>
                    <Chip 
                      label={chapterCompletedDialog.chapterData.status}
                      size="small"
                      color="success"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
          
          <Alert severity="info" icon={<Assignment />}>
            <Typography variant="body2">
              <strong>Sugerencia:</strong> Intenta con un capítulo diferente que aún no haya sido completado o publicado.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(239, 68, 68, 0.1)' }}>
          <Button 
            onClick={() => {
              setChapterCompletedDialog({ open: false, mangaTitle: '', chapter: '', reason: '', chapterData: null });
              // Limpiar el campo capítulo para que el usuario pueda intentar con otro
              setNewAssignmentForm(prev => ({ ...prev, chapter: '' }));
            }}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5b21b6, #7c3aed)'
              }
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Assignments;
