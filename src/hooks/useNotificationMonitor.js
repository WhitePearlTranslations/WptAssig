import { useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { ROLES } from '../contexts/AuthContext';

export const useNotificationMonitor = (assignments = [], userProfile = null) => {
  const previousAssignmentsRef = useRef([]);
  const lastNotificationTimeRef = useRef({});

  useEffect(() => {
    if (!assignments.length || !userProfile || !notificationService.hasPermission()) {
      return;
    }

    const settings = notificationService.getUserNotificationSettings();
    const previousAssignments = previousAssignmentsRef.current;
    const currentTime = new Date();

    // Detectar nuevas asignaciones
    if (settings.newAssignments) {
      detectNewAssignments(assignments, previousAssignments, userProfile);
    }

    // Verificar asignaciones por vencer y vencidas
    if (settings.dueSoon || settings.overdue) {
      checkDueDates(assignments, userProfile, settings);
    }

    // Verificar revisiones pendientes para jefes
    if (settings.reviews && isManagerRole(userProfile.role)) {
      checkPendingReviews(assignments, userProfile);
    }

    // Verificar estado de trabajos (aprobados/rechazados)
    if (settings.approved || settings.rejected) {
      checkWorkStatus(assignments, previousAssignments, userProfile, settings);
    }

    // Actualizar referencia de asignaciones previas
    previousAssignmentsRef.current = [...assignments];
  }, [assignments, userProfile]);

  const detectNewAssignments = (currentAssignments, previousAssignments, userProfile) => {
    if (previousAssignments.length === 0) {
      return; // Primera carga, no notificar
    }

    const userAssignments = currentAssignments.filter(a => a.assignedTo === userProfile.uid);
    const previousUserAssignments = previousAssignments.filter(a => a.assignedTo === userProfile.uid);
    
    const newAssignments = userAssignments.filter(current => {
      return !previousUserAssignments.some(previous => previous.id === current.id);
    });

    newAssignments.forEach(assignment => {
      notificationService.notifyNewAssignment(assignment);
    });
  };

  const checkDueDates = (assignments, userProfile, settings) => {
    const userAssignments = assignments.filter(a => a.assignedTo === userProfile.uid);
    const now = new Date();

    userAssignments.forEach(assignment => {
      if (!assignment.dueDate || assignment.status === 'completado' || assignment.status === 'uploaded') {
        return;
      }

      const dueDate = new Date(assignment.dueDate);
      const timeDiff = dueDate - now;
      const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));

      // Evitar spam de notificaciones
      const lastNotificationKey = `${assignment.id}-due`;
      const lastNotificationTime = lastNotificationTimeRef.current[lastNotificationKey];
      const hoursSinceLastNotification = lastNotificationTime 
        ? (now - lastNotificationTime) / (1000 * 60 * 60) 
        : Infinity;

      // Notificar asignaciones vencidas (una vez al día)
      if (settings.overdue && timeDiff < 0 && hoursSinceLastNotification > 24) {
        notificationService.notifyAssignmentOverdue(assignment);
        lastNotificationTimeRef.current[lastNotificationKey] = now;
      }
      // Notificar asignaciones por vencer (24h, 12h, 3h antes)
      else if (settings.dueSoon && timeDiff > 0) {
        const shouldNotify = (
          (hoursLeft <= 24 && hoursLeft > 23 && hoursSinceLastNotification > 12) ||
          (hoursLeft <= 12 && hoursLeft > 11 && hoursSinceLastNotification > 6) ||
          (hoursLeft <= 3 && hoursLeft > 2 && hoursSinceLastNotification > 1)
        );

        if (shouldNotify) {
          notificationService.notifyAssignmentDueSoon(assignment, hoursLeft);
          lastNotificationTimeRef.current[lastNotificationKey] = now;
        }
      }
    });
  };

  const checkPendingReviews = (assignments, userProfile) => {
    // Solo para jefes y admins
    if (!isManagerRole(userProfile.role)) {
      return;
    }

    const pendingReviews = assignments.filter(assignment => {
      if (assignment.status !== 'completado') {
        return false;
      }

      // Verificar si el jefe puede revisar este tipo de trabajo
      return canReviewAssignment(assignment, userProfile.role);
    });

    if (pendingReviews.length === 0) {
      return;
    }

    // Evitar spam - notificar máximo una vez cada 2 horas
    const lastNotificationTime = lastNotificationTimeRef.current['pending-reviews'];
    const hoursSinceLastNotification = lastNotificationTime 
      ? (new Date() - lastNotificationTime) / (1000 * 60 * 60) 
      : Infinity;

    if (hoursSinceLastNotification > 2) {
      notificationService.notifyPendingReviews(pendingReviews.length, pendingReviews);
      lastNotificationTimeRef.current['pending-reviews'] = new Date();
    }
  };

  const checkWorkStatus = (currentAssignments, previousAssignments, userProfile, settings) => {
    if (previousAssignments.length === 0) {
      return; // Primera carga, no notificar
    }

    const userAssignments = currentAssignments.filter(a => a.assignedTo === userProfile.uid);
    const previousUserAssignments = previousAssignments.filter(a => a.assignedTo === userProfile.uid);

    userAssignments.forEach(current => {
      const previous = previousUserAssignments.find(p => p.id === current.id);
      
      if (!previous) {
        return; // Nueva asignación, ya se maneja en detectNewAssignments
      }

      // Trabajo aprobado
      if (settings.approved && 
          previous.status !== 'aprobado' && 
          current.status === 'aprobado') {
        notificationService.notifyAssignmentApproved(current);
      }

      // Trabajo rechazado
      if (settings.rejected && 
          previous.status === 'completado' && 
          current.status === 'pendiente') {
        // Asumimos que si vuelve a pendiente desde completado, fue rechazado
        notificationService.notifyAssignmentRejected(current, current.rejectionReason);
      }
    });
  };

  const isManagerRole = (role) => {
    return role === ROLES.ADMIN || 
           role === ROLES.JEFE_EDITOR || 
           role === ROLES.JEFE_TRADUCTOR;
  };

  const canReviewAssignment = (assignment, userRole) => {
    switch (userRole) {
      case ROLES.ADMIN:
        return true; // Los admins pueden revisar todo
      
      case ROLES.JEFE_EDITOR:
        // Jefe editor puede revisar proofreading, clean/redrawer y typesetting
        return ['proofreading', 'cleanRedrawer', 'type'].includes(assignment.type);
      
      case ROLES.JEFE_TRADUCTOR:
        // Jefe traductor puede revisar traducciones
        return assignment.type === 'traduccion';
      
      default:
        return false;
    }
  };
};

export default useNotificationMonitor;
