import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

// Configuración base para tours de páginas
const basePageConfig = {
  showProgress: true,
  showButtons: ['next', 'previous', 'close'],
  nextBtnText: 'Siguiente',
  prevBtnText: 'Anterior',
  doneBtnText: 'Finalizar',
  closeBtnText: '×',
  stagePadding: 10,
  stageRadius: 8,
  animate: true,
  overlayClickNext: false,
  smoothScroll: true,
  allowClose: true,
  overlayOpacity: 0.3,
  onDestroyed: () => {
    localStorage.setItem('page_tour_completed_' + window.location.pathname, 'true');
  }
};

// Tours específicos por página
const pageTours = {
  '/profile': [
    {
      popover: {
        title: '¡Bienvenido a tu Perfil! 👤',
        description: 'Aquí puedes personalizar tu información personal, cambiar tu imagen de perfil y ver tus estadísticas. Te mostraremos las características principales.',
        position: 'center'
      }
    },
    {
      element: '[data-tour="profile-avatar"]',
      popover: {
        title: 'Tu Avatar 🖼️',
        description: 'Esta es tu imagen de perfil actual. Puedes cambiarla editando el campo "URL de imagen de perfil" más abajo.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="profile-edit-button"]',
      popover: {
        title: 'Editar Perfil ✏️',
        description: 'Haz clic aquí para editar tu información personal. Podrás cambiar tu nombre, imagen de perfil y contraseña.',
        position: 'left'
      }
    },
    {
      element: '[data-tour="profile-image-field"]',
      popover: {
        title: 'Cambiar Imagen de Perfil 🔗',
        description: 'Pega aquí la URL de tu nueva imagen. ¡Pro tip: Puedes encontrar imágenes geniales en pfps.gg! Solo copia la URL de la imagen que te guste.',
        position: 'top'
      }
    },
    {
      popover: {
        title: 'Consejo: Encuentra la Imagen Perfecta 🎨',
        description: '💡 Ve a <strong>pfps.gg</strong> para encontrar imágenes de perfil increíbles.<br/>📱 Haz clic derecho en cualquier imagen → "Copiar dirección de imagen"<br/>📋 Pega la URL en el campo anterior',
        position: 'center'
      }
    },
    {
      element: '[data-tour="profile-stats"]',
      popover: {
        title: 'Tus Estadísticas 📊',
        description: 'Aquí puedes ver un resumen de tu actividad: total de asignaciones, asignaciones activas y completadas.',
        position: 'left'
      }
    },
    {
      element: '[data-tour="recent-assignments"]',
      popover: {
        title: 'Actividad Reciente 📋',
        description: 'Esta sección muestra tus asignaciones más recientes y su estado actual.',
        position: 'top'
      }
    }
  ],

  '/assignments': [
    {
      popover: {
        title: '¡Panel de Asignaciones! 📋',
        description: 'Desde aquí puedes gestionar todas las asignaciones de traducción y edición. Te mostremos las funcionalidades principales.',
        position: 'center'
      }
    },
    {
      element: '[data-tour="create-assignment-button"]',
      popover: {
        title: 'Crear Nueva Asignación ➕',
        description: 'Haz clic aquí para crear una nueva asignación de trabajo. Podrás especificar el tipo, usuario asignado, fechas y más detalles.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="assignments-filter"]',
      popover: {
        title: 'Filtros de Búsqueda 🔍',
        description: 'Usa estos filtros para encontrar asignaciones específicas por estado, tipo de trabajo o usuario asignado.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="assignments-list"]',
      popover: {
        title: 'Lista de Asignaciones 📝',
        description: 'Aquí se muestran todas las asignaciones. Puedes ver el estado, tipo de trabajo, persona asignada y fechas importantes.',
        position: 'top'
      }
    },
    {
      element: '[data-tour="assignment-actions"]',
      popover: {
        title: 'Acciones de Asignación ⚙️',
        description: 'Para cada asignación puedes ver detalles, editarla, cambiar su estado o eliminarla según tus permisos.',
        position: 'left'
      }
    }
  ],

  '/myworks': [
    {
      popover: {
        title: '¡Mis Trabajos! 💼',
        description: 'Aquí encontrarás todas las tareas asignadas específicamente a ti. Es tu espacio personal de trabajo.',
        position: 'center'
      }
    },
    {
      element: '[data-tour="work-filters"]',
      popover: {
        title: 'Filtrar Trabajos 🎯',
        description: 'Utiliza estos filtros para organizar tus trabajos por estado: pendientes, en progreso, completados, etc.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="work-item"]',
      popover: {
        title: 'Elemento de Trabajo 📄',
        description: 'Cada tarjeta muestra información importante: título del manga, capítulo, tipo de trabajo, estado y fecha límite.',
        position: 'top'
      }
    },
    {
      element: '[data-tour="work-progress"]',
      popover: {
        title: 'Indicador de Progreso ⏳',
        description: 'Los colores y estados te ayudan a identificar rápidamente qué trabajos necesitan atención inmediata.',
        position: 'left'
      }
    },
    {
      element: '[data-tour="work-actions"]',
      popover: {
        title: 'Acciones de Trabajo ✅',
        description: 'Puedes marcar trabajos como completados, ver detalles adicionales o actualizar su estado desde aquí.',
        position: 'right'
      }
    }
  ],

  '/reviews': [
    {
      popover: {
        title: '¡Panel de Revisiones! ✅',
        description: 'Como jefe, aquí puedes revisar y aprobar el trabajo completado por tu equipo. Mantén la calidad alta.',
        position: 'center'
      }
    },
    {
      element: '[data-tour="pending-reviews"]',
      popover: {
        title: 'Revisiones Pendientes ⏰',
        description: 'Esta sección muestra todos los trabajos que esperan tu aprobación, organizados por prioridad y fecha.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="review-item"]',
      popover: {
        title: 'Elemento de Revisión 📋',
        description: 'Para cada trabajo puedes ver quién lo completó, cuándo y todos los detalles necesarios para tu revisión.',
        position: 'top'
      }
    },
    {
      element: '[data-tour="review-actions"]',
      popover: {
        title: 'Acciones de Revisión 🔍',
        description: 'Puedes aprobar el trabajo, rechazarlo con comentarios o solicitar cambios específicos al autor.',
        position: 'left'
      }
    },
    {
      element: '[data-tour="review-stats"]',
      popover: {
        title: 'Estadísticas de Revisión 📊',
        description: 'Mantén un ojo en las métricas: trabajos revisados, tiempo promedio de revisión y tasa de aprobación.',
        position: 'right'
      }
    }
  ],

  '/series-management': [
    {
      popover: {
        title: '¡Gestión de Series! 📚',
        description: 'Desde aquí puedes administrar todas las series de manga y novelas, ver su progreso y organizar los proyectos.',
        position: 'center'
      }
    },
    {
      element: '[data-tour="add-series-button"]',
      popover: {
        title: 'Agregar Nueva Serie ➕',
        description: 'Crea una nueva serie añadiendo información básica como título, género, descripción y configuración inicial.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="series-grid"]',
      popover: {
        title: 'Lista de Series 📖',
        description: 'Todas las series activas se muestran aquí con información clave: progreso, último capítulo, estado y miembros del equipo.',
        position: 'top'
      }
    },
    {
      element: '[data-tour="series-card"]',
      popover: {
        title: 'Tarjeta de Serie 🎴',
        description: 'Cada serie muestra su portada, título, progreso general y acciones rápidas para gestionar capítulos.',
        position: 'center'
      }
    },
    {
      element: '[data-tour="series-progress"]',
      popover: {
        title: 'Progreso de Serie ⚡',
        description: 'Las barras de progreso muestran el avance en traducción, edición y publicación para cada serie.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="series-actions"]',
      popover: {
        title: 'Gestionar Serie ⚙️',
        description: 'Accede a opciones avanzadas: editar información, gestionar capítulos, asignar equipo o archivar serie.',
        position: 'left'
      }
    }
  ]
};

class PageTourService {
  constructor() {
    this.currentDriver = null;
  }

  // Verificar si el usuario ya vio el tour de esta página
  hasSeenPageTour(pathname) {
    return localStorage.getItem('page_tour_completed_' + pathname) === 'true';
  }

  // Marcar tour como completado para la página actual
  markPageTourCompleted(pathname) {
    localStorage.setItem('page_tour_completed_' + pathname, 'true');
  }

  // Resetear tour de página (para testing)
  resetPageTour(pathname) {
    localStorage.removeItem('page_tour_completed_' + pathname);
  }

  // Filtrar pasos disponibles según elementos presentes
  filterAvailableSteps(steps) {
    return steps.filter(step => {
      if (!step.element) return true; // Pasos sin elemento específico siempre se muestran
      const element = document.querySelector(step.element);
      return element && element.offsetParent !== null;
    });
  }

  // Inicializar tour para una página específica
  initPageTour(pathname) {
    const allSteps = pageTours[pathname];
    if (!allSteps) {
      console.warn('No hay tour definido para la página:', pathname);
      return null;
    }

    const availableSteps = this.filterAvailableSteps(allSteps);
    if (availableSteps.length === 0) {
      console.warn('No hay elementos disponibles para el tour de la página:', pathname);
      return null;
    }

    this.currentDriver = driver({
      ...basePageConfig,
      steps: availableSteps,
      onDestroyStarted: () => {
        if (!this.currentDriver.hasNextStep() || window.confirm('¿Seguro que quieres salir del tour?')) {
          this.currentDriver.destroy();
        }
      }
    });

    return this.currentDriver;
  }

  // Iniciar tour de página
  startPageTour(pathname = window.location.pathname) {
    // No mostrar automáticamente si ya lo vio
    if (this.hasSeenPageTour(pathname)) {
      return false;
    }

    const driver = this.initPageTour(pathname);
    if (driver) {
      // Pequeño delay para que la página termine de cargar
      setTimeout(() => {
        driver.drive();
      }, 1000);
      return true;
    }
    return false;
  }

  // Forzar inicio de tour (manual)
  forceStartPageTour(pathname = window.location.pathname) {
    const driver = this.initPageTour(pathname);
    if (driver) {
      driver.drive();
      return true;
    }
    return false;
  }

  // Destruir tour actual
  destroyCurrentTour() {
    if (this.currentDriver) {
      this.currentDriver.destroy();
      this.currentDriver = null;
    }
  }

  // Verificar si hay tour disponible para la página
  isPageTourAvailable(pathname) {
    return !!pageTours[pathname];
  }

  // Obtener lista de páginas con tour disponible
  getAvailablePageTours() {
    return Object.keys(pageTours);
  }
}

// Exportar instancia singleton
export const pageTourService = new PageTourService();
export default PageTourService;
