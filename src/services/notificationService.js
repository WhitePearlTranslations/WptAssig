// Servicio de notificaciones simple - usando API nativa del navegador
class NotificationService {
  constructor() {
    this.permission = 'default';
    this.isSupported = 'Notification' in window;
    this.init();
  }

  // Inicializar el servicio
  async init() {
    if (!this.isSupported) {
      console.warn('Las notificaciones no están soportadas en este navegador');
      return;
    }

    this.permission = Notification.permission;
    console.log('Servicio de notificaciones inicializado - usando API nativa del navegador');
  }

  // Solicitar permisos de notificación
  async requestPermission() {
    if (!this.isSupported) {
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result === 'granted';
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return false;
    }
  }

  // Verificar si tiene permisos
  hasPermission() {
    return this.isSupported && this.permission === 'granted';
  }

  // Enviar notificación usando API nativa
  async showNotification(title, options = {}) {
    if (!this.hasPermission()) {
      console.log('Sin permisos para mostrar notificaciones');
      return null;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      tag: 'wpt-assignment',
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto-cerrar después de 10 segundos si no requiere interacción
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      return notification;
    } catch (error) {
      console.error('Error al mostrar notificación:', error);
      return null;
    }
  }

  // Notificación de nueva asignación
  async notifyNewAssignment(assignment) {
    const title = '📋 Nueva Asignación';
    const body = `${assignment.mangaTitle || assignment.manga} - Cap. ${assignment.chapter}\nTipo: ${this.getTaskTypeLabel(assignment.type)}`;
    
    return await this.showNotification(title, {
      body,
      icon: '/favicon.ico',
      tag: `assignment-${assignment.id}`
    });
  }

  // Notificación de asignación por vencer
  async notifyAssignmentDueSoon(assignment, hoursLeft) {
    const title = '⏰ Asignación por Vencer';
    const body = `${assignment.mangaTitle || assignment.manga} - Cap. ${assignment.chapter}\nVence en ${hoursLeft} horas`;
    
    return await this.showNotification(title, {
      body,
      icon: '/favicon.ico',
      tag: `due-${assignment.id}`
    });
  }

  // Notificación de asignación vencida
  async notifyAssignmentOverdue(assignment) {
    const title = '🚨 Asignación Vencida';
    const body = `${assignment.mangaTitle || assignment.manga} - Cap. ${assignment.chapter}\nEsta asignación está vencida`;
    
    return await this.showNotification(title, {
      body,
      icon: '/favicon.ico',
      tag: `overdue-${assignment.id}`
    });
  }

  // Notificación de revisiones pendientes para jefes
  async notifyPendingReviews(count, assignments) {
    const title = `👔 Revisiones Pendientes (${count})`;
    const body = count === 1 
      ? `Tienes 1 asignación completada esperando revisión`
      : `Tienes ${count} asignaciones completadas esperando revisión`;
    
    return await this.showNotification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'pending-reviews'
    });
  }

  // Notificación de asignación aprobada
  async notifyAssignmentApproved(assignment) {
    const title = '✅ Asignación Aprobada';
    const body = `Tu trabajo en ${assignment.mangaTitle || assignment.manga} - Cap. ${assignment.chapter} ha sido aprobado`;
    
    return await this.showNotification(title, {
      body,
      icon: '/favicon.ico',
      tag: `approved-${assignment.id}`
    });
  }

  // Notificación de asignación rechazada
  async notifyAssignmentRejected(assignment, reason) {
    const title = '❌ Asignación Rechazada';
    const body = `Tu trabajo en ${assignment.mangaTitle || assignment.manga} - Cap. ${assignment.chapter} necesita correcciones${reason ? `: ${reason}` : ''}`;
    
    return await this.showNotification(title, {
      body,
      icon: '/favicon.ico',
      tag: `rejected-${assignment.id}`
    });
  }

  // Obtener etiqueta del tipo de tarea
  getTaskTypeLabel(type) {
    const types = {
      traduccion: 'Traducción',
      proofreading: 'Proofreading',
      cleanRedrawer: 'Clean/Redrawer',
      type: 'Typesetting'
    };
    return types[type] || type;
  }

  // Verificar si el usuario ha deshabilitado las notificaciones recientemente
  shouldShowPermissionPrompt() {
    const lastPrompt = localStorage.getItem('notificationPermissionLastPrompt');
    if (!lastPrompt) return true;
    
    const lastPromptTime = new Date(lastPrompt);
    const now = new Date();
    const hoursSinceLastPrompt = (now - lastPromptTime) / (1000 * 60 * 60);
    
    // Solo mostrar el prompt de nuevo después de 24 horas si fue denegado
    return hoursSinceLastPrompt > 24;
  }

  // Registrar que se mostró el prompt
  recordPermissionPrompt() {
    localStorage.setItem('notificationPermissionLastPrompt', new Date().toISOString());
  }

  // Obtener estado de configuración de notificaciones del usuario
  getUserNotificationSettings() {
    const settings = localStorage.getItem('notificationSettings');
    return settings ? JSON.parse(settings) : {
      newAssignments: true,
      dueSoon: true,
      overdue: true,
      reviews: true,
      approved: true,
      rejected: true
    };
  }

  // Guardar configuración de notificaciones del usuario
  saveUserNotificationSettings(settings) {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }

  // Configurar handlers básicos
  setupNotificationHandlers() {
    if (!this.isSupported) return;
    console.log('Handlers de notificación configurados (API nativa)');
  }
}

// Crear instancia global
export const notificationService = new NotificationService();

// Configurar handlers al importar
if (typeof window !== 'undefined') {
  notificationService.setupNotificationHandlers();
}

export default notificationService;
