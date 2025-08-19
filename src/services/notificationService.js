// Servicio de notificaciones push para el navegador
class NotificationService {
  constructor() {
    this.permission = 'default';
    this.isSupported = 'Notification' in window;
    this.swRegistration = null;
    this.isServiceWorkerSupported = 'serviceWorker' in navigator;
    this.init();
  }

  // Inicializar el servicio
  async init() {
    if (!this.isSupported) {
      console.warn('Las notificaciones no están soportadas en este navegador');
      return;
    }

    this.permission = Notification.permission;
    
    // Registrar Service Worker si está soportado
    if (this.isServiceWorkerSupported) {
      try {
        await this.registerServiceWorker();
      } catch (error) {
        console.warn('No se pudo registrar el Service Worker:', error);
      }
    }
  }

  // Registrar Service Worker
  async registerServiceWorker() {
    if (!this.isServiceWorkerSupported) {
      throw new Error('Service Worker no soportado');
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('Service Worker registrado:', registration);
      this.swRegistration = registration;
      
      // Configurar listeners para mensajes del SW
      this.setupServiceWorkerListeners();
      
      return registration;
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
      throw error;
    }
  }

  // Configurar listeners del Service Worker
  setupServiceWorkerListeners() {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Mensaje del SW:', event.data);
      
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        // Manejar click en notificación
        const { url, data } = event.data;
        if (url && url !== window.location.pathname) {
          window.location.href = url;
        }
      }
    });
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

  // Enviar notificación
  async showNotification(title, options = {}) {
    if (!this.hasPermission()) {
      console.warn('Sin permisos para mostrar notificaciones');
      return null;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'wpt-assignment',
      requireInteraction: true,
      ...options
    };

    try {
      // Si tenemos Service Worker registrado, usar notificaciones persistentes
      if (this.swRegistration) {
        return await this.swRegistration.showNotification(title, defaultOptions);
      } else {
        // Fallback a notificaciones normales
        const notification = new Notification(title, defaultOptions);
        
        // Auto-cerrar después de 10 segundos si no requiere interacción
        if (!defaultOptions.requireInteraction) {
          setTimeout(() => {
            notification.close();
          }, 10000);
        }

        return notification;
      }
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
      tag: `assignment-${assignment.id}`,
      data: {
        type: 'new-assignment',
        assignmentId: assignment.id,
        url: '/my-works'
      }
    });
  }

  // Notificación de asignación por vencer
  async notifyAssignmentDueSoon(assignment, hoursLeft) {
    const title = '⏰ Asignación por Vencer';
    const body = `${assignment.mangaTitle || assignment.manga} - Cap. ${assignment.chapter}\nVence en ${hoursLeft} horas`;
    
    return await this.showNotification(title, {
      body,
      icon: '/favicon.ico',
      tag: `due-${assignment.id}`,
      data: {
        type: 'assignment-due',
        assignmentId: assignment.id,
        url: '/my-works'
      }
    });
  }

  // Notificación de asignación vencida
  async notifyAssignmentOverdue(assignment) {
    const title = '🚨 Asignación Vencida';
    const body = `${assignment.mangaTitle || assignment.manga} - Cap. ${assignment.chapter}\nEsta asignación está vencida`;
    
    return await this.showNotification(title, {
      body,
      icon: '/favicon.ico',
      tag: `overdue-${assignment.id}`,
      data: {
        type: 'assignment-overdue',
        assignmentId: assignment.id,
        url: '/my-works'
      }
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
      tag: 'pending-reviews',
      data: {
        type: 'pending-reviews',
        count,
        url: '/review-panel'
      }
    });
  }

  // Notificación de asignación aprobada
  async notifyAssignmentApproved(assignment) {
    const title = '✅ Asignación Aprobada';
    const body = `Tu trabajo en ${assignment.mangaTitle || assignment.manga} - Cap. ${assignment.chapter} ha sido aprobado`;
    
    return await this.showNotification(title, {
      body,
      icon: '/favicon.ico',
      tag: `approved-${assignment.id}`,
      data: {
        type: 'assignment-approved',
        assignmentId: assignment.id,
        url: '/my-works'
      }
    });
  }

  // Notificación de asignación rechazada
  async notifyAssignmentRejected(assignment, reason) {
    const title = '❌ Asignación Rechazada';
    const body = `Tu trabajo en ${assignment.mangaTitle || assignment.manga} - Cap. ${assignment.chapter} necesita correcciones${reason ? `: ${reason}` : ''}`;
    
    return await this.showNotification(title, {
      body,
      icon: '/favicon.ico',
      tag: `rejected-${assignment.id}`,
      data: {
        type: 'assignment-rejected',
        assignmentId: assignment.id,
        url: '/my-works'
      }
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

  // Enviar mensaje al Service Worker
  async sendMessageToSW(message) {
    if (!this.swRegistration || !this.swRegistration.active) {
      console.warn('Service Worker no disponible para enviar mensaje');
      return;
    }

    try {
      this.swRegistration.active.postMessage(message);
    } catch (error) {
      console.error('Error enviando mensaje al SW:', error);
    }
  }

  // Actualizar datos del usuario en el Service Worker
  async updateUserDataInSW(userData) {
    await this.sendMessageToSW({
      type: 'UPDATE_USER_DATA',
      userData: {
        userId: userData.uid,
        role: userData.role,
        preferences: this.getUserNotificationSettings(),
        lastCheck: new Date().toISOString()
      }
    });
  }

  // Solicitar verificación de asignaciones al Service Worker
  async requestAssignmentCheck(userId) {
    await this.sendMessageToSW({
      type: 'CHECK_ASSIGNMENTS',
      userId
    });
  }

  // Configurar listeners para clicks en notificaciones (mantener para compatibilidad)
  setupNotificationHandlers() {
    if (!this.isSupported) return;
    console.log('Handlers de notificación configurados (usando Service Worker)');
  }

  // Limpiar notificaciones antiguas
  clearNotifications() {
    if (!this.isSupported) return;
    
    // No hay API directa para limpiar todas las notificaciones
    // pero podemos implementar un sistema de tags para gestionarlas
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
    
    // Actualizar configuración en el Service Worker también
    if (this.swRegistration) {
      this.sendMessageToSW({
        type: 'UPDATE_SETTINGS',
        settings
      });
    }
  }

  // Obtener estado del Service Worker
  getServiceWorkerStatus() {
    return {
      isSupported: this.isServiceWorkerSupported,
      isRegistered: !!this.swRegistration,
      isActive: !!(this.swRegistration && this.swRegistration.active)
    };
  }

  // Verificar si las notificaciones offline están disponibles
  isOfflineNotificationSupported() {
    return this.isServiceWorkerSupported && 
           this.swRegistration && 
           this.swRegistration.active &&
           this.hasPermission();
  }
}

// Crear instancia global
export const notificationService = new NotificationService();

// Configurar handlers al importar
if (typeof window !== 'undefined') {
  notificationService.setupNotificationHandlers();
}

export default notificationService;
