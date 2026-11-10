import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  TextField,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  PlayArrowRounded as StartIcon,
  Check as CheckIcon,
  CheckCircle as CompleteIcon,
  OpenInNew as OpenInNewIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  SaveOutlined as SaveIcon,
  Refresh as RefreshIcon,
  CloudDoneOutlined as EmptyIcon,
  HandshakeOutlined as JointIcon,
  ReplayRounded as ResumeIcon,
  FileDownloadOutlined as DownloadIcon,
  ShareOutlined as ShareIcon,
  ListAltOutlined as DetailIcon,
} from '@mui/icons-material';
import { realtimeService } from '../services/realtimeService';
import { useAuth } from '../contexts/AuthContextSimple';
import { Panel, EmptyState, MeterBar, TaskTypeTag } from './ui';
import PressIconButton from './motion/PressIconButton';
import { triggerHaptic } from '../hooks/useWebHaptics';
import notify from '../utils/notify';
import { ASSIGNMENT_TYPES } from '../utils/constants';
import { colors, radius, rowDivider, withAlpha } from '../theme/tokens';

// Nombre visible de una tarea (las claves internas no se enseñan).
const taskLabel = (key) => ASSIGNMENT_TYPES[key]?.label || key;

const mutedButtonSx = { color: colors.onSurfaceVariant };

// Etiqueta pequeña: neutra, o con tono (texto en el tono, fondo al 10 %).
const Tag = ({ children, tone }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      height: 22,
      px: 0.875,
      borderRadius: `${radius.md}px`,
      fontSize: '0.6875rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      flexShrink: 0,
      color: tone || colors.onSurfaceVariant,
      backgroundColor: tone ? withAlpha(tone, 0.1) : colors.surfaceHigh,
    }}
  >
    {children}
  </Box>
);

const Cover = ({ src, title, width = 34, height = 48 }) => (
  <Avatar
    src={src || undefined}
    alt=""
    variant="rounded"
    sx={{ width, height, borderRadius: `${radius.sm}px`, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}
  >
    {(title || '?').charAt(0)}
  </Avatar>
);

// Enlace a la carpeta de Drive del capítulo (o un aviso si no hay).
const DriveButton = ({ href, label }) =>
  href ? (
    <Tooltip title="Abrir en Drive">
      <IconButton component="a" href={href} target="_blank" rel="noopener noreferrer" size="small" aria-label={`Abrir ${label} en Drive`}>
        <OpenInNewIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Tooltip>
  ) : (
    <Tooltip title="Sin carpeta de Drive">
      <span>
        <IconButton size="small" disabled aria-label="Sin carpeta de Drive">
          <OpenInNewIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </span>
    </Tooltip>
  );

// Barra de acciones al pie: flota abajo para no perder el botón principal en listas largas.
const ActionBar = ({ children, floating = false }) => (
  <Box
    sx={{
      position: 'sticky',
      bottom: 16,
      zIndex: 2,
      mt: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 1,
      p: 1.5,
      borderRadius: `${radius.xl}px`,
      backgroundColor: floating ? colors.surfaceHighest : colors.surfaceLow,
      boxShadow: floating ? '0 12px 32px rgba(0, 0, 0, 0.45)' : 'none',
      transition: 'background-color 200ms ease-out, box-shadow 200ms ease-out',
    }}
  >
    {children}
  </Box>
);

const LAYOUT_CHECKS = [
  ['hasCreditsPage', 'Tiene la hoja de créditos'],
  ['hasScanNotices', 'Tiene los avisos del scan'],
  ['everythingCorrect', 'Todo está correcto y listo para subir'],
];

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
      // Starting progress save

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

      // Data validation complete

      // Intentar guardar los datos
      const success = await realtimeService.setData(`uploadProgress/${userProfile.uid}`, cleanProgressData);

      if (success) {
        setSavedProgress(cleanProgressData);
        // Progress saved successfully

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
      notify.error(errorMessage, { duration: 8000 });
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

  const chapterKey = (chapter) => `${chapter.mangaId}-${chapter.chapter}`;
  const isChapterSelected = (chapter) =>
    selectedChapters.some((c) => c.mangaId === chapter.mangaId && c.chapter === chapter.chapter);
  const taskTypesOf = (chapter) => [...new Set((chapter.assignments || []).map((a) => a.type))];

  // Fila seleccionable: toda la fila es la etiqueta del checkbox.
  const renderChapterRow = (chapter, { cover = true, grouped = false } = {}) => {
    const selected = isChapterSelected(chapter);
    const title = chapter.mangaTitle || chapter.manga?.title || 'Serie desconocida';
    return (
      <Box component="li" key={chapterKey(chapter)} sx={{ '&:not(:last-of-type)': { mb: 0.5 } }}>
        <Box
          component="label"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1,
            py: 0.75,
            borderRadius: `${radius.md}px`,
            cursor: 'pointer',
            backgroundColor: selected ? withAlpha(colors.primary, 0.08) : 'transparent',
            transition: 'background-color 150ms ease-out',
            '&:hover': { backgroundColor: selected ? withAlpha(colors.primary, 0.12) : colors.surfaceContainer },
          }}
        >
          <Checkbox
            checked={selected}
            onChange={(e) => {
              triggerHaptic('light');
              handleChapterSelection(chapter, e.target.checked);
            }}
            sx={{ p: 0.75 }}
          />
          {cover && <Cover src={chapter.manga?.coverImage} title={title} />}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Solo se recorta el título de la serie, nunca el número de capítulo */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, minWidth: 0 }}>
              <Typography noWrap component="span" sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.onSurface, minWidth: 0 }}>
                {grouped ? `Capítulo ${chapter.chapter}` : title}
              </Typography>
              {!grouped && (
                <Box component="span" sx={{ flexShrink: 0, fontSize: '0.875rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                  Cap. {chapter.chapter}
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', columnGap: 1.5, rowGap: 0.5, flexWrap: 'wrap', mt: 0.25, fontSize: '0.75rem' }}>
              {chapter.isJoint && <Tag>Joint · {chapter.jointPartner || 'otro grupo'}</Tag>}
              {!grouped && chapter.totalAvailable > 1 && (
                <Box component="span" sx={{ color: colors.onSurfaceVariant }}>
                  y {chapter.totalAvailable - 1} más de esta serie
                </Box>
              )}
              {taskTypesOf(chapter).map((type) => (
                <TaskTypeTag key={type} type={type} />
              ))}
            </Box>
          </Box>
          <DriveButton href={chapter.driveLink} label={`${title}, capítulo ${chapter.chapter}`} />
        </Box>
      </Box>
    );
  };

  // Renderizar vista de selección
  const renderSelectionView = () => {
    const visibleChapters = showAllChapters ? allCompletedChapters : availableChapters;
    const allSelected = areAllSelected();

    // Agrupar por serie para la vista completa
    const seriesGroups = {};
    if (showAllChapters) {
      allCompletedChapters.forEach((chapter) => {
        if (!seriesGroups[chapter.mangaId]) {
          seriesGroups[chapter.mangaId] = {
            manga: chapter.manga,
            mangaTitle: chapter.mangaTitle,
            isJoint: false,
            chapters: [],
          };
        }
        seriesGroups[chapter.mangaId].chapters.push(chapter);
        if (chapter.isJoint) seriesGroups[chapter.mangaId].isJoint = true;
      });
    }

    return (
      <Box>
        {savedProgress && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
              mb: 2,
              p: 2,
              borderRadius: `${radius.xl}px`,
              backgroundColor: withAlpha(colors.primary, 0.08),
            }}
          >
            <ResumeIcon aria-hidden="true" sx={{ color: colors.primary, fontSize: 20 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.onSurface }}>
                Tienes una subida a medias
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant }}>
                Guardada el {new Date(savedProgress.lastSaved).toLocaleString('es-ES')}
              </Typography>
            </Box>
            <Button variant="outlined" onClick={resumeProgress}>
              Retomar
            </Button>
          </Box>
        )}

        <Panel
          title="Listos para subir"
          count={visibleChapters.length}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={showAllChapters ? 'all' : 'oldest'}
                onChange={(e, value) => {
                  if (value !== null) {
                    triggerHaptic('light');
                    setShowAllChapters(value === 'all');
                  }
                }}
                aria-label="Qué capítulos mostrar"
              >
                <ToggleButton value="oldest" sx={{ px: 1.25, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  El más antiguo de cada serie
                </ToggleButton>
                <ToggleButton value="all" sx={{ px: 1.25, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  Todos
                </ToggleButton>
              </ToggleButtonGroup>
              <Tooltip title="Volver a cargar">
                <span>
                  <PressIconButton onClick={loadAvailableChapters} disabled={loading} aria-label="Volver a cargar los capítulos">
                    <RefreshIcon sx={{ fontSize: 20 }} />
                  </PressIconButton>
                </span>
              </Tooltip>
            </Box>
          }
          sx={{ '& > div:first-of-type': { flexWrap: 'wrap' } }}
        >
          {!showAllChapters && availableChapters.length > 0 && (
            <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, mb: 1.5 }}>
              Se sube en orden: aquí solo aparece el capítulo más antiguo de cada serie. Cambia a "Todos" para elegir varios de la misma.
            </Typography>
          )}

          {loading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CircularProgress size={28} aria-label="Cargando capítulos" />
            </Box>
          ) : availableChapters.length === 0 ? (
            <EmptyState icon={EmptyIcon} title="Nada listo para subir">
              Los capítulos aparecen aquí cuando todas sus tareas están completadas o aprobadas.
            </EmptyState>
          ) : showAllChapters ? (
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, mx: -1 }}>
              {Object.values(seriesGroups).map((group, groupIndex) => (
                <Box
                  component="li"
                  key={group.manga?.id || groupIndex}
                  sx={{ '&:not(:last-of-type)': { mb: 1.5, pb: 1.5, borderBottom: `1px solid ${rowDivider}` } }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, mb: 0.75 }}>
                    <Cover src={group.manga?.coverImage} title={group.mangaTitle} width={30} height={42} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography component="h3" noWrap sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.onSurface }}>
                        {group.mangaTitle}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
                        {group.chapters.length} {group.chapters.length === 1 ? 'capítulo' : 'capítulos'}
                        {group.isJoint ? ' · joint' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, pl: { xs: 0, sm: 4 } }}>
                    {group.chapters.map((chapter) => renderChapterRow(chapter, { cover: false, grouped: true }))}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, mx: -1 }}>
              {availableChapters.map((chapter) => renderChapterRow(chapter))}
            </Box>
          )}
        </Panel>

        {visibleChapters.length > 0 && (
          <ActionBar floating={selectedChapters.length > 0}>
            <Button
              startIcon={<CheckIcon />}
              onClick={() => {
                triggerHaptic('light');
                if (allSelected) handleDeselectAll();
                else handleSelectAll();
              }}
              sx={mutedButtonSx}
            >
              {allSelected ? 'Quitar la selección' : 'Seleccionar todos'}
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
              <Typography role="status" sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                {selectedChapters.length === 0
                  ? 'Ninguno elegido'
                  : `${selectedChapters.length} ${selectedChapters.length === 1 ? 'elegido' : 'elegidos'}`}
              </Typography>
              <Button
                variant="contained"
                startIcon={<StartIcon />}
                onClick={() => {
                  triggerHaptic('medium');
                  startUploadFlow();
                }}
                disabled={selectedChapters.length === 0}
              >
                Empezar maquetado
              </Button>
            </Box>
          </ActionBar>
        )}
      </Box>
    );
  };

  // Renderizar vista de maquetado
  const renderLayoutView = () => {
    const currentChapter = selectedChapters[currentChapterIndex];
    const checklistCompleted = Object.values(layoutChecklist).every(v => v);
    const isLast = currentChapterIndex === selectedChapters.length - 1;
    const credits = currentChapter.chapterCredits;

    return (
      <Box>
        {/* Progreso */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: 0.75 }}>
            <Typography component="h2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.onSurface }}>
              Maquetado
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
              Capítulo {currentChapterIndex + 1} de {selectedChapters.length}
            </Typography>
          </Box>
          <MeterBar value={currentChapterIndex + 1} max={selectedChapters.length} />
        </Box>

        {/* Capítulo actual */}
        <Panel sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
            <Cover src={currentChapter.manga?.coverImage} title={currentChapter.mangaTitle} width={52} height={72} />
            <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
              <Typography component="h3" sx={{ fontSize: '1.0625rem', fontWeight: 600, color: colors.onSurface }}>
                {currentChapter.mangaTitle}
                <Box component="span" sx={{ color: colors.onSurfaceVariant, fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>
                  {' '}· Cap. {currentChapter.chapter}
                </Box>
              </Typography>
              {currentChapter.isJoint && (
                <Box sx={{ mt: 0.5 }}>
                  <Tag>Joint con {currentChapter.jointPartner || 'otro grupo'}</Tag>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1, fontSize: '0.8125rem' }}>
                {taskTypesOf(currentChapter).map((type) => (
                  <TaskTypeTag key={type} type={type} />
                ))}
              </Box>
            </Box>
            <Button
              variant="outlined"
              component="a"
              href={currentChapter.driveLink || undefined}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
              disabled={!currentChapter.driveLink}
            >
              Abrir en Drive
            </Button>
          </Box>

          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${rowDivider}` }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.onSurface, mb: 0.75 }}>
              Quién trabajó en el capítulo
            </Typography>
            {credits?.users?.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {credits.users.map((user, i) => (
                  <Tag key={i}>{user}</Tag>
                ))}
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.8125rem', color: colors.outline }}>Sin créditos registrados</Typography>
            )}
            {credits?.roles?.length > 0 && (
              <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, mt: 0.75 }}>
                {credits.users?.length || 0} {credits.users?.length === 1 ? 'persona' : 'personas'} · {credits.roles.map(taskLabel).join(', ')}
              </Typography>
            )}
          </Box>

          {currentChapter.credits && (
            <TextField
              label="Notas"
              multiline
              minRows={2}
              value={currentChapter.credits}
              fullWidth
              InputProps={{ readOnly: true }}
              sx={{ mt: 2 }}
            />
          )}
        </Panel>

        {/* Checklist de maquetado */}
        <Panel title="Antes de marcarlo como subido">
          <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, mb: 1 }}>
            Comprueba que el capítulo está maquetado entero, sin erratas y con las páginas en orden.
          </Typography>
          {currentChapter.isJoint && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontSize: '0.8125rem', color: colors.onSurface }}>
              <JointIcon aria-hidden="true" sx={{ fontSize: 18, color: colors.attention }} />
              Es un joint: los créditos tienen que incluir a {currentChapter.jointPartner || 'el otro grupo'}.
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {LAYOUT_CHECKS.map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={Boolean(layoutChecklist[key])}
                    onChange={(e) => {
                      triggerHaptic('light');
                      setLayoutChecklist((prev) => ({ ...prev, [key]: e.target.checked }));
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: '0.875rem' }}>{label}</Typography>}
              />
            ))}
          </Box>
          <Box
            role="status"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 1,
              minHeight: 24,
              fontSize: '0.8125rem',
              color: colors.onSurface,
              opacity: checklistCompleted ? 1 : 0,
              transition: 'opacity 200ms ease-out',
            }}
          >
            {checklistCompleted && (
              <>
                <CompleteIcon aria-hidden="true" sx={{ fontSize: 18, color: colors.goodNews }} />
                Listo para marcarlo como subido.
              </>
            )}
          </Box>
        </Panel>

        {/* Navegación */}
        <ActionBar floating={checklistCompleted}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={
                saveProgressLoading ? (
                  <CircularProgress size={16} sx={{ color: 'inherit' }} />
                ) : saveProgressSuccess ? (
                  <CheckIcon sx={{ color: colors.goodNews }} />
                ) : (
                  <SaveIcon />
                )
              }
              onClick={saveProgress}
              disabled={saveProgressLoading}
              sx={{ minWidth: 168 }}
            >
              {saveProgressLoading ? 'Guardando…' : saveProgressSuccess ? 'Guardado' : 'Guardar progreso'}
            </Button>
            {currentChapterIndex > 0 && (
              <Button startIcon={<PrevIcon />} onClick={() => setCurrentChapterIndex(prev => prev - 1)} sx={mutedButtonSx}>
                Anterior
              </Button>
            )}
          </Box>
          <Button
            variant="contained"
            endIcon={loading ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <NextIcon />}
            onClick={() => {
              triggerHaptic('medium');
              completeCurrentChapter();
            }}
            disabled={!checklistCompleted || loading}
            sx={{ ml: 'auto' }}
          >
            {isLast ? 'Marcar como subidos' : 'Siguiente capítulo'}
          </Button>
        </ActionBar>
      </Box>
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
        notify.success('Resumen copiado al portapapeles');
      } catch (error) {
        //  message removed for production
      }
    }
  };

  // Renderizar reporte final
  const renderReportView = () => {
    if (!uploadReport) return null;

    const jointChapters = selectedChapters.filter(ch => ch.isJoint);
    const uniqueMangas = [...new Set(selectedChapters.map(ch => ch.mangaId))];
    const totalUsers = [...new Set(selectedChapters.flatMap(ch => ch.chapterCredits?.users || []))];

    const summary = [
      `${uniqueMangas.length} ${uniqueMangas.length === 1 ? 'serie' : 'series'}`,
      jointChapters.length > 0 ? `${jointChapters.length} joint` : null,
      `${totalUsers.length} ${totalUsers.length === 1 ? 'persona' : 'personas'} en los créditos`,
    ].filter(Boolean).join(' · ');

    return (
      <Box>
        <Panel sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <CompleteIcon aria-hidden="true" sx={{ fontSize: 28, color: colors.goodNews, mt: 0.25 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h2" sx={{ fontSize: '1.125rem', fontWeight: 600, color: colors.onSurface }}>
                {uploadReport.totalChapters} {uploadReport.totalChapters === 1 ? 'capítulo subido' : 'capítulos subidos'}
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, mt: 0.25 }}>
                {summary}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, mt: 0.25 }}>
                {new Date(uploadReport.uploadDate).toLocaleString('es-ES')} · {uploadReport.uploaderName}
              </Typography>
            </Box>
          </Box>
        </Panel>

        <Panel title="Capítulos" count={selectedChapters.length} sx={{ mb: 2 }}>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, mx: -1 }}>
            {selectedChapters.map((chapter, index) => (
              <Box
                component="li"
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1,
                  py: 1,
                  '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` },
                }}
              >
                <Cover src={chapter.manga?.coverImage} title={chapter.mangaTitle} width={28} height={40} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                    <Typography noWrap component="span" sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.onSurface, minWidth: 0 }}>
                      {chapter.mangaTitle}
                    </Typography>
                    <Box component="span" sx={{ flexShrink: 0, fontSize: '0.875rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                      Cap. {chapter.chapter}
                    </Box>
                    {chapter.isJoint && (
                      <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                        <Tag>Joint · {chapter.jointPartner || 'otro grupo'}</Tag>
                      </Box>
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
                    {chapter.assignments.length} tareas · {chapter.chapterCredits?.users?.length || 0} personas
                  </Typography>
                </Box>
                <DriveButton href={chapter.driveLink} label={`${chapter.mangaTitle}, capítulo ${chapter.chapter}`} />
              </Box>
            ))}
          </Box>
        </Panel>

        {totalUsers.length > 0 && (
          <Panel title="En los créditos" count={totalUsers.length}>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {totalUsers.map((user, index) => (
                <Tag key={index}>{user}</Tag>
              ))}
            </Box>
          </Panel>
        )}

        <ActionBar>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Button startIcon={<DetailIcon />} onClick={() => setShowDetailedReport(true)} sx={mutedButtonSx}>
              Ver detalle
            </Button>
            <Button startIcon={<DownloadIcon />} onClick={exportReport} sx={mutedButtonSx}>
              Exportar JSON
            </Button>
            <Button startIcon={<ShareIcon />} onClick={shareReport} sx={mutedButtonSx}>
              Compartir
            </Button>
          </Box>
          <Button variant="contained" onClick={resetFlow} sx={{ ml: 'auto' }}>
            Nueva subida
          </Button>
        </ActionBar>

        {/* Detalle completo */}
        <Dialog open={showDetailedReport} onClose={() => setShowDetailedReport(false)} maxWidth="sm" fullWidth scroll="paper">
          <DialogTitle>Detalle de la subida</DialogTitle>
          <DialogContent>
            <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 0.75, m: 0, mb: 2, fontSize: '0.875rem' }}>
              <Box component="dt" sx={{ color: colors.onSurfaceVariant }}>Reporte</Box>
              <Box component="dd" sx={{ m: 0, color: colors.onSurface, fontFamily: 'monospace' }}>{uploadReport.id}</Box>
              <Box component="dt" sx={{ color: colors.onSurfaceVariant }}>Fecha</Box>
              <Box component="dd" sx={{ m: 0, color: colors.onSurface }}>{new Date(uploadReport.uploadDate).toLocaleString('es-ES')}</Box>
              <Box component="dt" sx={{ color: colors.onSurfaceVariant }}>Subió</Box>
              <Box component="dd" sx={{ m: 0, color: colors.onSurface }}>{uploadReport.uploaderName}</Box>
            </Box>

            <Typography component="h3" variant="subtitle2" sx={{ color: colors.onSurface, mb: 0.5 }}>
              Por capítulo
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {selectedChapters.map((chapter, index) => (
                <Box component="li" key={index} sx={{ py: 1.25, '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.onSurface }}>
                      {chapter.mangaTitle} · Capítulo {chapter.chapter}
                    </Typography>
                    {chapter.isJoint && <Tag>Joint · {chapter.jointPartner || 'otro grupo'}</Tag>}
                  </Box>
                  <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 1.5, rowGap: 0.25, m: 0, fontSize: '0.8125rem' }}>
                    <Box component="dt" sx={{ color: colors.onSurfaceVariant }}>Drive</Box>
                    <Box component="dd" sx={{ m: 0, minWidth: 0, overflowWrap: 'anywhere' }}>
                      {chapter.driveLink ? (
                        <Box component="a" href={chapter.driveLink} target="_blank" rel="noopener noreferrer" sx={{ color: colors.primary }}>
                          {chapter.driveLink}
                        </Box>
                      ) : (
                        <Box component="span" sx={{ color: colors.outline }}>Sin carpeta</Box>
                      )}
                    </Box>
                    <Box component="dt" sx={{ color: colors.onSurfaceVariant }}>Personas</Box>
                    <Box component="dd" sx={{ m: 0, color: colors.onSurface }}>{chapter.chapterCredits?.users?.join(', ') || '—'}</Box>
                    <Box component="dt" sx={{ color: colors.onSurfaceVariant }}>Tareas</Box>
                    <Box component="dd" sx={{ m: 0, color: colors.onSurface }}>{chapter.chapterCredits?.roles?.map(taskLabel).join(', ') || '—'}</Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button startIcon={<DownloadIcon />} onClick={exportReport} sx={mutedButtonSx}>
              Exportar JSON
            </Button>
            <Button variant="contained" onClick={() => setShowDetailedReport(false)}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
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
