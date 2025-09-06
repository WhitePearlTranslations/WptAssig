import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  TextField,
  LinearProgress,
  CircularProgress,
  Alert,
  Divider,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CloudUpload as UploadIcon,
  Check as CheckIcon,
  CheckCircle as CompleteIcon,
  Warning as WarningIcon,
  Link as LinkIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Save as SaveIcon,
  Assessment as ReportIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { realtimeService } from '../services/realtimeService';
import { useAuth } from '../contexts/AuthContextSimple';

// Estados de capítulo
const CHAPTER_STATUS = {
  COMPLETED: 'completado',
  UPLOADED: 'uploaded'
};

// Componente principal del nuevo panel de uploads
const NewUploadsPanel = () => {
  const { userProfile } = useAuth();
  const [availableChapters, setAvailableChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]); 
  const [currentWorkflow, setCurrentWorkflow] = useState(null); // 'selection' | 'layout' | 'report'
  const [layoutProgress, setLayoutProgress] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const [uploadReport, setUploadReport] = useState(null);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [allCompletedChapters, setAllCompletedChapters] = useState([]);
  const [saveProgressLoading, setSaveProgressLoading] = useState(false);
  const [saveProgressSuccess, setSaveProgressSuccess] = useState(false);

  // Estados del checklist de maquetado
  const [layoutChecklist, setLayoutChecklist] = useState({
    hasCreditsPage: false,
    hasScanNotices: false,
    everythingCorrect: false,
  });

  useEffect(() => {
    loadAvailableChapters();
    if (userProfile?.uid) {
      loadSavedProgress();
    }
  }, [userProfile]);

  // Cargar capítulos disponibles (status = completado)
  const loadAvailableChapters = async () => {
    try {
      setLoading(true);
      const [assignments, mangas] = await Promise.all([
        realtimeService.getAllAssignments(),
        realtimeService.getAllMangas()
      ]);

      //  message removed for production
      //  message removed for production
      //  message removed for production

      // Agrupar asignaciones por manga y capítulo
      const chapterGroups = {};
      assignments.forEach(assignment => {
        const key = `${assignment.mangaId}-${assignment.chapter}`;
        if (!chapterGroups[key]) {
          chapterGroups[key] = {
            mangaId: assignment.mangaId,
            chapter: assignment.chapter,
            assignments: [],
            driveLink: assignment.driveLink,
            credits: assignment.credits || assignment.notes || '',
            mangaTitle: assignment.mangaTitle || assignment.manga,
            status: null
          };
        }
        chapterGroups[key].assignments.push(assignment);
        
        // Actualizar driveLink si no existe pero esta asignación sí tiene uno
        if (!chapterGroups[key].driveLink && assignment.driveLink) {
          chapterGroups[key].driveLink = assignment.driveLink;
        }
      });

      //  message removed for production

      // Filtrar capítulos completados y no subidos
      const completedChapters = Object.values(chapterGroups).filter(chapterGroup => {
        // Encontrar el manga correspondiente para determinar si es joint
        const manga = mangas.find(m => m.id === chapterGroup.mangaId);
        
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
        const normalizedAvailableTasks = manga?.isJoint && manga?.availableTasks 
          ? manga.availableTasks
              .filter(task => task !== 'edicion') // Filtrar completamente la tarea 'edicion'
              .map(task => taskMapping[task] || task)
              .filter(Boolean)
          : null;
        
        // Filtrar solo asignaciones válidas (con tipo definido)
        const validAssignments = chapterGroup.assignments.filter(assignment => 
          assignment && 
          assignment.type && 
          assignment.type !== undefined && 
          typeof assignment.type === 'string' && 
          ['traduccion', 'proofreading', 'cleanRedrawer', 'type'].includes(assignment.type)
        );
        
        // Determinar el número de tareas requeridas
        const requiredTaskCount = manga?.isJoint && normalizedAvailableTasks 
          ? normalizedAvailableTasks.length 
          : 4; // traduccion, proofreading, cleanRedrawer, type
        
        // CORREGIDO: Un capítulo está completado SOLO si:
        // 1. Tiene TODAS las tareas necesarias para un capítulo completo
        // 2. TODAS las tareas necesarias están completadas O aprobadas
        // 3. NINGUNA tarea está subida (uploaded)
        const allCompleted = validAssignments.length === requiredTaskCount && 
          validAssignments.every(assignment => 
            assignment.status === CHAPTER_STATUS.COMPLETED || 
            assignment.status === 'aprobado' || 
            assignment.status === 'completed'
          );
        
        const noneUploaded = chapterGroup.assignments.every(assignment => 
          assignment.status !== CHAPTER_STATUS.UPLOADED);
        
        // Cambiamos la lógica para no requerir obligatoriamente el driveLink
        // Ya que podría estar en alguna asignación individual
        const hasValidData = allCompleted && noneUploaded;
        
        //  message removed for production
        
        return hasValidData;
      });

      //  message removed for production
      
      // Función para detectar si un capítulo es joint y extraer información
      const detectJoint = (chapter) => {
        
        // Primero verificar si el manga ya tiene información de joint
        const manga = mangas.find(m => m.id === chapter.mangaId);
        // Debug message removed for production
        
        // Si el manga tiene información directa de joint, usarla
        if (manga?.isJoint) {
          const jointInfo = {
            isJoint: true,
            partner: manga.jointPartner || 'Otro Scan',
            fullText: manga.description || '',
            source: 'manga-data'
          };
          
          //  message removed for production
          //  message removed for production
          return jointInfo;
        }
        
        // Si no, proceder con el análisis de texto como antes
        const jointIndicators = [
          'joint', 'colaboracion', 'colaboración', 'collab', 'conjunto',
          'collaboration', 'cooperacion', 'cooperación', 'team up',
          'teamup', 'joint project', 'proyecto conjunto', 
          'scan conjunto', 'traduccion conjunta', 'traducción conjunta',
          'con ', 'with ', 'junto a', 'junto con', 'junto', 'shared',
          'compartido', 'colaborativo'
        ];
        
        // Expandir búsqueda para incluir más campos
        const textsToCheck = [
          chapter.mangaTitle?.toLowerCase() || '',
          chapter.credits?.toLowerCase() || '',
          ...chapter.assignments.map(a => a.notes?.toLowerCase() || ''),
          ...chapter.assignments.map(a => a.credits?.toLowerCase() || ''),
          ...chapter.assignments.map(a => a.assignedToName?.toLowerCase() || ''),
          ...chapter.assignments.map(a => a.type?.toLowerCase() || ''),
          // También buscar en el manga original si está disponible
          manga?.description?.toLowerCase() || '',
          manga?.notes?.toLowerCase() || ''
        ];
        
        const fullText = textsToCheck.join(' ');
        //  message removed for production
        //  message removed for production
        
        const isJoint = jointIndicators.some(indicator => fullText.includes(indicator));
        //  message removed for production
        
        if (isJoint) {
          const matchedIndicators = jointIndicators.filter(indicator => fullText.includes(indicator));
          //  message removed for production
        }
        
        let jointPartner = null;
        let jointInfo = null;
        
        if (isJoint) {
          // Intentar extraer el nombre del scan partner
          const originalTexts = [
            chapter.mangaTitle || '',
            chapter.credits || '',
            ...chapter.assignments.map(a => a.notes || ''),
            ...chapter.assignments.map(a => a.credits || ''),
            manga?.description || ''
          ];
          
          const combinedText = originalTexts.join(' ');
          
          // Patrones más amplios para detectar nombres de scans
          const scanPatterns = [
            // Patrones específicos
            /joint.*?(?:with|con|junto)\s+([A-Za-z0-9\s-_]{2,30})(?:\s|$|scan|group|fansub)/gi,
            /colaboraci[oó]n.*?con\s+([A-Za-z0-9\s-_]{2,30})(?:\s|$|scan|group|fansub)/gi,
            /collab.*?(?:with|con)\s+([A-Za-z0-9\s-_]{2,30})(?:\s|$|scan|group|fansub)/gi,
            /scan conjunto.*?([A-Za-z0-9\s-_]{2,30})(?:\s|$|scan|group|fansub)/gi,
            /(?:junto|with)\s+([A-Za-z0-9\s-_]{2,30})\s*(?:scan|group|fansub)/gi,
            // Patrones más generales
            /(?:joint|collab|colaboraci[oó]n|junto).*?([A-Z][A-Za-z0-9\s]{2,25})\s*(?:scan|group|fansub)/gi,
            /([A-Z][A-Za-z0-9\s]{2,25})\s*(?:scan|group|fansub).*?(?:joint|collab|colaboraci[oó]n)/gi
          ];
          
          for (const pattern of scanPatterns) {
            let match;
            // Reset regex
            pattern.lastIndex = 0;
            while ((match = pattern.exec(combinedText)) !== null) {
              if (match && match[1]) {
                const candidate = match[1].trim();
                // Filtrar nombres muy cortos o genéricos
                if (candidate.length > 2 && 
                    !['con', 'and', 'the', 'de', 'en', 'un', 'una'].includes(candidate.toLowerCase())) {
                  jointPartner = candidate;
                  //  message removed for production
                  break;
                }
              }
            }
            if (jointPartner) break;
          }
          
          // Si no se encuentra un partner específico, buscar palabras que podrían ser nombres
          if (!jointPartner) {
            const words = combinedText.split(/\s+/);
            for (let i = 0; i < words.length; i++) {
              const word = words[i];
              if (jointIndicators.some(indicator => word.toLowerCase().includes(indicator))) {
                // Buscar palabras capitalizadas cerca del indicador
                for (let j = Math.max(0, i - 3); j < Math.min(words.length, i + 4); j++) {
                  const candidate = words[j];
                  if (candidate && /^[A-Z]/.test(candidate) && candidate.length > 2) {
                    const nextWord = words[j + 1];
                    if (nextWord && (/scan|group|fansub/i.test(nextWord) || /^[A-Z]/.test(nextWord))) {
                      jointPartner = `${candidate}${nextWord ? ' ' + nextWord : ''}`;
                      //  message removed for production
                      break;
                    }
                  }
                }
                if (jointPartner) break;
              }
            }
          }
          
          jointInfo = {
            isJoint: true,
            partner: jointPartner || 'Otro Scan',
            fullText: combinedText,
            source: 'text-analysis'
          };
          
          //  message removed for production
          //  message removed for production
          //  message removed for production
        }
        
        return jointInfo || { isJoint: false };
      };
      
      // Función para obtener créditos de usuarios del capítulo
      const getChapterCredits = (chapter) => {
        const credits = [];
        
        // Obtener usuarios únicos de las asignaciones
        const uniqueUsers = [...new Set(chapter.assignments.map(a => a.assignedToName).filter(name => name))];
        const assignmentTypes = [...new Set(chapter.assignments.map(a => a.type).filter(type => type))];
        
        return {
          users: uniqueUsers,
          roles: assignmentTypes,
          credits: chapter.credits || ''
        };
      };
      
      // Agrupar capítulos por serie con información completa
      const seriesGroupsComplete = {};
      completedChapters.forEach(chapter => {
        const manga = mangas.find(m => m.id === chapter.mangaId);
        
        if (!seriesGroupsComplete[chapter.mangaId]) {
          seriesGroupsComplete[chapter.mangaId] = {
            mangaId: chapter.mangaId,
            manga: manga,
            mangaTitle: chapter.mangaTitle || manga?.title || 'Manga Sin Título',
            coverImage: manga?.coverImage || null,
            isJoint: false,
            chapters: []
          };
        }
        
        // Agregar información de joint y créditos al capítulo y a la serie
        const jointInfo = detectJoint(chapter);
        const chapterCredits = getChapterCredits(chapter);
        
        const chapterWithJoint = {
          ...chapter,
          manga: manga,
          isJoint: jointInfo.isJoint,
          jointPartner: jointInfo.partner,
          jointInfo: jointInfo,
          chapterCredits: chapterCredits
        };
        
        if (jointInfo.isJoint) {
          seriesGroupsComplete[chapter.mangaId].isJoint = true;
        }
        
        seriesGroupsComplete[chapter.mangaId].chapters.push(chapterWithJoint);
      });
      
      // Ordenar capítulos dentro de cada serie
      Object.values(seriesGroupsComplete).forEach(seriesGroup => {
        seriesGroup.chapters.sort((a, b) => parseFloat(a.chapter) - parseFloat(b.chapter));
      });
      
      // Para la vista completa: crear lista plana ordenada por serie y capítulo
      const allChaptersFlat = Object.values(seriesGroupsComplete)
        .sort((a, b) => a.mangaTitle.localeCompare(b.mangaTitle))
        .flatMap(seriesGroup => seriesGroup.chapters);
      
      setAllCompletedChapters(allChaptersFlat);
      
      // Para la vista simplificada: tomar solo el capítulo más antiguo de cada serie
      const availableChaptersList = Object.values(seriesGroupsComplete).map(seriesGroup => {
        const oldestChapter = seriesGroup.chapters[0]; // Ya están ordenados
        return {
          ...oldestChapter,
          totalAvailable: seriesGroup.chapters.length,
          seriesData: {
            mangaId: seriesGroup.mangaId,
            mangaTitle: seriesGroup.mangaTitle,
            coverImage: seriesGroup.coverImage,
            isJoint: seriesGroup.isJoint,
            totalChapters: seriesGroup.chapters.length,
            chapters: seriesGroup.chapters
          }
        };
      }).sort((a, b) => a.mangaTitle.localeCompare(b.mangaTitle));

      //  message removed for production
      //  message removed for production
      setAvailableChapters(availableChaptersList);
    } catch (error) {
      //  message removed for production
    } finally {
      setLoading(false);
    }
  };

  // Cargar progreso guardado
  const loadSavedProgress = async () => {
    if (!userProfile?.uid) return;
    
    try {
      const progress = await realtimeService.getData(`uploadProgress/${userProfile.uid}`);
      if (progress) {
        setSavedProgress(progress);
      }
    } catch (error) {
      //  message removed for production
    }
  };

  // Función para limpiar valores undefined (Firebase no los acepta)
  const cleanUndefinedValues = (obj) => {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => cleanUndefinedValues(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        cleaned[key] = cleanUndefinedValues(value);
      }
      return cleaned;
    }
    
    return obj;
  };

  // Guardar progreso actual
  const saveProgress = async () => {
    if (!userProfile?.uid) {
      console.error('No hay usuario autenticado para guardar progreso');
      alert('Error: No hay usuario autenticado. Por favor, inicia sesión de nuevo.');
      return;
    }
    
    try {
      setSaveProgressLoading(true);
      console.log('Iniciando guardado de progreso para usuario:', userProfile.uid);
      console.log('Rol del usuario:', userProfile.role);
      
      // Validar datos antes del guardado
      if (!selectedChapters || selectedChapters.length === 0) {
        console.warn('No hay capítulos seleccionados para guardar');
        alert('No hay capítulos seleccionados para guardar.');
        return;
      }
      
      // Limpiar datos para evitar referencias circulares y datos innecesarios
      const cleanSelectedChapters = selectedChapters.map(chapter => {
        const cleanChapter = {
          mangaId: chapter.mangaId || null,
          mangaTitle: chapter.mangaTitle || null,
          chapter: chapter.chapter || null,
          assignments: chapter.assignments?.map(assignment => ({
            id: assignment.id || null,
            type: assignment.type || null,
            status: assignment.status || null,
            assignedTo: assignment.assignedTo || null,
            assignedToName: assignment.assignedToName || null
          })) || [],
          driveLink: chapter.driveLink || null,
          isJoint: chapter.isJoint || false,
          jointPartner: chapter.jointPartner || null,
          chapterCredits: chapter.chapterCredits || null
        };
        
        // Limpiar cualquier undefined que pueda haber quedado
        return cleanUndefinedValues(cleanChapter);
      });
      
      const progressData = {
        selectedChapters: cleanSelectedChapters,
        currentChapterIndex: currentChapterIndex || 0,
        layoutProgress: layoutProgress || [],
        layoutChecklist: layoutChecklist || {
          hasCreditsPage: false,
          hasScanNotices: false,
          everythingCorrect: false
        },
        workflow: currentWorkflow || 'layout',
        lastSaved: Date.now()
      };
      
      // Aplicar limpieza final a todo el objeto progressData
      const cleanProgressData = cleanUndefinedValues(progressData);
      
      console.log('Datos a guardar:', {
        userId: userProfile.uid,
        selectedChaptersCount: cleanSelectedChapters.length,
        currentChapterIndex,
        workflow: currentWorkflow,
        layoutChecklistCompleted: Object.values(layoutChecklist).every(v => v)
      });
      
      // Intentar guardar los datos
      const success = await realtimeService.setData(`uploadProgress/${userProfile.uid}`, cleanProgressData);
      
      if (success) {
        setSavedProgress(cleanProgressData);
        console.log('Progreso guardado exitosamente');
        
        // Mostrar feedback de éxito
        setSaveProgressSuccess(true);
        
        // Ocultar el feedback después de 2 segundos
        setTimeout(() => {
          setSaveProgressSuccess(false);
        }, 2000);
      } else {
        throw new Error('La función setData retornó false');
      }
      
    } catch (error) {
      console.error('Error detallado al guardar progreso:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje de error:', error.message);
      
      // Mensajes de error más específicos
      let errorMessage = 'Error al guardar el progreso. ';
      
      if (error.code === 'PERMISSION_DENIED') {
        errorMessage += 'No tienes permisos para guardar el progreso. Verifica tu rol de usuario.';
        console.error('Permisos insuficientes. Rol actual:', userProfile?.role);
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage += 'Error de conexión. Verifica tu conexión a internet.';
      } else if (error.message?.includes('auth')) {
        errorMessage += 'Error de autenticación. Por favor, inicia sesión de nuevo.';
      } else if (error.message?.includes('validation')) {
        errorMessage += 'Los datos no cumplen con los requisitos del sistema.';
        console.error('Error de validación:', error.message);
      } else {
        errorMessage += 'Error interno. Por favor, inténtalo de nuevo.';
      }
      
      errorMessage += ' Si el problema persiste, contacta al administrador.';
      alert(errorMessage);
    } finally {
      setSaveProgressLoading(false);
    }
  };

  // Retomar progreso guardado
  const resumeProgress = () => {
    if (savedProgress) {
      setSelectedChapters(savedProgress.selectedChapters || []);
      setCurrentChapterIndex(savedProgress.currentChapterIndex || 0);
      setLayoutProgress(savedProgress.layoutProgress || []);
      setLayoutChecklist(savedProgress.layoutChecklist || {
        hasCreditsPage: false,
        hasScanNotices: false,
        everythingCorrect: false,
      });
      setCurrentWorkflow(savedProgress.workflow || 'layout');
    }
  };

  // Iniciar flujo de uploads
  const startUploadFlow = () => {
    if (selectedChapters.length === 0) return;
    
    setCurrentWorkflow('layout');
    setCurrentChapterIndex(0);
    setLayoutProgress(selectedChapters.map(() => ({
      hasCreditsPage: false,
      hasScanNotices: false,
      everythingCorrect: false,
      completed: false
    })));
  };

  // Manejar selección de capítulo
  const handleChapterSelection = (chapter, selected) => {
    if (selected) {
      setSelectedChapters(prev => [...prev, chapter]);
    } else {
      setSelectedChapters(prev => prev.filter(c => 
        !(c.mangaId === chapter.mangaId && c.chapter === chapter.chapter)
      ));
    }
  };

  // Seleccionar todos los capítulos
  const handleSelectAll = () => {
    const chaptersToSelect = showAllChapters ? allCompletedChapters : availableChapters;
    setSelectedChapters([...chaptersToSelect]);
  };

  // Deseleccionar todos los capítulos
  const handleDeselectAll = () => {
    setSelectedChapters([]);
  };

  // Verificar si todos los capítulos están seleccionados
  const areAllSelected = () => {
    const chaptersToCheck = showAllChapters ? allCompletedChapters : availableChapters;
    return chaptersToCheck.length > 0 && chaptersToCheck.every(chapter => 
      selectedChapters.some(selected => 
        selected.mangaId === chapter.mangaId && selected.chapter === chapter.chapter
      )
    );
  };

  // Completar checklist del capítulo actual
  const completeCurrentChapter = async () => {
    const currentChapter = selectedChapters[currentChapterIndex];
    const checklistCompleted = Object.values(layoutChecklist).every(v => v);
    
    if (!checklistCompleted) return;

    // Actualizar progreso local
    const newLayoutProgress = [...layoutProgress];
    newLayoutProgress[currentChapterIndex] = {
      ...layoutChecklist,
      completed: true
    };
    setLayoutProgress(newLayoutProgress);

    // Guardar progreso
    await saveProgress();

    // Avanzar al siguiente capítulo o completar
    if (currentChapterIndex < selectedChapters.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
      setLayoutChecklist({
        hasCreditsPage: false,
        hasScanNotices: false,
        everythingCorrect: false,
      });
    } else {
      await completeUploadFlow();
    }
  };

  // Completar flujo de uploads
  const completeUploadFlow = async () => {
    try {
      setLoading(true);

      // Marcar todos los capítulos como subidos
      const uploadPromises = selectedChapters.map(async (chapter) => {
        const updatePromises = chapter.assignments.map(assignment =>
          realtimeService.updateAssignment(assignment.id, {
            status: CHAPTER_STATUS.UPLOADED,
            uploadedDate: new Date().toISOString().split('T')[0]
          })
        );
        return Promise.all(updatePromises);
      });

      await Promise.all(uploadPromises);

      // Crear reporte de uploads
      const report = {
        id: Date.now().toString(),
        uploaderId: userProfile.uid,
        uploaderName: userProfile.name,
        chapters: selectedChapters.map(chapter => ({
          mangaId: chapter.mangaId,
          mangaTitle: chapter.mangaTitle,
          chapter: chapter.chapter,
          driveLink: chapter.driveLink
        })),
        uploadDate: new Date().toISOString(),
        totalChapters: selectedChapters.length
      };

      // Guardar reporte en la base de datos
      await realtimeService.setData(`uploadReports/${report.id}`, report);

      // Limpiar progreso guardado
      if (userProfile?.uid) {
        await realtimeService.deleteData(`uploadProgress/${userProfile.uid}`);
      }

      setUploadReport(report);
      setCurrentWorkflow('report');
      setSavedProgress(null);
    } catch (error) {
      //  message removed for production
      
      // Mostrar error específico al usuario
      let errorMessage = 'Error desconocido durante el upload.';
      
      if (error.message?.includes('PERMISSION_DENIED')) {
        errorMessage = `Error de permisos: No tienes autorización para crear reportes de uploads.\n\nRol actual: ${userProfile?.role}\nRoles permitidos: admin, administrador, uploader`;
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset del flujo
  const resetFlow = () => {
    setSelectedChapters([]);
    setCurrentWorkflow(null);
    setLayoutProgress([]);
    setCurrentChapterIndex(0);
    setLayoutChecklist({
      hasCreditsPage: false,
      hasScanNotices: false,
      everythingCorrect: false,
    });
    setUploadReport(null);
    loadAvailableChapters();
  };

  // Crear datos de prueba (solo para desarrollo)
  const createTestData = async () => {
    try {
      setLoading(true);
      //  message removed for production
      
      // Crear manga de prueba
      const testMangaId = await realtimeService.createManga({
        title: 'Manga de Prueba - Upload System',
        author: 'Autor de Prueba',
        status: 'active',
        description: 'Manga creado para probar el nuevo sistema de uploads',
        genres: ['Acción', 'Aventura'],
        demographic: 'Shonen'
      });
      
      //  message removed for production
      
      // Crear varios mangas de prueba con diferentes casos de joint
      const testManga1Id = testMangaId;
      
      // Crear un segundo manga para joint
      const testManga2Id = await realtimeService.createManga({
        title: 'Manga Joint Collab - Test',
        author: 'Autor Joint',
        status: 'active',
        description: 'Manga para probar joint collaboration',
        genres: ['Romance', 'Drama'],
        demographic: 'Josei'
      });
      
      //  message removed for production
      
      // Crear asignaciones de prueba (algunas joint, otras no)
      const testAssignments = [
        // Manga normal sin joint
        {
          mangaId: testManga1Id,
          mangaTitle: 'Manga de Prueba - Upload System',
          chapter: '1',
          type: 'traduccion',
          status: 'completado',
          assignedTo: userProfile.uid,
          assignedToName: userProfile.name,
          driveLink: 'https://drive.google.com/drive/folders/ejemplo1',
          notes: 'Capítulo de prueba completado',
          completedDate: new Date().toISOString().split('T')[0]
        },
        {
          mangaId: testManga1Id,
          mangaTitle: 'Manga de Prueba - Upload System',
          chapter: '1',
          type: 'proofreading',
          status: 'completado',
          assignedTo: userProfile.uid,
          assignedToName: userProfile.name,
          driveLink: 'https://drive.google.com/drive/folders/ejemplo1',
          notes: 'Proofreading completado',
          completedDate: new Date().toISOString().split('T')[0]
        },
        // Manga con joint - Cap 2 (con múltiples usuarios)
        {
          mangaId: testManga1Id,
          mangaTitle: 'Manga de Prueba - Upload System',
          chapter: '2',
          type: 'traduccion',
          status: 'completado',
          assignedTo: userProfile.uid,
          assignedToName: userProfile.name,
          driveLink: 'https://drive.google.com/drive/folders/ejemplo2',
          notes: 'Joint project with MangaLovers Scan - traducción conjunta',
          completedDate: new Date().toISOString().split('T')[0]
        },
        {
          mangaId: testManga1Id,
          mangaTitle: 'Manga de Prueba - Upload System',
          chapter: '2',
          type: 'proofreading',
          status: 'completado',
          assignedTo: 'user2',
          assignedToName: 'María González',
          driveLink: 'https://drive.google.com/drive/folders/ejemplo2',
          notes: 'Proofreading para joint collaboration con MangaLovers',
          completedDate: new Date().toISOString().split('T')[0]
        },
        {
          mangaId: testManga1Id,
          mangaTitle: 'Manga de Prueba - Upload System',
          chapter: '2',
          type: 'limpieza',
          status: 'completado',
          assignedTo: 'user3',
          assignedToName: 'Carlos Ruiz',
          driveLink: 'https://drive.google.com/drive/folders/ejemplo2',
          notes: 'Limpieza y retoque joint con MangaLovers Scan',
          completedDate: new Date().toISOString().split('T')[0]
        },
        // Manga completamente joint con múltiples colaboradores
        {
          mangaId: testManga2Id,
          mangaTitle: 'Manga Joint Collab - Test',
          chapter: '1',
          type: 'traduccion',
          status: 'completado',
          assignedTo: userProfile.uid,
          assignedToName: userProfile.name,
          driveLink: 'https://drive.google.com/drive/folders/joint1',
          notes: 'Colaboración con Dragon Scan Group - proyecto conjunto',
          completedDate: new Date().toISOString().split('T')[0],
          credits: 'Joint project con Dragon Scan - traducción colaborativa'
        },
        {
          mangaId: testManga2Id,
          mangaTitle: 'Manga Joint Collab - Test',
          chapter: '1',
          type: 'proofreading',
          status: 'completado',
          assignedTo: 'user4',
          assignedToName: 'Ana Martín',
          driveLink: 'https://drive.google.com/drive/folders/joint1',
          notes: 'Joint proofreading con Dragon Scan',
          completedDate: new Date().toISOString().split('T')[0]
        },
        {
          mangaId: testManga2Id,
          mangaTitle: 'Manga Joint Collab - Test',
          chapter: '1',
          type: 'typesetting',
          status: 'completado',
          assignedTo: 'user5',
          assignedToName: 'Jorge Silva',
          driveLink: 'https://drive.google.com/drive/folders/joint1',
          notes: 'Typesetting colaborativo Dragon Scan',
          completedDate: new Date().toISOString().split('T')[0]
        },
        // Segundo capítulo del manga joint
        {
          mangaId: testManga2Id,
          mangaTitle: 'Manga Joint Collab - Test',
          chapter: '2',
          type: 'traduccion',
          status: 'completado',
          assignedTo: userProfile.uid,
          assignedToName: userProfile.name,
          driveLink: 'https://drive.google.com/drive/folders/joint2',
          notes: 'Team up con Phoenix Fansub translation project',
          completedDate: new Date().toISOString().split('T')[0]
        },
        {
          mangaId: testManga2Id,
          mangaTitle: 'Manga Joint Collab - Test',
          chapter: '2',
          type: 'revision',
          status: 'completado',
          assignedTo: 'user6',
          assignedToName: 'Laura Vega',
          driveLink: 'https://drive.google.com/drive/folders/joint2',
          notes: 'Revisión joint con Phoenix Fansub',
          completedDate: new Date().toISOString().split('T')[0]
        }
      ];
      
      // Crear las asignaciones
      for (const assignment of testAssignments) {
        await realtimeService.createAssignment(assignment);
      }
      
      //  message removed for production
      
      // Recargar datos
      await loadAvailableChapters();
      
    } catch (error) {
      //  message removed for production
    } finally {
      setLoading(false);
    }
  };

  // Renderizar vista de selección
  const renderSelectionView = () => (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header mejorado */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={700} sx={{ mb: 2, color: 'primary.main' }}>
          📚 Panel de Uploads
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: '800px', mx: 'auto' }}>
          Gestiona los uploads de capítulos completados. Selecciona los capítulos listos para subir y procede con el flujo de maquetado.
        </Typography>
        
        {savedProgress && (
          <Alert 
            severity="info" 
            sx={{ mb: 3, maxWidth: '600px', mx: 'auto' }}
            action={
              <Button color="inherit" onClick={resumeProgress} variant="outlined" size="small">
                Retomar
              </Button>
            }
          >
            <Typography variant="body2" fontWeight={600}>
              Progreso guardado disponible
            </Typography>
            <Typography variant="body2">
              Guardado el {new Date(savedProgress.lastSaved).toLocaleString()}
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Controles de vista */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Modo de Visualización
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant={!showAllChapters ? 'contained' : 'outlined'}
                onClick={() => setShowAllChapters(false)}
                size="small"
              >
                Solo Más Antiguos
              </Button>
              <Button
                variant={showAllChapters ? 'contained' : 'outlined'}
                onClick={() => setShowAllChapters(true)}
                size="small"
              >
                Todos los Capítulos
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Lista de capítulos disponibles */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {showAllChapters ? 
              `Todos los Capítulos Disponibles (${allCompletedChapters.length})` : 
              `Capítulos Más Antiguos por Serie (${availableChapters.length})`
            }
          </Typography>
          
          {!showAllChapters && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Mostrando solo el capítulo más antiguo de cada serie. Usa "Todos los Capítulos" para ver múltiples capítulos por serie.
            </Typography>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <LinearProgress sx={{ width: '100%' }} />
            </Box>
          ) : availableChapters.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                📋 No hay capítulos listos para subir
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Todos los capítulos disponibles ya han sido subidos o aún están en proceso de completado.
              </Typography>
              <Alert severity="info" sx={{ maxWidth: '500px', mx: 'auto' }}>
                Los capítulos aparecerán aquí automáticamente cuando todas sus tareas estén completadas o aprobadas.
              </Alert>
            </Box>
          ) : (
            showAllChapters ? (
              // Vista completa agrupada por serie
              <Box>
                {(() => {
                  // Agrupar capítulos por serie para mostrar
                  const seriesGroups = {};
                  allCompletedChapters.forEach(chapter => {
                    if (!seriesGroups[chapter.mangaId]) {
                      seriesGroups[chapter.mangaId] = {
                        manga: chapter.manga,
                        mangaTitle: chapter.mangaTitle,
                        isJoint: false,
                        chapters: []
                      };
                    }
                    seriesGroups[chapter.mangaId].chapters.push(chapter);
                    if (chapter.isJoint) {
                      seriesGroups[chapter.mangaId].isJoint = true;
                    }
                  });
                  
                  return Object.values(seriesGroups).map((seriesGroup, seriesIndex) => (
                    <Box key={seriesGroup.manga?.id || seriesIndex} sx={{ mb: 4 }}>
                      {/* Encabezado de serie */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Avatar 
                          src={seriesGroup.manga?.coverImage} 
                          sx={{ width: 60, height: 80, mr: 2, borderRadius: 1 }}
                          variant="rounded"
                        >
                          {seriesGroup.mangaTitle?.charAt(0) || 'M'}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                            {seriesGroup.mangaTitle}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip 
                              label={`${seriesGroup.chapters.length} capítulos`} 
                              size="small" 
                              color="info" 
                              variant="outlined"
                            />
                            {seriesGroup.isJoint && (
                              <Chip 
                                label="Joint" 
                                size="small" 
                                color="warning" 
                                variant="filled"
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Lista de capítulos de la serie */}
                      <List sx={{ pl: 4 }}>
                        {seriesGroup.chapters.map((chapter, chapterIndex) => {
                          const isSelected = selectedChapters.some(c => 
                            c.mangaId === chapter.mangaId && c.chapter === chapter.chapter
                          );
                          
                          return (
                            <ListItem 
                              key={`${chapter.mangaId}-${chapter.chapter}`}
                              sx={{ 
                                border: '1px solid',
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                borderRadius: 2,
                                mb: 1,
                                bgcolor: isSelected ? 'primary.light' : 'background.paper',
                                color: isSelected ? 'primary.contrastText' : 'text.primary'
                              }}
                            >
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={(e) => handleChapterSelection(chapter, e.target.checked)}
                                    sx={{ color: isSelected ? 'primary.contrastText' : 'primary.main' }}
                                  />
                                }
                                label=""
                                sx={{ mr: 2 }}
                              />
                              
                              <ListItemText
                                primary={`Capítulo ${chapter.chapter}${chapter.isJoint ? ` - Joint (${chapter.jointPartner || 'Otro Scan'})` : ''}`}
                                secondary={`${chapter.assignments.length} asignación(es) completada(s) • Tipos: ${chapter.assignments.map(a => a.type).join(', ')}`}
                              />
                              
                              <IconButton
                                onClick={() => window.open(chapter.driveLink, '_blank')}
                                disabled={!chapter.driveLink}
                              >
                                <LinkIcon />
                              </IconButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  ));
                })()}
              </Box>
            ) : (
              // Vista simplificada con series agrupadas
              <List>
                {availableChapters.map((chapter, index) => {
                  const isSelected = selectedChapters.some(c => 
                    c.mangaId === chapter.mangaId && c.chapter === chapter.chapter
                  );
                  
                  return (
                    <ListItem 
                      key={`${chapter.mangaId}-${chapter.chapter}`}
                      sx={{ 
                        border: '1px solid',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        mb: 2,
                        bgcolor: isSelected ? 'primary.light' : 'background.paper',
                        color: isSelected ? 'primary.contrastText' : 'text.primary'
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleChapterSelection(chapter, e.target.checked)}
                            sx={{ color: isSelected ? 'primary.contrastText' : 'primary.main' }}
                          />
                        }
                        label=""
                        sx={{ mr: 2 }}
                      />
                      
                      <Avatar 
                        src={chapter.manga?.coverImage} 
                        sx={{ mr: 2, width: 50, height: 60, borderRadius: 1 }}
                        variant="rounded"
                      >
                        {chapter.manga?.title?.charAt(0) || 'M'}
                      </Avatar>
                      
                      <ListItemText
                        primary={`${chapter.mangaTitle || chapter.manga?.title} - Cap. ${chapter.chapter}${chapter.isJoint ? ` - Joint (${chapter.jointPartner || 'Otro Scan'})` : ''}${chapter.totalAvailable > 1 ? ` (+${chapter.totalAvailable - 1} más)` : ''}`}
                        secondary={`${chapter.assignments.length} asignación(es) completada(s) • Tipos: ${chapter.assignments.map(a => a.type).join(', ')}`}
                      />
                      
                      <IconButton
                        onClick={() => window.open(chapter.driveLink, '_blank')}
                        disabled={!chapter.driveLink}
                      >
                        <LinkIcon />
                      </IconButton>
                    </ListItem>
                  );
                })}
              </List>
            )
          )}
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAvailableChapters}
            disabled={loading}
          >
            Actualizar Lista
          </Button>
          
          {/* Botones de selección */}
          {(showAllChapters ? allCompletedChapters : availableChapters).length > 0 && (
            <>
              <Button
                variant={areAllSelected() ? "outlined" : "contained"}
                size="small"
                startIcon={<CheckIcon />}
                onClick={areAllSelected() ? handleDeselectAll : handleSelectAll}
                color={areAllSelected() ? "secondary" : "primary"}
              >
                {areAllSelected() ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </Button>
            </>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            {selectedChapters.length} capítulo(s) seleccionado(s)
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<StartIcon />}
            onClick={startUploadFlow}
            disabled={selectedChapters.length === 0}
          >
            Iniciar Maquetado
          </Button>
        </Box>
      </Box>
    </Container>
  );

  // Renderizar vista de maquetado
  const renderLayoutView = () => {
    const currentChapter = selectedChapters[currentChapterIndex];
    const progress = ((currentChapterIndex + 1) / selectedChapters.length) * 100;
    const checklistCompleted = Object.values(layoutChecklist).every(v => v);

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Progress Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
            🎨 Maquetado de Capítulos
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                Capítulo {currentChapterIndex + 1} de {selectedChapters.length}
              </Typography>
              <Typography variant="body2">
                {Math.round(progress)}% completado
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        </Box>

        {/* Información del capítulo actual */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h5" fontWeight={600}>
                {currentChapter.mangaTitle} - Capítulo {currentChapter.chapter}
              </Typography>
              {currentChapter.isJoint && (
                <Chip 
                  label={`Joint con ${currentChapter.jointPartner || 'Otro Scan'}`}
                  color="warning" 
                  variant="filled"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  📁 Link de Drive:
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<LinkIcon />}
                  onClick={() => window.open(currentChapter.driveLink, '_blank')}
                  fullWidth
                >
                  Abrir en Drive
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  👥 Asignaciones completadas:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {currentChapter.assignments.map((assignment, i) => (
                    <Chip
                      key={i}
                      label={assignment.type}
                      size="small"
                      color="success"
                      icon={<CompleteIcon />}
                    />
                  ))}
                </Box>
              </Grid>
              
              {/* Créditos de usuarios que trabajaron */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  👤 Usuarios que trabajaron en este capítulo:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {currentChapter.chapterCredits?.users?.map((user, i) => (
                    <Chip
                      key={i}
                      label={user}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  ))}
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Total: {currentChapter.chapterCredits?.users?.length || 0} colaboradores
                  {currentChapter.chapterCredits?.roles && (
                    ` • Roles: ${currentChapter.chapterCredits.roles.join(', ')}`
                  )}
                </Typography>
              </Grid>
              
              {currentChapter.credits && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    📝 Notas adicionales:
                  </Typography>
                  <TextField
                    multiline
                    rows={3}
                    value={currentChapter.credits}
                    fullWidth
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Checklist de maquetado */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <CheckIcon sx={{ mr: 1 }} />
              Checklist de Maquetado
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                📋 **Antes de continuar, asegúrate de que:**
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <Box component="li">El capítulo esté completamente maquetado</Box>
                <Box component="li">No haya errores de ortografía o tipografía</Box>
                <Box component="li">Las páginas estén en el orden correcto</Box>
                {currentChapter.isJoint && (
                  <Box component="li" sx={{ fontWeight: 600, color: 'warning.main' }}>
                    ⚠️ Los créditos incluyan a {currentChapter.jointPartner}
                  </Box>
                )}
              </Box>
            </Alert>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={layoutChecklist.hasCreditsPage}
                    onChange={(e) => setLayoutChecklist(prev => ({
                      ...prev,
                      hasCreditsPage: e.target.checked
                    }))}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box>✨ El capítulo tiene hoja de créditos</Box>
                    {currentChapter.isJoint && <Chip label="Joint" size="small" color="warning" />}
                  </Box>
                }
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={layoutChecklist.hasScanNotices}
                    onChange={(e) => setLayoutChecklist(prev => ({
                      ...prev,
                      hasScanNotices: e.target.checked
                    }))}
                    color="primary"
                  />
                }
                label="🏷️ El capítulo tiene los avisos del scan"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={layoutChecklist.everythingCorrect}
                    onChange={(e) => setLayoutChecklist(prev => ({
                      ...prev,
                      everythingCorrect: e.target.checked
                    }))}
                    color="primary"
                  />
                }
                label="✅ Todo está correcto y listo para subir"
              />
              
              {checklistCompleted && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight={600}>
                    ✅ ¡Perfecto! El capítulo está listo para ser marcado como subido.
                    {currentChapter.isJoint && (
                      <Box component="span" sx={{ display: 'block', mt: 1, color: 'warning.main' }}>
                        🤝 Recuerda que este es un joint con {currentChapter.jointPartner}
                      </Box>
                    )}
                  </Typography>
                </Alert>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Botones de navegación */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={saveProgressSuccess ? "contained" : "outlined"}
              color={saveProgressSuccess ? "success" : "primary"}
              startIcon={
                saveProgressLoading ? (
                  <CircularProgress size={16} sx={{ color: 'inherit' }} />
                ) : saveProgressSuccess ? (
                  <CheckIcon />
                ) : (
                  <SaveIcon />
                )
              }
              onClick={saveProgress}
              disabled={saveProgressLoading}
              sx={{
                minWidth: '160px', // Mantener ancho constante para evitar saltos
                transition: 'all 0.3s ease-in-out'
              }}
            >
              {saveProgressLoading ? (
                "Guardando..."
              ) : saveProgressSuccess ? (
                "¡Guardado!"
              ) : (
                "Guardar Progreso"
              )}
            </Button>
            
            {currentChapterIndex > 0 && (
              <Button
                variant="outlined"
                startIcon={<PrevIcon />}
                onClick={() => setCurrentChapterIndex(prev => prev - 1)}
              >
                Anterior
              </Button>
            )}
          </Box>
          
          <Button
            variant="contained"
            size="large"
            endIcon={<NextIcon />}
            onClick={completeCurrentChapter}
            disabled={!checklistCompleted || loading}
          >
            {currentChapterIndex === selectedChapters.length - 1 ? 'Finalizar Uploads' : 'Siguiente Capítulo'}
          </Button>
        </Box>
      </Container>
    );
  };

  // Estado para el modal de reporte detallado
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  
  // Función para exportar reporte como JSON
  const exportReport = () => {
    if (!uploadReport) return;
    
    const reportData = {
      ...uploadReport,
      generatedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      exportedBy: userProfile.name
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `upload-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // Función para compartir reporte
  const shareReport = async () => {
    if (!uploadReport) return;
    
    const shareText = `🎉 Upload completado!

📊 Resumen:
• ${uploadReport.totalChapters} capítulos subidos
• Fecha: ${new Date(uploadReport.uploadDate).toLocaleDateString()}

Capítulos:
${uploadReport.chapters.map(ch => `• ${ch.mangaTitle} - Cap. ${ch.chapter}`).join('\n')}

#MangaUpload #Scanlation`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Reporte de Upload',
          text: shareText
        });
      } catch (error) {
        //  message removed for production
        // Fallback: copiar al portapapeles
        navigator.clipboard.writeText(shareText);
      }
    } else {
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(shareText);
        // Aquí podrías mostrar una notificación de éxito
      } catch (error) {
        //  message removed for production
      }
    }
  };
  
  // Renderizar reporte final
  const renderReportView = () => {
    if (!uploadReport) return null;
    
    const jointChapters = selectedChapters.filter(ch => ch.isJoint);
    const normalChapters = selectedChapters.filter(ch => !ch.isJoint);
    const uniqueMangas = [...new Set(selectedChapters.map(ch => ch.mangaId))];
    const totalUsers = [...new Set(selectedChapters.flatMap(ch => ch.chapterCredits?.users || []))];
    
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CompleteIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h3" fontWeight={700} color="success.main" sx={{ mb: 2 }}>
            ¡Uploads Completados!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Has subido exitosamente {uploadReport.totalChapters} capítulos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completado el {new Date(uploadReport.uploadDate).toLocaleString()} por {uploadReport.uploaderName}
          </Typography>
        </Box>

        {/* Estadísticas principales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h3" fontWeight={700}>
                {uploadReport.totalChapters}
              </Typography>
              <Typography variant="body2">
                Capítulos Subidos
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="h3" fontWeight={700}>
                {uniqueMangas.length}
              </Typography>
              <Typography variant="body2">
                Series Actualizadas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <Typography variant="h3" fontWeight={700}>
                {jointChapters.length}
              </Typography>
              <Typography variant="body2">
                Capítulos Joint
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
              <Typography variant="h3" fontWeight={700}>
                {totalUsers.length}
              </Typography>
              <Typography variant="body2">
                Colaboradores
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Desglose por tipo */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Capítulos normales */}
          {normalChapters.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    📚 Capítulos Normales ({normalChapters.length})
                  </Typography>
                  <List dense>
                    {normalChapters.map((chapter, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <Avatar src={chapter.manga?.coverImage} sx={{ width: 32, height: 32, mr: 2, borderRadius: 1 }}>
                          {chapter.mangaTitle?.charAt(0) || 'M'}
                        </Avatar>
                        <ListItemText
                          primary={`${chapter.mangaTitle} - Cap. ${chapter.chapter}`}
                          secondary={`${chapter.assignments.length} asignaciones • ${chapter.chapterCredits?.users?.length || 0} usuarios`}
                        />
                        <IconButton
                          size="small"
                          onClick={() => window.open(chapter.driveLink, '_blank')}
                        >
                          <LinkIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Capítulos joint */}
          {jointChapters.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    🤝 Capítulos Joint ({jointChapters.length})
                  </Typography>
                  <List dense>
                    {jointChapters.map((chapter, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <Avatar src={chapter.manga?.coverImage} sx={{ width: 32, height: 32, mr: 2, borderRadius: 1 }}>
                          {chapter.mangaTitle?.charAt(0) || 'M'}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {chapter.mangaTitle} - Cap. {chapter.chapter}
                              </Typography>
                              <Chip 
                                label={chapter.jointPartner || 'Joint'} 
                                size="small" 
                                color="warning" 
                                variant="outlined"
                                sx={{ fontSize: '0.6rem', height: 16 }}
                              />
                            </Box>
                          }
                          secondary={`${chapter.assignments.length} asignaciones • ${chapter.chapterCredits?.users?.length || 0} usuarios`}
                        />
                        <IconButton
                          size="small"
                          onClick={() => window.open(chapter.driveLink, '_blank')}
                        >
                          <LinkIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Colaboradores */}
        {totalUsers.length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                👥 Colaboradores en este Upload
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {totalUsers.map((user, index) => (
                  <Chip
                    key={index}
                    label={user}
                    size="medium"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<ReportIcon />}
            onClick={() => setShowDetailedReport(true)}
          >
            Ver Reporte Detallado
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<SaveIcon />}
            onClick={exportReport}
          >
            Exportar JSON
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            onClick={shareReport}
          >
            Compartir
          </Button>
          
          <Button
            variant="text"
            size="large"
            onClick={resetFlow}
            sx={{ ml: 2 }}
          >
            Nuevo Upload
          </Button>
        </Box>

        {/* Modal de reporte detallado */}
        <Dialog
          open={showDetailedReport}
          onClose={() => setShowDetailedReport(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            📋 Reporte Detallado de Upload
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📊 Información General
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">ID del Reporte:</Typography>
                  <Typography variant="body1" fontFamily="monospace">{uploadReport.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Fecha de Upload:</Typography>
                  <Typography variant="body1">{new Date(uploadReport.uploadDate).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Usuario:</Typography>
                  <Typography variant="body1">{uploadReport.uploaderName}</Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" sx={{ mb: 2 }}>
              📚 Detalle por Capítulo
            </Typography>
            <List>
              {selectedChapters.map((chapter, index) => (
                <ListItem key={index} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {chapter.mangaTitle} - Capítulo {chapter.chapter}
                        </Typography>
                        {chapter.isJoint && (
                          <Chip 
                            label={`Joint (${chapter.jointPartner})`} 
                            size="small" 
                            color="warning"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          📁 Drive: {chapter.driveLink}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          👥 Colaboradores: {chapter.chapterCredits?.users?.join(', ') || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          🔧 Tipos: {chapter.chapterCredits?.roles?.join(', ') || 'N/A'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDetailedReport(false)}>
              Cerrar
            </Button>
            <Button variant="contained" onClick={exportReport}>
              Exportar Detallado
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  };

  // Render principal
  if (currentWorkflow === 'layout') {
    return renderLayoutView();
  }
  
  if (currentWorkflow === 'report') {
    return renderReportView();
  }
  
  return renderSelectionView();
};

export default NewUploadsPanel;
