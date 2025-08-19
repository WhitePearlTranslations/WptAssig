// SERVICIO DESHABILITADO
// Este servicio dependía de service workers que han sido removidos del proyecto
// Se mantiene como stub para compatibilidad con el código existente

// Eliminamos la importación de notificationService para evitar errores
// import { notificationService } from './notificationService';

class BackgroundSyncService {
  constructor() {
    this.isSupported = false; // Always false since service workers are disabled
    this.syncInterval = 5 * 60 * 1000;
    this.intervalId = null;
    this.lastSyncTime = null;
    this.userData = null;
    console.warn('[BackgroundSync] Service deshabilitado - Service Workers han sido removidos');
  }

  // Inicializar el servicio de background sync (DESHABILITADO)
  async init(userData) {
    console.warn('[BackgroundSync] Servicio deshabilitado - Service Workers removidos');
    this.userData = userData;
    return;
  }

  // Métodos deshabilitados (no-op)
  async registerBackgroundSync() {
    console.warn('[BackgroundSync] registerBackgroundSync deshabilitado');
    return;
  }

  setupPolling(userData) {
    console.warn('[BackgroundSync] setupPolling deshabilitado');
    return;
  }

  setupPeriodicCheck(userData) {
    console.warn('[BackgroundSync] setupPeriodicCheck deshabilitado');
    return;
  }

  async checkAssignments(userData) {
    console.warn('[BackgroundSync] checkAssignments deshabilitado');
    return;
  }

  async fetchAssignments(userId) {
    console.warn('[BackgroundSync] fetchAssignments deshabilitado');
    return null;
  }

  async processAssignmentChanges(currentAssignments, previousAssignments, userData) {
    console.warn('[BackgroundSync] processAssignmentChanges deshabilitado');
    return;
  }

  async detectNewAssignments(currentAssignments, previousAssignments, userData) {
    console.warn('[BackgroundSync] detectNewAssignments deshabilitado');
    return;
  }

  async checkDueDates(assignments, userData, settings) {
    console.warn('[BackgroundSync] checkDueDates deshabilitado');
    return;
  }

  async checkStatusChanges(currentAssignments, previousAssignments, userData, settings) {
    console.warn('[BackgroundSync] checkStatusChanges deshabilitado');
    return;
  }

  async checkPendingReviews(assignments, userData) {
    console.warn('[BackgroundSync] checkPendingReviews deshabilitado');
    return;
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
    console.warn('[BackgroundSync] updateUserData deshabilitado - Service Workers removidos');
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
