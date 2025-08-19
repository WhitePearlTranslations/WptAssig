import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageTourService } from '../services/pageTourService';

export const usePageTour = (options = {}) => {
  const location = useLocation();
  const {
    autoStart = true,           // Iniciar automáticamente si es nuevo usuario
    delay = 2000,              // Delay antes de iniciar (para que cargue la página)
    forceStart = false         // Forzar inicio aunque ya se haya visto
  } = options;

  useEffect(() => {
    if (!pageTourService.isPageTourAvailable(location.pathname)) {
      return;
    }

    const startTour = () => {
      if (forceStart) {
        pageTourService.forceStartPageTour(location.pathname);
      } else if (autoStart) {
        pageTourService.startPageTour(location.pathname);
      }
    };

    const timer = setTimeout(startTour, delay);
    
    return () => {
      clearTimeout(timer);
      // Limpiar tour anterior si existe
      pageTourService.destroyCurrentTour();
    };
  }, [location.pathname, autoStart, delay, forceStart]);

  // Funciones para control manual del tour
  const startManualTour = () => {
    pageTourService.forceStartPageTour(location.pathname);
  };

  const hasSeenTour = () => {
    return pageTourService.hasSeenPageTour(location.pathname);
  };

  const resetTour = () => {
    pageTourService.resetPageTour(location.pathname);
  };

  const isTourAvailable = () => {
    return pageTourService.isPageTourAvailable(location.pathname);
  };

  return {
    startTour: startManualTour,
    hasSeenTour: hasSeenTour(),
    resetTour,
    isTourAvailable: isTourAvailable(),
    currentPath: location.pathname
  };
};

export default usePageTour;
