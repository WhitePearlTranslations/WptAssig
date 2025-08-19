// Servicio para sincronización en segundo plano
// Permite verificar nuevas asignaciones incluso cuando la página está cerrada

import { notificationService } from './notificationService';

class BackgroundSyncService {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
    this.syncInterval = 5 * 60 * 1000; // 5 minutos
    this.intervalId = null;
    this.lastSyncTime = null;
    this.userData = null;
  }

  // Inicializar el servicio de background sync
  async init(userData) {
    console.log('[BackgroundSync] Inicializando servicio...');
    
    if (!this.isSupported) {
      console.warn('[BackgroundSync] Background Sync no soportado, usando polling manual');
      this.setupPolling(userData);
      return;
    }

    this.userData = userData;
    await this.registerBackgroundSync();
    this.setupPeriodicCheck(userData);
  }

  // Registrar background sync
  async registerBackgroundSync() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Registrar para background sync
      await registration.sync.register('check-assignments');
      console.log('[BackgroundSync] Background sync registrado');
      
      // Enviar datos del usuario al service worker
      if (notificationService.swRegistration) {
        await notificationService.updateUserDataInSW(this.userData);
      }
      
    } catch (error) {
      console.error('[BackgroundSync] Error registrando background sync:', error);
      // Fallback a polling
      this.setupPolling(this.userData);
    }
  }

  // Configurar verificación periódica manual (fallback)
  setupPolling(userData) {
    console.log('[BackgroundSync] Configurando polling manual cada 5 minutos');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.checkAssignments(userData);
    }, this.syncInterval);

    // Verificar inmediatamente
    setTimeout(() => {
      this.checkAssignments(userData);
    }, 10000); // 10 segundos después del inicio
  }

  // Configurar verificación periódica usando Page Visibility API
  setupPeriodicCheck(userData) {
    // Verificar cuando la página se vuelve visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('[BackgroundSync] Página visible, verificando asignaciones...');
        this.checkAssignments(userData);
      }
    });

    // Verificar cada 30 segundos si la página está visible
    this.intervalId = setInterval(() => {
      if (!document.hidden) {
        this.checkAssignments(userData);
      }
    }, 30000);
  }

  // Verificar nuevas asignaciones
  async checkAssignments(userData) {
    try {
      const now = new Date();
      
      // No verificar más de una vez por minuto
      if (this.lastSyncTime && (now - this.lastSyncTime) < 60000) {
        return;
      }

      console.log('[BackgroundSync] Verificando asignaciones...');
      this.lastSyncTime = now;

      // Obtener asignaciones desde Firebase
      const assignments = await this.fetchAssignments(userData.uid);
      
      if (!assignments || assignments.length === 0) {
        return;
      }

      // Obtener asignaciones anteriores del localStorage
      const previousAssignments = this.getPreviousAssignments();
      
      // Comparar y encontrar cambios
      await this.processAssignmentChanges(assignments, previousAssignments, userData);
      
      // Guardar asignaciones actuales
      this.savePreviousAssignments(assignments);
      
    } catch (error) {
      console.error('[BackgroundSync] Error verificando asignaciones:', error);
    }
  }

  // Simular obtención de asignaciones (placeholder)
  async fetchAssignments(userId) {
    try {
      // TODO: Implementar llamada real a Firebase
      // Por ahora retornamos null para no generar errores
      console.log('[BackgroundSync] Simulando obtención de asignaciones para:', userId);
      return null;
      
      // Ejemplo de implementación real:
      /*
      const response = await fetch(`/api/assignments/${userId}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
      */
    } catch (error) {
      console.error('[BackgroundSync] Error obteniendo asignaciones:', error);
      return null;
    }
  }

  // Procesar cambios en asignaciones
  async processAssignmentChanges(currentAssignments, previousAssignments, userData) {
    if (!previousAssignments || previousAssignments.length === 0) {
      // Primera carga, no notificar
      return;
    }

    const settings = notificationService.getUserNotificationSettings();
    
    // Detectar nuevas asignaciones
    if (settings.newAssignments) {
      await this.detectNewAssignments(currentAssignments, previousAssignments, userData);
    }

    // Verificar fechas límite
    if (settings.dueSoon || settings.overdue) {
      await this.checkDueDates(currentAssignments, userData, settings);
    }

    // Verificar cambios de estado
    if (settings.approved || settings.rejected) {
      await this.checkStatusChanges(currentAssignments, previousAssignments, userData, settings);
    }

    // Verificar revisiones pendientes para jefes
    if (settings.reviews && this.isManagerRole(userData.role)) {
      await this.checkPendingReviews(currentAssignments, userData);
    }
  }

  // Detectar nuevas asignaciones
  async detectNewAssignments(currentAssignments, previousAssignments, userData) {
    const userAssignments = currentAssignments.filter(a => a.assignedTo === userData.uid);
    const previousUserAssignments = previousAssignments.filter(a => a.assignedTo === userData.uid);
    
    const newAssignments = userAssignments.filter(current => {
      return !previousUserAssignments.some(previous => previous.id === current.id);
    });

    for (const assignment of newAssignments) {
      console.log('[BackgroundSync] Nueva asignación detectada:', assignment.id);
      await notificationService.notifyNewAssignment(assignment);
    }
  }

  // Verificar fechas límite
  async checkDueDates(assignments, userData, settings) {
    const userAssignments = assignments.filter(a => a.assignedTo === userData.uid);
    const now = new Date();
    const lastNotifications = this.getLastNotificationTimes();

    for (const assignment of userAssignments) {
      if (!assignment.dueDate || assignment.status === 'completado' || assignment.status === 'uploaded') {
        continue;
      }

      const dueDate = new Date(assignment.dueDate);
      const timeDiff = dueDate - now;
      const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));

      const notificationKey = `${assignment.id}-due`;
      const lastNotificationTime = lastNotifications[notificationKey];
      const hoursSinceLastNotification = lastNotificationTime 
        ? (now - new Date(lastNotificationTime)) / (1000 * 60 * 60) 
        : Infinity;

      // Asignaciones vencidas (notificar una vez al día)
      if (settings.overdue && timeDiff < 0 && hoursSinceLastNotification > 24) {
        console.log('[BackgroundSync] Asignación vencida detectada:', assignment.id);
        await notificationService.notifyAssignmentOverdue(assignment);
        this.saveLastNotificationTime(notificationKey);
      }
      // Asignaciones por vencer
      else if (settings.dueSoon && timeDiff > 0) {
        const shouldNotify = (
          (hoursLeft <= 24 && hoursLeft > 23 && hoursSinceLastNotification > 12) ||
          (hoursLeft <= 12 && hoursLeft > 11 && hoursSinceLastNotification > 6) ||
          (hoursLeft <= 3 && hoursLeft > 2 && hoursSinceLastNotification > 1)
        );

        if (shouldNotify) {
          console.log('[BackgroundSync] Asignación por vencer detectada:', assignment.id, hoursLeft + 'h');
          await notificationService.notifyAssignmentDueSoon(assignment, hoursLeft);
          this.saveLastNotificationTime(notificationKey);
        }
      }
    }
  }

  // Verificar cambios de estado
  async checkStatusChanges(currentAssignments, previousAssignments, userData, settings) {
    const userAssignments = currentAssignments.filter(a => a.assignedTo === userData.uid);
    const previousUserAssignments = previousAssignments.filter(a => a.assignedTo === userData.uid);

    for (const current of userAssignments) {
      const previous = previousUserAssignments.find(p => p.id === current.id);
      
      if (!previous) continue;

      // Trabajo aprobado
      if (settings.approved && 
          previous.status !== 'aprobado' && 
          current.status === 'aprobado') {
        console.log('[BackgroundSync] Asignación aprobada detectada:', current.id);
        await notificationService.notifyAssignmentApproved(current);
      }

      // Trabajo rechazado
      if (settings.rejected && 
          previous.status === 'completado' && 
          current.status === 'pendiente') {
        console.log('[BackgroundSync] Asignación rechazada detectada:', current.id);
        await notificationService.notifyAssignmentRejected(current, current.rejectionReason);
      }
    }
  }

  // Verificar revisiones pendientes
  async checkPendingReviews(assignments, userData) {
    const pendingReviews = assignments.filter(assignment => {
      return assignment.status === 'completado' && this.canReviewAssignment(assignment, userData.role);
    });

    if (pendingReviews.length === 0) return;

    const lastNotificationTime = this.getLastNotificationTimes()['pending-reviews'];
    const hoursSinceLastNotification = lastNotificationTime 
      ? (new Date() - new Date(lastNotificationTime)) / (1000 * 60 * 60) 
      : Infinity;

    if (hoursSinceLastNotification > 2) {
      console.log('[BackgroundSync] Revisiones pendientes detectadas:', pendingReviews.length);
      await notificationService.notifyPendingReviews(pendingReviews.length, pendingReviews);
      this.saveLastNotificationTime('pending-reviews');
    }
  }

  // Verificar si es rol de jefe
  isManagerRole(role) {
    return ['admin', 'jefe-editor', 'jefe-traductor'].includes(role);
  }

  // Verificar si puede revisar una asignación
  canReviewAssignment(assignment, userRole) {
    switch (userRole) {
      case 'admin':
        return true;
      case 'jefe-editor':
        return ['proofreading', 'cleanRedrawer', 'type'].includes(assignment.type);
      case 'jefe-traductor':
        return assignment.type === 'traduccion';
      default:
        return false;
    }
  }

  // Obtener asignaciones anteriores del localStorage
  getPreviousAssignments() {
    try {
      const stored = localStorage.getItem('backgroundSync_previousAssignments');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[BackgroundSync] Error obteniendo asignaciones anteriores:', error);
      return [];
    }
  }

  // Guardar asignaciones actuales
  savePreviousAssignments(assignments) {
    try {
      localStorage.setItem('backgroundSync_previousAssignments', JSON.stringify(assignments));
    } catch (error) {
      console.error('[BackgroundSync] Error guardando asignaciones:', error);
    }
  }

  // Obtener tiempos de última notificación
  getLastNotificationTimes() {
    try {
      const stored = localStorage.getItem('backgroundSync_lastNotifications');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[BackgroundSync] Error obteniendo tiempos de notificación:', error);
      return {};
    }
  }

  // Guardar tiempo de última notificación
  saveLastNotificationTime(key) {
    try {
      const times = this.getLastNotificationTimes();
      times[key] = new Date().toISOString();
      localStorage.setItem('backgroundSync_lastNotifications', JSON.stringify(times));
    } catch (error) {
      console.error('[BackgroundSync] Error guardando tiempo de notificación:', error);
    }
  }

  // Actualizar datos del usuario
  updateUserData(userData) {
    this.userData = userData;
    
    if (notificationService.swRegistration) {
      notificationService.updateUserDataInSW(userData);
    }
  }

  // Limpiar recursos
  cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  // Obtener estado del servicio
  getStatus() {
    return {
      isSupported: this.isSupported,
      isActive: !!this.intervalId,
      lastSyncTime: this.lastSyncTime,
      userData: this.userData ? { uid: this.userData.uid, role: this.userData.role } : null
    };
  }
}

// Crear instancia global
export const backgroundSyncService = new BackgroundSyncService();
export default backgroundSyncService;
