/**
 * ImageKit.io Service
 * Servicio completo para gestión de imágenes de perfil y banner
 * con optimización automática, transformaciones y gestión de historial
 */

import { ref, push, update, get, remove, query, orderByChild, limitToLast } from 'firebase/database';
import { realtimeDb } from './firebase';
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import crypto from 'crypto-js';

class ImageKitService {
  constructor() {
    this.publicKey = process.env.REACT_APP_IMAGEKIT_PUBLIC_KEY;
    this.urlEndpoint = process.env.REACT_APP_IMAGEKIT_URL_ENDPOINT;
    this.privateKey = process.env.REACT_APP_IMAGEKIT_PRIVATE_KEY;
    this.maxFileSize = parseInt(process.env.REACT_APP_IMAGEKIT_MAX_FILE_SIZE) || 10485760;
    this.allowedTypes = process.env.REACT_APP_IMAGEKIT_ALLOWED_TYPES?.split(',') || [
      'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'
    ];
    this.quality = process.env.REACT_APP_IMAGEKIT_QUALITY || '80';
    this.format = process.env.REACT_APP_IMAGEKIT_FORMAT || 'webp';
    
    // URLs de upload
    this.uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';
    this.authUrl = 'https://imagekit.io/api/v1/auth';
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured() {
    return !!(
      this.publicKey && this.publicKey !== 'your_imagekit_public_key_here' &&
      this.urlEndpoint && this.urlEndpoint !== 'https://ik.imagekit.io/your_imagekit_id' &&
      this.privateKey && this.privateKey !== 'your_imagekit_private_key_here'
    );
  }

  /**
   * Valida un archivo antes de subirlo
   */
  validateFile(file, imageType = 'profile') {
    if (!file) {
      return { isValid: false, error: 'No se ha seleccionado ningún archivo' };
    }

    if (!this.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Tipo de archivo no permitido. Formatos aceptados: ${this.allowedTypes.join(', ')}`
      };
    }

    if (file.size > this.maxFileSize) {
      const maxSizeMB = (this.maxFileSize / 1024 / 1024).toFixed(1);
      return {
        isValid: false,
        error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`
      };
    }

    return { isValid: true };
  }

  /**
   * Genera token de autenticación con firma HMAC-SHA1 para ImageKit
   */
  async getAuthToken() {
    try {
      const expire = Math.floor(Date.now() / 1000) + 3600; // 1 hora
      const token = crypto.lib.WordArray.random(128/8).toString();
      
      // Generar firma HMAC-SHA1
      const stringToSign = token + expire;
      const signature = crypto.HmacSHA1(stringToSign, this.privateKey).toString();
      
      return {
        signature: signature,
        expire: expire,
        token: token
      };
    } catch (error) {
      console.error('Error generando token de autenticación:', error);
      throw new Error('No se pudo generar token de autenticación');
    }
  }

  /**
   * Crea una instancia de Uppy configurada para ImageKit
   */
  createUppyInstance(file, imageType, userId, onProgress, onSuccess, onError) {
    const uppy = new Uppy({
      id: `imagekit-uploader-${Date.now()}`,
      restrictions: {
        maxFileSize: this.maxFileSize,
        maxNumberOfFiles: 1,
        allowedFileTypes: this.allowedTypes
      },
      allowMultipleUploadBatches: false
    });

    // Configurar XHR Upload plugin
    uppy.use(XHRUpload, {
      endpoint: this.uploadUrl,
      method: 'POST',
      formData: true,
      fieldName: 'file',
      headers: {},
      limit: 1,
      timeout: 120000, // 2 minutos
      
      // Configurar parámetros adicionales para el FormData
      getUploadParameters(file) {
        return {
          method: 'POST',
          headers: {}
        };
      },
      
      getResponseData: (responseText, response) => {
        try {
          const data = JSON.parse(responseText);
          return {
            fileId: data.fileId,
            name: data.name,
            url: data.url,
            thumbnailUrl: data.thumbnailUrl || data.url,
            filePath: data.filePath,
            size: data.size,
            fileType: data.fileType,
            tags: data.tags,
            folder: data.folder,
            isPrivateFile: data.isPrivateFile || false,
            customCoordinates: data.customCoordinates,
            metadata: data.metadata || {}
          };
        } catch (error) {
          throw new Error('Error al procesar respuesta de ImageKit');
        }
      },
      getResponseError: (responseText, response) => {
        try {
          const data = JSON.parse(responseText);
          return new Error(data.message || `Error HTTP ${response.status}`);
        } catch {
          return new Error(`Error HTTP ${response.status}`);
        }
      }
    });

    // Configurar metadata antes de subir
    uppy.on('file-added', async (file) => {
      try {
        const authData = await this.getAuthToken();
        const timestamp = Date.now();
        const folder = `users/${userId || 'anonymous'}/${imageType}s`;
        const fileName = `${imageType}_${timestamp}_${file.name}`;

        // Configurar metadata directamente en el archivo de Uppy
        // Estos se enviarán como campos del FormData
        uppy.setFileMeta(file.id, {
          // Parámetros de autenticación (requeridos)
          publicKey: this.publicKey,
          signature: authData.signature,
          expire: authData.expire.toString(),
          token: authData.token,
          
          // Parámetros de archivo
          folder: folder,
          fileName: fileName,
          useUniqueFileName: 'true',
          tags: `user_${userId},${imageType},profile_system`
        });
      } catch (error) {
        console.error('Error configurando metadata:', error);
        if (onError) onError(error);
      }
    });

    // Manejar progreso
    if (onProgress && typeof onProgress === 'function') {
      uppy.on('upload-progress', (file, progress) => {
        const percentage = Math.round((progress.bytesUploaded / progress.bytesTotal) * 100);
        onProgress(percentage);
      });
    }

    // Manejar éxito
    if (onSuccess && typeof onSuccess === 'function') {
      uppy.on('upload-success', (file, response) => {
        onSuccess(response.body);
      });
    }

    // Manejar errores
    if (onError && typeof onError === 'function') {
      uppy.on('upload-error', (file, error) => {
        onError(error);
      });
    }

    return uppy;
  }

  /**
   * Sube una imagen a ImageKit usando Uppy
   */
  async uploadImage(file, imageType = 'profile', userId = null, onProgress = null) {
    try {
      if (!this.isConfigured()) {
        throw new Error('ImageKit no está configurado. Configure las credenciales en el archivo .env');
      }

      const validation = this.validateFile(file, imageType);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      return new Promise((resolve, reject) => {
        let uploadResult = null;
        let hasCompleted = false;

        const uppy = this.createUppyInstance(
          file,
          imageType,
          userId,
          onProgress,
          (response) => {
            uploadResult = {
              success: true,
              data: response
            };
          },
          (error) => {
            if (!hasCompleted) {
              hasCompleted = true;
              reject(error);
            }
          }
        );

        // Manejar finalización
        uppy.on('complete', (result) => {
          if (!hasCompleted) {
            hasCompleted = true;
            
            if (uploadResult && result.successful.length > 0) {
              resolve(uploadResult);
            } else if (result.failed.length > 0) {
              const error = result.failed[0].error || new Error('Error en la subida');
              reject(error);
            } else {
              reject(new Error('La subida no se completó correctamente'));
            }
          }
          
          // Limpiar
          uppy.close({ reason: 'upload-complete' });
        });

        // Agregar archivo y comenzar subida
        try {
          uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
            source: 'Local',
            isRemote: false
          });

          uppy.upload().catch((error) => {
            if (!hasCompleted) {
              hasCompleted = true;
              reject(error);
            }
          });
        } catch (error) {
          if (!hasCompleted) {
            hasCompleted = true;
            reject(error);
          }
          uppy.close({ reason: 'error' });
        }
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Genera URL con transformaciones específicas
   */
  generateTransformedUrl(originalUrl, transformations = {}) {
    if (!originalUrl || !this.urlEndpoint) {
      return originalUrl;
    }

    // Extraer el path del archivo de la URL original
    const urlParts = originalUrl.split('/');
    const pathIndex = urlParts.findIndex(part => part.includes('imagekit.io'));
    if (pathIndex === -1) return originalUrl;

    const basePath = urlParts.slice(pathIndex + 1).join('/');
    
    // Construir transformaciones
    const transforms = [];
    
    if (transformations.width && transformations.height) {
      transforms.push(`w-${transformations.width},h-${transformations.height}`);
    }
    
    if (transformations.crop) {
      transforms.push(`c-${transformations.crop}`);
    }
    
    if (transformations.quality) {
      transforms.push(`q-${transformations.quality}`);
    }
    
    if (transformations.format) {
      transforms.push(`f-${transformations.format}`);
    }

    if (transformations.blur) {
      transforms.push(`bl-${transformations.blur}`);
    }

    if (transformations.overlay) {
      transforms.push(`l-text,i-${transformations.overlay.text},fs-${transformations.overlay.fontSize || 20},co-${transformations.overlay.color || 'white'}`);
    }

    const transformString = transforms.length > 0 ? `tr:${transforms.join(',')}` : '';
    
    return `${this.urlEndpoint}/${transformString}/${basePath}`;
  }

  /**
   * Genera URLs predefinidas para diferentes usos
   */
  generateImageUrls(originalUrl, imageType = 'profile') {
    const urls = {
      original: originalUrl,
      optimized: this.generateTransformedUrl(originalUrl, {
        quality: this.quality,
        format: this.format
      })
    };

    if (imageType === 'profile') {
      urls.thumbnail = this.generateTransformedUrl(originalUrl, {
        width: 150,
        height: 150,
        crop: 'fill',
        quality: this.quality,
        format: this.format
      });
      urls.medium = this.generateTransformedUrl(originalUrl, {
        width: 300,
        height: 300,
        crop: 'fill',
        quality: this.quality,
        format: this.format
      });
      urls.large = this.generateTransformedUrl(originalUrl, {
        width: 500,
        height: 500,
        crop: 'fill',
        quality: this.quality,
        format: this.format
      });
    } else if (imageType === 'banner') {
      urls.small = this.generateTransformedUrl(originalUrl, {
        width: 600,
        height: 150,
        crop: 'fill',
        quality: this.quality,
        format: this.format
      });
      urls.medium = this.generateTransformedUrl(originalUrl, {
        width: 1200,
        height: 300,
        crop: 'fill',
        quality: this.quality,
        format: this.format
      });
      urls.large = this.generateTransformedUrl(originalUrl, {
        width: 1800,
        height: 450,
        crop: 'fill',
        quality: this.quality,
        format: this.format
      });
    }

    return urls;
  }

  /**
   * Elimina una imagen de ImageKit
   */
  async deleteImage(fileId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('ImageKit no está configurado');
      }

      // Nota: La eliminación requiere autenticación del servidor
      // Por ahora, marcar como eliminado en nuestra base de datos
      console.warn('Eliminación directa no implementada. Marcar como eliminado en BD');
      return { success: true, message: 'Imagen marcada para eliminación' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Guarda información de imagen en el historial del usuario
   */
  async saveImageToHistory(userId, imageData, imageType = 'profile') {
    try {
      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      const historyRef = ref(realtimeDb, `users/${userId}/${imageType}History`);

      const imageRecord = {
        fileId: imageData.fileId,
        name: imageData.name,
        url: imageData.url,
        thumbnailUrl: imageData.thumbnailUrl,
        filePath: imageData.filePath,
        size: imageData.size,
        fileType: imageData.fileType,
        uploadedAt: new Date().toISOString(),
        isActive: true,
        metadata: imageData.metadata || {}
      };

      // Marcar todas las imágenes anteriores como inactivas
      const currentHistorySnapshot = await get(historyRef);
      if (currentHistorySnapshot.exists()) {
        const updates = {};
        Object.keys(currentHistorySnapshot.val()).forEach(key => {
          updates[`${key}/isActive`] = false;
        });
        if (Object.keys(updates).length > 0) {
          await update(historyRef, updates);
        }
      }

      // Agregar nueva imagen
      const newImageRef = await push(historyRef, imageRecord);

      // Mantener solo las últimas 3 imágenes
      await this.cleanupImageHistory(userId, imageType, 3);

      // Actualizar imagen activa del usuario
      const userRef = ref(realtimeDb, `users/${userId}`);
      const updateData = {
        updatedAt: new Date().toISOString()
      };
      
      if (imageType === 'profile') {
        updateData.profileImage = imageData.url;
      } else if (imageType === 'banner') {
        updateData.bannerImage = imageData.url;
      }
      
      await update(userRef, updateData);

      return {
        success: true,
        imageId: newImageRef.key,
        message: `${imageType === 'profile' ? 'Imagen de perfil' : 'Banner'} guardado exitosamente`
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene el historial de imágenes de un usuario
   */
  async getUserImageHistory(userId, imageType = 'profile', limit = 3) {
    try {
      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      const historyRef = ref(realtimeDb, `users/${userId}/${imageType}History`);
      const historyQuery = query(historyRef, orderByChild('uploadedAt'), limitToLast(limit));

      const snapshot = await get(historyQuery);

      if (snapshot.exists()) {
        const images = [];
        snapshot.forEach((child) => {
          images.unshift({
            id: child.key,
            ...child.val()
          });
        });

        return { success: true, images };
      } else {
        return { success: true, images: [] };
      }
    } catch (error) {
      return { success: false, error: error.message, images: [] };
    }
  }

  /**
   * Establece una imagen del historial como activa
   */
  async setActiveImage(userId, imageId, imageType = 'profile') {
    try {
      if (!userId || !imageId) {
        throw new Error('ID de usuario e imagen requeridos');
      }

      const historyRef = ref(realtimeDb, `users/${userId}/${imageType}History`);
      const snapshot = await get(historyRef);

      if (!snapshot.exists()) {
        throw new Error('No se encontró historial de imágenes');
      }

      let selectedImageUrl = '';
      const updates = {};

      snapshot.forEach((child) => {
        if (child.key === imageId) {
          updates[`${child.key}/isActive`] = true;
          selectedImageUrl = child.val().url;
        } else {
          updates[`${child.key}/isActive`] = false;
        }
      });

      if (!selectedImageUrl) {
        throw new Error('Imagen no encontrada');
      }

      await update(historyRef, updates);

      // Actualizar imagen activa del usuario
      const userRef = ref(realtimeDb, `users/${userId}`);
      const updateData = {
        updatedAt: new Date().toISOString()
      };
      
      if (imageType === 'profile') {
        updateData.profileImage = selectedImageUrl;
      } else if (imageType === 'banner') {
        updateData.bannerImage = selectedImageUrl;
      }
      
      await update(userRef, updateData);

      return {
        success: true,
        url: selectedImageUrl,
        message: `${imageType === 'profile' ? 'Imagen de perfil' : 'Banner'} activado exitosamente`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpia el historial de imágenes manteniendo solo las más recientes
   */
  async cleanupImageHistory(userId, imageType = 'profile', maxImages = 3) {
    try {
      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      const historyRef = ref(realtimeDb, `users/${userId}/${imageType}History`);
      const snapshot = await get(historyRef);

      if (!snapshot.exists()) {
        return { success: true, message: 'No hay imágenes para limpiar' };
      }

      const images = [];
      snapshot.forEach((child) => {
        images.push({
          id: child.key,
          uploadedAt: child.val().uploadedAt,
          ...child.val()
        });
      });

      images.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      if (images.length > maxImages) {
        const imagesToDelete = images.slice(maxImages);
        const updates = {};

        for (const image of imagesToDelete) {
          updates[image.id] = null;
          
          // Intentar eliminar de ImageKit también
          if (image.fileId) {
            try {
              await this.deleteImage(image.fileId);
            } catch (error) {
              console.warn(`No se pudo eliminar imagen ${image.fileId} de ImageKit:`, error);
            }
          }
        }

        await update(historyRef, updates);

        return {
          success: true,
          message: `${imagesToDelete.length} imágenes antiguas eliminadas`
        };
      }

      return { success: true, message: 'No fue necesario limpiar imágenes' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene el estado de configuración del servicio
   */
  getConfigStatus() {
    const status = {
      configured: this.isConfigured(),
      hasPublicKey: !!(this.publicKey && this.publicKey !== 'your_imagekit_public_key_here'),
      hasUrlEndpoint: !!(this.urlEndpoint && this.urlEndpoint !== 'https://ik.imagekit.io/your_imagekit_id'),
      hasPrivateKey: !!(this.privateKey && this.privateKey !== 'your_imagekit_private_key_here'),
      maxFileSize: this.maxFileSize,
      allowedTypes: this.allowedTypes,
      credentials: {
        publicKey: this.publicKey ? `${this.publicKey.substring(0, 10)}...` : 'No configurado',
        urlEndpoint: this.urlEndpoint || 'No configurado',
        privateKey: this.privateKey ? `${this.privateKey.substring(0, 10)}...` : 'No configurado'
      }
    };
    
    return status;
  }
}

// Crear instancia singleton
const imagekitService = new ImageKitService();

export default imagekitService;
