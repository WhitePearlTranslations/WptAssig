import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { ROLES } from '../contexts/AuthContext';

// Configuración base del driver
const baseConfig = {
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
  disableActiveInteraction: false,
  overlayOpacity: 0.4,
  onDestroyed: () => {
    // Marcar que el usuario ha completado el tour
    localStorage.setItem('tour_completed', 'true');
  },
  onHighlightStarted: (element) => {
    // Asegurar que el elemento sea visible
    if (element) {
      // Añadir una clase especial al elemento resaltado
      element.classList.add('tour-highlighting');
      
      // Scroll suave pero no tan agresivo
      setTimeout(() => {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }, 100);
    }
  },
  onHighlighted: (element) => {
    // Remover la clase cuando termine el resaltado
    if (element) {
      element.classList.remove('tour-highlighting');
    }
  }
};

// Estilos personalizados para el tour
const customStyles = `
  .driver-popover {
    background: rgba(15, 15, 25, 0.95) !important;
    border: 1px solid rgba(99, 102, 241, 0.3) !important;
    border-radius: 16px !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6) !important;
    backdrop-filter: blur(20px) !important;
    color: #f1f5f9 !important;
    z-index: 10002 !important;
    max-width: 320px !important;
  }
  
  @media (max-width: 600px) {
    .driver-popover {
      max-width: 90% !important;
      width: 90% !important;
      margin: 0 auto !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      top: auto !important;
      bottom: 20px !important;
    }
  }
  
  .driver-popover-title {
    color: #6366f1 !important;
    font-weight: 600 !important;
    font-size: 1.1rem !important;
  }
  
  @media (max-width: 600px) {
    .driver-popover-title {
      font-size: 1rem !important;
      padding: 10px 10px 5px !important;
    }
  }
  
  .driver-popover-description {
    color: #e2e8f0 !important;
    line-height: 1.5 !important;
  }
  
  @media (max-width: 600px) {
    .driver-popover-description {
      font-size: 0.9rem !important;
      padding: 0 10px 10px !important;
      line-height: 1.4 !important;
    }
  }
  
  .driver-popover-footer {
    padding: 10px !important;
  }
  
  @media (max-width: 600px) {
    .driver-popover-footer {
      padding: 8px !important;
    }
  }
  
  .driver-popover-next-btn,
  .driver-popover-prev-btn {
    background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
    border: none !important;
    border-radius: 8px !important;
    color: white !important;
    padding: 8px 16px !important;
    font-weight: 500 !important;
    transition: all 0.3s ease !important;
  }
  
  @media (max-width: 600px) {
    .driver-popover-next-btn,
    .driver-popover-prev-btn {
      padding: 6px 12px !important;
      font-size: 0.85rem !important;
    }
  }
  
  .driver-popover-next-btn:hover,
  .driver-popover-prev-btn:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4) !important;
  }
  
  .driver-popover-close-btn {
    color: #94a3b8 !important;
    font-size: 1.2rem !important;
    font-weight: bold !important;
  }
  
  .driver-popover-close-btn:hover {
    color: #ef4444 !important;
  }
  
  .driver-overlay {
    background: rgba(0, 0, 0, 0.4) !important;
    backdrop-filter: none !important;
  }
  
  .driver-highlighted-element {
    box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.9), 0 0 0 12px rgba(99, 102, 241, 0.5) !important;
    border-radius: 12px !important;
    z-index: 10001 !important;
    position: relative !important;
    background: rgba(99, 102, 241, 0.1) !important;
  }
  
  /* Asegurar que los elementos del navbar sean visibles */
  .driver-highlighted-element button,
  .driver-highlighted-element [data-tour] {
    background: rgba(99, 102, 241, 0.2) !important;
    border: 2px solid rgba(99, 102, 241, 0.8) !important;
  }
  
  /* Mejorar la visibilidad y el toque en dispositivos móviles */
  @media (max-width: 600px) {
    .driver-highlighted-element {
      box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.9), 0 0 0 8px rgba(99, 102, 241, 0.5) !important;
    }
    
    .driver-popover-progress-text {
      font-size: 0.7rem !important;
    }
    
    .driver-popover-progress {
      margin-top: 10px !important;
    }
  }
`;

// Inyectar estilos personalizados
const styleElement = document.createElement('style');
styleElement.textContent = customStyles;
document.head.appendChild(styleElement);

// Tours específicos por rol
const tourSteps = {
  [ROLES.ADMIN]: [
    {
      element: '[data-tour="dashboard"]',
      popover: {
        title: '¡Bienvenido, Administrador! 👑',
        description: 'Como administrador, tienes acceso completo a todas las funcionalidades del sistema. Empecemos con el dashboard principal donde puedes ver el resumen de todas las actividades.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="assignments-nav"]',
      popover: {
        title: 'Gestión de Asignaciones 📋',
        description: 'Aquí puedes crear, editar y administrar todas las asignaciones de traducción y edición. Como administrador, puedes asignar trabajos a cualquier miembro del equipo.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="reviews-nav"]',
      popover: {
        title: 'Panel de Revisiones ✅',
        description: 'Centro de control para revisar y aprobar el trabajo completado por editores y traductores. El badge mostrará las revisiones pendientes.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="users-nav"]',
      popover: {
        title: 'Gestión de Usuarios 👥',
        description: 'Administra todos los usuarios del sistema, asigna roles, y controla los permisos de acceso.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="admin-nav"]',
      popover: {
        title: 'Panel de Administración ⚙️',
        description: 'Configuraciones avanzadas del sistema, respaldos, logs y herramientas administrativas especiales.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="series-management-nav"]',
      popover: {
        title: 'Gestión de Series 📚',
        description: 'Administra las series de manga/novelas, sus capítulos y el progreso general de cada proyecto.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="profile-menu"]',
      popover: {
        title: 'Tu Perfil 👤',
        description: 'Accede a tu perfil personal, configuraciones de cuenta y opciones de personalización.',
        position: 'left'
      }
    }
  ],

  [ROLES.JEFE_EDITOR]: [
    {
      element: '[data-tour="dashboard"]',
      popover: {
        title: '¡Bienvenido, Jefe Editor! ✍️',
        description: 'Como jefe editor, supervisas todo el proceso editorial. El dashboard te mostrará el estado de todas las ediciones en progreso.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="assignments-nav"]',
      popover: {
        title: 'Asignaciones de Edición 📝',
        description: 'Aquí puedes crear asignaciones de edición y distribuir el trabajo entre los editores de tu equipo.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="myworks-nav"]',
      popover: {
        title: 'Mis Trabajos 📄',
        description: 'Ve todos tus trabajos asignados y su progreso. Puedes trabajar directamente en las ediciones desde aquí.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="reviews-nav"]',
      popover: {
        title: 'Revisiones de Edición ✅',
        description: 'Revisa y aprueba el trabajo completado por editores. El badge te notificará cuando haya revisiones pendientes.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="series-management-nav"]',
      popover: {
        title: 'Series en Proceso 📖',
        description: 'Monitorea el progreso de edición en todas las series activas.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="profile-menu"]',
      popover: {
        title: 'Tu Perfil 👤',
        description: 'Personaliza tu perfil y revisa tu historial de ediciones.',
        position: 'left'
      }
    }
  ],

  [ROLES.JEFE_TRADUCTOR]: [
    {
      element: '[data-tour="dashboard"]',
      popover: {
        title: '¡Bienvenido, Jefe Traductor! 🌍',
        description: 'Como jefe traductor, lideras el equipo de traducción. El dashboard muestra el estado de todas las traducciones activas.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="assignments-nav"]',
      popover: {
        title: 'Asignaciones de Traducción 🔤',
        description: 'Crea y asigna trabajos de traducción a tu equipo de traductores.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="myworks-nav"]',
      popover: {
        title: 'Mis Trabajos 📝',
        description: 'Accede a todas tus asignaciones de traducción y su estado actual.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="reviews-nav"]',
      popover: {
        title: 'Revisiones de Traducción ✅',
        description: 'Revisa y aprueba las traducciones completadas por tu equipo.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="series-management-nav"]',
      popover: {
        title: 'Progreso de Series 📚',
        description: 'Supervisa el progreso de traducción en todos los proyectos activos.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="profile-menu"]',
      popover: {
        title: 'Tu Perfil 👤',
        description: 'Configura tu perfil y revisa tu historial de traducciones.',
        position: 'left'
      }
    }
  ],

  [ROLES.EDITOR]: [
    {
      element: '[data-tour="dashboard"]',
      popover: {
        title: '¡Bienvenido, Editor! ✏️',
        description: 'Como editor, tu trabajo es pulir y perfeccionar las traducciones. El dashboard muestra tus asignaciones pendientes.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="myworks-nav"]',
      popover: {
        title: 'Mis Trabajos de Edición 📝',
        description: 'Aquí encontrarás todas las ediciones asignadas a ti. Puedes trabajar directamente desde esta sección.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="series-management-nav"]',
      popover: {
        title: 'Series Disponibles 📖',
        description: 'Explora las series disponibles y ve en cuáles estás trabajando actualmente.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="profile-menu"]',
      popover: {
        title: 'Tu Perfil 👤',
        description: 'Gestiona tu perfil personal y revisa tu historial de ediciones completadas.',
        position: 'left'
      }
    }
  ],

  [ROLES.TRADUCTOR]: [
    {
      element: '[data-tour="dashboard"]',
      popover: {
        title: '¡Bienvenido, Traductor! 🌐',
        description: 'Como traductor, eres la primera línea en dar vida a las historias. El dashboard muestra tus proyectos asignados.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="myworks-nav"]',
      popover: {
        title: 'Mis Traducciones 📄',
        description: 'Todas tus asignaciones de traducción están aquí. Puedes ver el progreso y continuar tu trabajo.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="series-management-nav"]',
      popover: {
        title: 'Series en Traducción 📚',
        description: 'Ve las series disponibles y tu progreso en cada una de ellas.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="profile-menu"]',
      popover: {
        title: 'Tu Perfil 👤',
        description: 'Personaliza tu perfil y revisa tu historial de traducciones.',
        position: 'left'
      }
    }
  ],

  [ROLES.UPLOADER]: [
    {
      element: '[data-tour="dashboard"]',
      popover: {
        title: '¡Bienvenido, Uploader! ☁️',
        description: 'Como uploader, eres responsable de gestionar el contenido multimedia. El dashboard muestra el estado de las subidas.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="uploads-nav"]',
      popover: {
        title: 'Centro de Subidas 📤',
        description: 'Tu área principal de trabajo. Aquí puedes subir imágenes, gestionar archivos y organizar el contenido multimedia.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="series-management-nav"]',
      popover: {
        title: 'Series y Contenido 📖',
        description: 'Ve las series para las cuales necesitas gestionar contenido multimedia.',
        position: 'bottom'
      }
    },
    {
      element: '[data-tour="profile-menu"]',
      popover: {
        title: 'Tu Perfil 👤',
        description: 'Configura tu perfil y revisa tu historial de subidas.',
        position: 'left'
      }
    }
  ]
};

class TourService {
  constructor() {
    this.driverObj = null;
    this.currentRole = null;
  }

  // Filtrar pasos disponibles según elementos presentes en el DOM
  filterAvailableSteps(steps) {
    const isMobile = window.innerWidth <= 600;
    
    return steps.filter(step => {
      let element = document.querySelector(step.element);
      
      // Si es móvil y el elemento no está visible, intentar encontrar elementos alternativos
      if ((!element || element.offsetParent === null) && isMobile) {
        // Intentar encontrar el elemento en el drawer móvil
        const selector = step.element;
        const drawerElement = document.querySelector(`.MuiDrawer-paper ${selector}`);
        if (drawerElement && drawerElement.offsetParent !== null) {
          element = drawerElement;
        }
        
        // Si aún no encontramos el elemento, buscar en todo el documento
        if (!element || element.offsetParent === null) {
          const allElements = document.querySelectorAll(selector);
          for (let i = 0; i < allElements.length; i++) {
            if (allElements[i].offsetParent !== null) {
              element = allElements[i];
              break;
            }
          }
        }
      }
      
      return element && element.offsetParent !== null; // Elemento existe y es visible
    });
  }

  // Función para abrir el drawer móvil
  openMobileDrawer() {
    return new Promise((resolve) => {
      // Verificar si el drawer ya está abierto
      const drawer = document.querySelector('.MuiDrawer-paper');
      if (drawer && drawer.offsetParent !== null) {
        resolve();
        return;
      }
      
      // Buscar el botón del menú de diferentes maneras
      let menuButton = null;
      
      // Método 1: Buscar por el testid del icono MenuIcon
      const menuIcon = document.querySelector('svg[data-testid="MenuIcon"]');
      if (menuIcon) {
        menuButton = menuIcon.closest('button');
      }
      
      // Método 2: Buscar por el contenido del path del SVG (icono de hamburguesa)
      if (!menuButton) {
        const allButtons = document.querySelectorAll('.MuiIconButton-root');
        for (let button of allButtons) {
          const svg = button.querySelector('svg');
          if (svg) {
            const paths = svg.querySelectorAll('path');
            for (let path of paths) {
              const d = path.getAttribute('d');
              // Icono de menú de hamburguesa típico de Material-UI
              if (d && d.includes('M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z')) {
                menuButton = button;
                break;
              }
            }
            if (menuButton) break;
          }
        }
      }
      
      // Método 3: Buscar botones en el área del toolbar que solo sean visibles en móvil
      if (!menuButton) {
        const toolbar = document.querySelector('.MuiToolbar-root');
        if (toolbar) {
          const buttons = toolbar.querySelectorAll('.MuiIconButton-root');
          // El botón del menú suele ser el último en móvil
          for (let i = buttons.length - 1; i >= 0; i--) {
            const button = buttons[i];
            const computedStyle = window.getComputedStyle(button);
            // Buscar botones que tengan display flex (visibles) en móvil
            if (computedStyle.display === 'inline-flex' || computedStyle.display === 'flex') {
              menuButton = button;
              break;
            }
          }
        }
      }
      
      if (menuButton) {
        console.log('Abriendo drawer móvil...');
        menuButton.click();
      } else {
        console.warn('No se encontró el botón del menú móvil');
      }
      
      // Esperar a que el drawer se abra completamente
      setTimeout(() => {
        resolve();
      }, 500); // Aumentamos el tiempo para asegurar que se abra
    });
  }

  // Inicializar el tour según el rol del usuario
  async initTour(userRole) {
    this.currentRole = userRole;
    const allSteps = tourSteps[userRole] || tourSteps[ROLES.EDITOR]; // Fallback por defecto
    
    // Detectar si es dispositivo móvil
    const isMobile = window.innerWidth <= 600;
    
    // En móviles, abrir el drawer antes de filtrar los pasos
    if (isMobile) {
      await this.openMobileDrawer();
      // Esperar un poco más para que todos los elementos se rendericen
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const availableSteps = this.filterAvailableSteps(allSteps);

    if (availableSteps.length === 0) {
      console.warn('No hay elementos disponibles para el tour');
      return null;
    }

    const mobileConfig = isMobile ? {
      stagePadding: 5,
      stageRadius: 5
    } : {};

    // Modificar pasos para móviles si es necesario
    const adjustedSteps = availableSteps.map(step => {
      let adjustedStep = { ...step };
      
      if (isMobile) {
        // Colocar todos los popovers en la parte inferior en móviles
        adjustedStep.popover = {
          ...step.popover,
          position: 'bottom'
        };
        
        // Para elementos de navegación en móviles, usar siempre el drawer
        if (step.element.includes('-nav')) {
          const drawerSelector = step.element;
          const drawerElement = document.querySelector(drawerSelector);
          if (drawerElement && drawerElement.offsetParent !== null) {
            // El elemento ya está disponible en el drawer
            adjustedStep.element = drawerSelector;
          }
        }
      }
      
      return adjustedStep;
    });

    this.driverObj = driver({
      ...baseConfig,
      ...mobileConfig,
      steps: adjustedSteps,
      onDestroyStarted: () => {
        if (!this.driverObj.hasNextStep() || window.confirm('¿Estás seguro de que quieres salir del tour?')) {
          this.driverObj.destroy();
        }
      },
      onBeforeHighlight: (element, step) => {
        // Verificar si el elemento sigue siendo visible antes de resaltarlo
        if (!element || element.offsetParent === null) {
          console.warn('Elemento no disponible:', step.element);
          return false;
        }
        
        return true;
      },
      onHighlightStarted: (element, step) => {
        // Comportamiento heredado del baseConfig
        if (element) {
          element.classList.add('tour-highlighting');
          
          setTimeout(() => {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'nearest'
            });
          }, 100);
        }
      },
      onHighlighted: (element) => {
        // Comportamiento heredado del baseConfig
        if (element) {
          element.classList.remove('tour-highlighting');
        }
      }
    });

    return this.driverObj;
  }

  // Iniciar el tour
  async startTour() {
    if (this.driverObj) {
      this.driverObj.drive();
    }
  }

  // Verificar si es un nuevo usuario
  isNewUser() {
    return !localStorage.getItem('tour_completed');
  }

  // Marcar tour como completado
  markTourCompleted() {
    localStorage.setItem('tour_completed', 'true');
  }

  // Resetear el tour (para testing)
  resetTour() {
    localStorage.removeItem('tour_completed');
  }

  // Obtener pasos del tour para un rol específico
  getTourSteps(role) {
    return tourSteps[role] || [];
  }

  // Verificar si el tour está disponible para el rol
  isTourAvailableForRole(role) {
    return !!tourSteps[role];
  }

  // Destruir el tour actual
  destroyTour() {
    if (this.driverObj) {
      this.driverObj.destroy();
      this.driverObj = null;
    }
  }
}

// Exportar instancia singleton
export const tourService = new TourService();
export default TourService;
