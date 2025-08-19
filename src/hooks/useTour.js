import { useState, useEffect } from 'react';
import { tourService } from '../services/tourService';
import { useAuth } from '../contexts/AuthContext';

export const useTour = () => {
  const { userProfile } = useAuth();
  const [tourReady, setTourReady] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (userProfile?.role) {
      setIsNewUser(tourService.isNewUser());
      setTourReady(true);
    }
  }, [userProfile]);

  const startTour = async () => {
    if (!tourReady || !userProfile?.role) {
      console.warn('Tour no está listo o no hay rol de usuario');
      return;
    }
    
    try {
      const driver = await tourService.initTour(userProfile.role);
      if (driver) {
        await tourService.startTour();
      } else {
        console.warn('No se pudo inicializar el tour: elementos no disponibles');
      }
    } catch (error) {
      console.error('Error iniciando el tour:', error);
    }
  };

  const resetTour = () => {
    tourService.resetTour();
    setIsNewUser(true);
  };

  const completeTour = () => {
    tourService.markTourCompleted();
    setIsNewUser(false);
  };

  const isTourAvailable = () => {
    return tourReady && tourService.isTourAvailableForRole(userProfile?.role);
  };

  return {
    startTour,
    resetTour,
    completeTour,
    isNewUser,
    tourReady,
    isTourAvailable: isTourAvailable(),
    userRole: userProfile?.role
  };
};

export default useTour;
