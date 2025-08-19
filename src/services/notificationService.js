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
    
    // Service Worker deshabilitado - desregistrar cualquier SW existente
    console.log('Service Worker deshabilitado - las notificaciones funcionarán sin SW');
    this.swRegistration = null;
    
    // Desregistrar cualquier service worker existente
    this.forceServiceWorkerCleanup();
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

  // Desregistrar TODOS los service workers existentes
  async unregisterAllServiceWorkers() {
    if (!this.isServiceWorkerSupported) {
      return;
    }

    try {
      console.log('🗑️ Desregistrando todos los service workers...');
      
      // Obtener todas las registraciones
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('🗑️ Service workers encontrados:', registrations.length);
      
      // Desregistrar cada uno
      const unregisterPromises = registrations.map(async (registration, index) => {
        console.log(`🗑️ Desregistrando SW #${index + 1}:`, registration.scope);
        try {
          const success = await registration.unregister();
          console.log(`🗑️ SW #${index + 1} desregistrado:`, success);
          return success;
        } catch (error) {
          console.error(`🗑️ Error desregistrando SW #${index + 1}:`, error);
          return false;
        }
      });
      
      // Esperar a que todos se desregistren
      const results = await Promise.all(unregisterPromises);
      const successful = results.filter(Boolean).length;
      
      console.log(`🗑️ Desregistración completa: ${successful}/${registrations.length} exitosos`);
      
      // Limpiar caches también
      await this.clearAllCaches();
      
      return successful === registrations.length;
    } catch (error) {
      console.error('🗑️ Error desregistrando service workers:', error);
      return false;
    }
  }

  // Limpiar todos los caches
  async clearAllCaches() {
    try {
      console.log('🗑️ Limpiando todos los caches...');
      const cacheNames = await caches.keys();
      console.log('🗑️ Caches encontrados:', cacheNames);
      
      const deletePromises = cacheNames.map(async (cacheName) => {
        console.log('🗑️ Eliminando cache:', cacheName);
        return await caches.delete(cacheName);
      });
      
      const results = await Promise.all(deletePromises);
      const successful = results.filter(Boolean).length;
      
      console.log(`🗑️ Limpieza de cache completa: ${successful}/${cacheNames.length} exitosos`);
      return successful === cacheNames.length;
    } catch (error) {
      console.error('🗑️ Error limpiando caches:', error);
      return false;
    }
  }

  // Forzar limpieza completa con verificación automática
  async forceServiceWorkerCleanup() {
    if (!this.isServiceWorkerSupported) {
      return;
    }

    try {
      console.log('🧹 FORZANDO limpieza completa de service workers...');
      
      // 1. Obtener todas las registraciones
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('🧹 Service workers detectados:', registrations.length);
      
      if (registrations.length === 0) {
        console.log('🧹 No hay service workers para limpiar');
        await this.clearAllCaches();
        return;
      }
      
      // 2. Desregistrar todos los service workers
      let successCount = 0;
      for (const registration of registrations) {
        try {
          console.log('🧹 Desregistrando:', registration.scope);
          const success = await registration.unregister();
          if (success) {
            successCount++;
            console.log('🧹 ✅ Desregistrado exitosamente:', registration.scope);
          } else {
            console.log('🧹 ❌ Error desregistrando:', registration.scope);
          }
        } catch (error) {
          console.error('🧹 ❌ Excepción desregistrando:', registration.scope, error);
        }
      }
      
      console.log(`🧹 Desregistración completada: ${successCount}/${registrations.length}`);
      
      // 3. Limpiar todos los caches
      await this.clearAllCaches();
      
      // 4. Si encontramos SW activos, marcar para recargar después de un tiempo
      if (registrations.length > 0) {
        console.log('🧹 Service workers encontrados - programando verificación...');
        
        // Guardar timestamp de cuando hicimos la limpieza
        localStorage.setItem('swCleanupTimestamp', Date.now().toString());
        
        // Verificar después de 2 segundos si aún hay SW activos
        setTimeout(() => {
          this.checkIfReloadNeeded();
        }, 2000);
      }
      
    } catch (error) {
      console.error('🧹 Error en limpieza forzada:', error);
    }
  }
  
  // Verificar si necesitamos recargar para completar la limpieza
  async checkIfReloadNeeded() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length > 0) {
        console.log('🧹 ⚠️ Aún hay service workers activos después de la limpieza');
        console.log('🧹 Service workers persistentes:', registrations.map(r => r.scope));
        
        // Verificar si ya intentamos la limpieza recientemente
        const lastCleanup = localStorage.getItem('swCleanupTimestamp');
        const now = Date.now();
        
        if (lastCleanup && (now - parseInt(lastCleanup)) < 60000) { // 1 minuto
          console.log('🧹 🔄 Forzando recarga para completar limpieza...');
          
          // Mostrar mensaje al usuario
          if (window.confirm('Se detectaron archivos antiguos que requieren actualización. ¿Recargar la página para aplicar los cambios?')) {
            window.location.reload(true);
          }
        }
      } else {
        console.log('🧹 ✅ Limpieza completada exitosamente');
        localStorage.removeItem('swCleanupTimestamp');
      }
    } catch (error) {
      console.error('🧹 Error verificando estado post-limpieza:', error);
    }
  }
}

// Crear instancia global
export const notificationService = new NotificationService();

// Configurar handlers al importar
if (typeof window !== 'undefined') {
  notificationService.setupNotificationHandlers();
}

export default notificationService;
