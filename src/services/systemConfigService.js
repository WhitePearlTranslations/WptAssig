/**
 * Servicio para la gestión de configuraciones del sistema
 * Maneja configuraciones generales, Firebase, APIs y seguridad
 */

import { ref, get, set, update } from 'firebase/database';
import { getRealtimeDb } from './firebase';

// Nodo principal para configuraciones del sistema
const SYSTEM_CONFIG_PATH = 'systemConfig';

// Configuraciones por defecto del sistema
const DEFAULT_CONFIGURATIONS = {
  general: {
    systemName: 'WhitePearl Translations',
    systemVersion: '2.0.0',
    baseUrl: getDefaultBaseUrl(),
    maintenanceMode: false,
    registrationEnabled: true,
    maxFileSize: 50, // MB
    supportEmail: 'soporte@whitepearl.com',
    maxUsersPerProject: 10,
    lastUpdated: new Date().toISOString(),
    updatedBy: null
  },
  firebase: {
    workerUrl: 'https://wpt-config-api.whitepearltranslations.workers.dev',
    databaseRulesVersion: '1.0',
    storageRulesVersion: '1.0',
    enableRealtimeSync: true,
    backupFrequency: 'daily',
    lastUpdated: new Date().toISOString(),
    updatedBy: null
  },
  apis: {
    imagekitEnabled: true,
    imagekitPublicKey: 'public_...',
    imagekitEndpoint: 'https://ik.imagekit.io/...',
    googleDriveEnabled: true,
    cloudflareWorkerEnabled: true,
    notificationEmail: 'notificaciones@whitepearl.com',
    lastUpdated: new Date().toISOString(),
    updatedBy: null
  },
  security: {
    sessionTimeout: 24, // horas
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutos
    enableTwoFactor: false,
    lastUpdated: new Date().toISOString(),
    updatedBy: null
  },
  metadata: {
    version: '1.0',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    backupCount: 0
  }
};

/**
 * Obtiene todas las configuraciones del sistema
 * @returns {Promise<Object>} Objeto con success y configuraciones
 */
export async function getSystemConfigurations() {
  try {
    
    const database = await getRealtimeDb();
    const configRef = ref(database, SYSTEM_CONFIG_PATH);
    const snapshot = await get(configRef);
    
    if (snapshot.exists()) {
      const configurations = snapshot.val();
      
      // Verificar que todas las secciones existen, si no, completar con defaults
      const completeConfigurations = {
        general: { ...DEFAULT_CONFIGURATIONS.general, ...configurations.general },
        firebase: { ...DEFAULT_CONFIGURATIONS.firebase, ...configurations.firebase },
        apis: { ...DEFAULT_CONFIGURATIONS.apis, ...configurations.apis },
        security: { ...DEFAULT_CONFIGURATIONS.security, ...configurations.security },
        metadata: { ...DEFAULT_CONFIGURATIONS.metadata, ...configurations.metadata }
      };
      
      // Actualizar automáticamente la URL base si ha cambiado el entorno
      const currentBaseUrl = getDefaultBaseUrl();
      if (completeConfigurations.general.baseUrl !== currentBaseUrl) {
        completeConfigurations.general.baseUrl = currentBaseUrl;
        
        // Guardar la actualización automáticamente si es diferente
        setTimeout(async () => {
          try {
            await updateSystemConfigSection('general', completeConfigurations.general, 'system');
          } catch (error) {
            console.warn('No se pudo actualizar automáticamente la URL base:', error);
          }
        }, 1000);
      }
      return {
        success: true,
        configurations: completeConfigurations
      };
    } else {
      // Si no existen configuraciones, crear con valores por defecto
      await initializeSystemConfigurations();
      
      return {
        success: true,
        configurations: DEFAULT_CONFIGURATIONS
      };
    }
  } catch (error) {
    console.error('❌ Error obteniendo configuraciones del sistema:', error);
    return {
      success: false,
      error: error.message,
      configurations: DEFAULT_CONFIGURATIONS // Fallback a configuraciones por defecto
    };
  }
}

/**
 * Guarda las configuraciones del sistema
 * @param {Object} configurations - Configuraciones a guardar
 * @param {string} userId - ID del usuario que realiza la actualización
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function saveSystemConfigurations(configurations, userId = null) {
  try {
    
    // Agregar metadata de actualización
    const timestamp = new Date().toISOString();
    const configurationsWithMeta = {
      general: {
        ...configurations.general,
        lastUpdated: timestamp,
        updatedBy: userId
      },
      firebase: {
        ...configurations.firebase,
        lastUpdated: timestamp,
        updatedBy: userId
      },
      apis: {
        ...configurations.apis,
        lastUpdated: timestamp,
        updatedBy: userId
      },
      security: {
        ...configurations.security,
        lastUpdated: timestamp,
        updatedBy: userId
      },
      metadata: {
        ...configurations.metadata,
        lastUpdated: timestamp,
        version: '1.0'
      }
    };
    
    const database = await getRealtimeDb();
    const configRef = ref(database, SYSTEM_CONFIG_PATH);
    await set(configRef, configurationsWithMeta);
    
    // Actualizar estado público del modo mantenimiento
    if (configurationsWithMeta.general?.maintenanceMode !== undefined) {
      try {
        const maintenanceStatusRef = ref(database, 'maintenanceStatus');
        await set(maintenanceStatusRef, {
          isActive: configurationsWithMeta.general.maintenanceMode,
          lastUpdated: timestamp,
          updatedBy: userId
        });
      } catch (error) {
        console.warn('⚠️ Error actualizando estado público de mantenimiento:', error);
      }
    }
    
    // Crear backup automático
    await createConfigBackup(configurationsWithMeta, userId);
    return {
      success: true,
      message: 'Configuraciones guardadas exitosamente',
      timestamp
    };
  } catch (error) {
    console.error('❌ Error guardando configuraciones del sistema:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Actualiza una sección específica de configuraciones
 * @param {string} section - Sección a actualizar (general, firebase, apis, security)
 * @param {Object} sectionData - Datos de la sección
 * @param {string} userId - ID del usuario que realiza la actualización
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function updateSystemConfigSection(section, sectionData, userId = null) {
  try {
    
    const timestamp = new Date().toISOString();
    const sectionWithMeta = {
      ...sectionData,
      lastUpdated: timestamp,
      updatedBy: userId
    };
    
    const database = await getRealtimeDb();
    const sectionRef = ref(database, `${SYSTEM_CONFIG_PATH}/${section}`);
    await set(sectionRef, sectionWithMeta);
    
    // Actualizar metadata general
    const metadataRef = ref(database, `${SYSTEM_CONFIG_PATH}/metadata`);
    await update(metadataRef, {
      lastUpdated: timestamp
    });
    return {
      success: true,
      message: `Sección ${section} actualizada exitosamente`,
      timestamp
    };
  } catch (error) {
    console.error(`❌ Error actualizando sección ${section}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Inicializa las configuraciones del sistema con valores por defecto
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function initializeSystemConfigurations() {
  try {
    
    const database = await getRealtimeDb();
    const configRef = ref(database, SYSTEM_CONFIG_PATH);
    await set(configRef, DEFAULT_CONFIGURATIONS);
    return {
      success: true,
      message: 'Configuraciones inicializadas exitosamente'
    };
  } catch (error) {
    console.error('❌ Error inicializando configuraciones:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Crea un backup de las configuraciones
 * @param {Object} configurations - Configuraciones a respaldar
 * @param {string} userId - ID del usuario que crea el backup
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function createConfigBackup(configurations, userId = null) {
  try {
    const timestamp = new Date().toISOString();
    const backupId = `backup_${Date.now()}`;
    
    const backupData = {
      ...configurations,
      backupMetadata: {
        backupId,
        createdAt: timestamp,
        createdBy: userId,
        originalTimestamp: configurations.metadata?.lastUpdated || timestamp
      }
    };
    
    const database = await getRealtimeDb();
    const backupRef = ref(database, `systemConfigBackups/${backupId}`);
    await set(backupRef, backupData);
    
    // Actualizar contador de backups
    const metadataRef = ref(database, `${SYSTEM_CONFIG_PATH}/metadata`);
    const currentMetadata = await get(metadataRef);
    const backupCount = (currentMetadata.val()?.backupCount || 0) + 1;
    
    await update(metadataRef, { backupCount });
    return {
      success: true,
      backupId,
      message: 'Backup creado exitosamente'
    };
  } catch (error) {
    console.error('❌ Error creando backup de configuraciones:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Lista todos los backups disponibles
 * @returns {Promise<Object>} Lista de backups
 */
export async function listConfigBackups() {
  try {
    const database = await getRealtimeDb();
    const backupsRef = ref(database, 'systemConfigBackups');
    const snapshot = await get(backupsRef);
    
    if (snapshot.exists()) {
      const backups = snapshot.val();
      const backupList = Object.keys(backups).map(backupId => ({
        backupId,
        ...backups[backupId].backupMetadata,
        size: JSON.stringify(backups[backupId]).length
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return {
        success: true,
        backups: backupList,
        count: backupList.length
      };
    } else {
      return {
        success: true,
        backups: [],
        count: 0
      };
    }
  } catch (error) {
    console.error('❌ Error listando backups:', error);
    return {
      success: false,
      error: error.message,
      backups: []
    };
  }
}

/**
 * Restaura configuraciones desde un backup
 * @param {string} backupId - ID del backup a restaurar
 * @param {string} userId - ID del usuario que restaura
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function restoreFromBackup(backupId, userId = null) {
  try {
    
    const database = await getRealtimeDb();
    const backupRef = ref(database, `systemConfigBackups/${backupId}`);
    const snapshot = await get(backupRef);
    
    if (!snapshot.exists()) {
      return {
        success: false,
        error: 'Backup no encontrado'
      };
    }
    
    const backupData = snapshot.val();
    
    // Crear backup de configuraciones actuales antes de restaurar
    const currentConfigs = await getSystemConfigurations();
    if (currentConfigs.success) {
      await createConfigBackup(currentConfigs.configurations, userId);
    }
    
    // Remover metadata de backup y restaurar
    const { backupMetadata, ...configurations } = backupData;
    
    // Actualizar metadata con información de restauración
    configurations.metadata = {
      ...configurations.metadata,
      lastUpdated: new Date().toISOString(),
      restoredFrom: backupId,
      restoredBy: userId,
      restoredAt: new Date().toISOString()
    };
    
    const configRef = ref(database, SYSTEM_CONFIG_PATH);
    await set(configRef, configurations);
    return {
      success: true,
      message: 'Configuraciones restauradas exitosamente',
      restoredFrom: backupId
    };
  } catch (error) {
    console.error('❌ Error restaurando desde backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Valida las configuraciones antes de guardar
 * @param {Object} configurations - Configuraciones a validar
 * @returns {Object} Resultado de la validación
 */
export function validateConfigurations(configurations) {
  const errors = [];
  const warnings = [];
  
  try {
    // Validaciones para sección general
    if (configurations.general) {
      if (!configurations.general.systemName || configurations.general.systemName.trim().length < 3) {
        errors.push('El nombre del sistema debe tener al menos 3 caracteres');
      }
      
      if (configurations.general.maxFileSize && (configurations.general.maxFileSize < 1 || configurations.general.maxFileSize > 500)) {
        errors.push('El tamaño máximo de archivo debe estar entre 1 y 500 MB');
      }
      
      if (configurations.general.supportEmail && !isValidEmail(configurations.general.supportEmail)) {
        errors.push('Email de soporte no es válido');
      }
      
      if (configurations.general.maintenanceMode) {
        warnings.push('El modo mantenimiento está activado - los usuarios no podrán acceder al sistema');
      }
    }
    
    // Validaciones para sección de seguridad
    if (configurations.security) {
      if (configurations.security.passwordMinLength < 6) {
        errors.push('La longitud mínima de contraseña debe ser al menos 6 caracteres');
      }
      
      if (configurations.security.sessionTimeout < 1 || configurations.security.sessionTimeout > 168) {
        errors.push('El timeout de sesión debe estar entre 1 y 168 horas');
      }
      
      if (configurations.security.maxLoginAttempts < 3 || configurations.security.maxLoginAttempts > 20) {
        errors.push('Los intentos máximos de login deben estar entre 3 y 20');
      }
    }
    
    // Validaciones para APIs
    if (configurations.apis) {
      if (configurations.apis.notificationEmail && !isValidEmail(configurations.apis.notificationEmail)) {
        errors.push('Email de notificaciones no es válido');
      }
      
      if (configurations.apis.imagekitEnabled) {
        if (!configurations.apis.imagekitPublicKey || configurations.apis.imagekitPublicKey === 'public_...') {
          warnings.push('ImageKit está habilitado pero no se ha configurado la clave pública');
        }
        
        if (!configurations.apis.imagekitEndpoint || configurations.apis.imagekitEndpoint === 'https://ik.imagekit.io/...') {
          warnings.push('ImageKit está habilitado pero no se ha configurado el endpoint');
        }
      }
    }
    
    // Validaciones para Firebase
    if (configurations.firebase) {
      if (configurations.firebase.workerUrl && !isValidUrl(configurations.firebase.workerUrl)) {
        errors.push('URL del Cloudflare Worker no es válida');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Error validando configuraciones: ' + error.message],
      warnings: []
    };
  }
}

// Funciones auxiliares
/**
 * Determina la URL base por defecto según el entorno
 * @returns {string} URL base apropiada para el entorno actual
 */
function getDefaultBaseUrl() {
  const currentOrigin = window.location.origin;
  const hostname = window.location.hostname;
  
  // Detectar entornos conocidos y devolver URL apropiada
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Entorno de desarrollo local
    return currentOrigin;
  } else if (hostname.includes('wptassig.dpdns.org')) {
    // Entorno de producción con dominio personalizado
    return 'https://wptassig.dpdns.org';
  } else if (hostname.includes('whitepearltranslations.web.app') || hostname.includes('whitepearltranslations.firebaseapp.com')) {
    // Entorno de Firebase Hosting
    return currentOrigin;
  } else if (hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
    // Entornos de Vercel o Netlify
    return currentOrigin;
  } else {
    // Cualquier otro entorno, usar el origen actual
    return currentOrigin;
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Obtiene el historial de cambios de configuraciones
 * @param {number} limit - Límite de registros a obtener
 * @returns {Promise<Object>} Historial de cambios
 */
export async function getConfigurationHistory(limit = 50) {
  try {
    const backups = await listConfigBackups();
    if (!backups.success) {
      return backups;
    }
    
    // Obtener configuración actual
    const current = await getSystemConfigurations();
    
    const history = [];
    
    // Agregar configuración actual
    if (current.success) {
      history.push({
        timestamp: current.configurations.metadata?.lastUpdated || new Date().toISOString(),
        type: 'current',
        updatedBy: current.configurations.general?.updatedBy || 'system',
        description: 'Configuración actual del sistema'
      });
    }
    
    // Agregar backups como historial
    backups.backups.slice(0, limit - 1).forEach(backup => {
      history.push({
        timestamp: backup.createdAt,
        type: 'backup',
        backupId: backup.backupId,
        updatedBy: backup.createdBy || 'system',
        description: `Backup automático - ${backup.backupId}`
      });
    });
    
    // Ordenar por timestamp descendente
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return {
      success: true,
      history: history.slice(0, limit),
      totalBackups: backups.count
    };
  } catch (error) {
    console.error('❌ Error obteniendo historial de configuraciones:', error);
    return {
      success: false,
      error: error.message,
      history: []
    };
  }
}

// Exportar configuraciones por defecto para referencia
export { DEFAULT_CONFIGURATIONS };
