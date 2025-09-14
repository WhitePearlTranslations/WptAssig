/**
 * Servicio para manejo de Google Drive API
 * Permite subir archivos, crear carpetas y gestionar permisos
 */

class GoogleDriveService {
  constructor() {
    this.isGapiLoaded = false;
    this.isSignedIn = false;
    this.gapi = null;
    this.tokenClient = null;
    this.accessToken = null;
    this.tokenExpiresAt = null;
    
    // Intentar cargar token guardado al inicializar
    this.loadStoredToken();
  }
  
  // Guardar token en localStorage
  saveToken(token, expiresIn) {
    try {
      const expiresAt = Date.now() + (expiresIn * 1000); // expiresIn viene en segundos
      const tokenData = {
        accessToken: token,
        expiresAt: expiresAt,
        savedAt: Date.now()
      };
      
      localStorage.setItem('googleDriveToken', JSON.stringify(tokenData));
      this.tokenExpiresAt = expiresAt;
    } catch (error) {
      // Silently handle token save error
    }
  }
  
  // Cargar token guardado desde localStorage
  loadStoredToken() {
    try {
      const stored = localStorage.getItem('googleDriveToken');
      if (!stored) return false;
      
      const tokenData = JSON.parse(stored);
      const now = Date.now();
      
      // Verificar si el token no ha expirado (con margen de 5 minutos)
      if (tokenData.expiresAt && now < (tokenData.expiresAt - 300000)) {
        this.accessToken = tokenData.accessToken;
        this.tokenExpiresAt = tokenData.expiresAt;
        this.isSignedIn = true;
        
        return true;
      } else {
        this.clearStoredToken();
        return false;
      }
    } catch (error) {
      this.clearStoredToken();
      return false;
    }
  }
  
  // Limpiar token guardado
  clearStoredToken() {
    try {
      localStorage.removeItem('googleDriveToken');
    } catch (error) {
      // Silently handle token cleanup error
    }
  }
  
  // Verificar si el token actual sigue siendo válido
  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiresAt) {
      return false;
    }
    
    // Considerar válido si faltan más de 5 minutos para expirar
    return Date.now() < (this.tokenExpiresAt - 300000);
  }

  // Cargar la biblioteca de Google API y Google Identity Services
  async loadGapi() {
    if (this.isGapiLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
      // Cargar Google API
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => {
        // Cargar Google Identity Services
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.onload = async () => {
          try {
            await this.initializeServices();
            this.isGapiLoaded = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        gisScript.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
        document.head.appendChild(gisScript);
      };
      gapiScript.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(gapiScript);
    });
  }

  // Inicializar Google API y Google Identity Services
  async initializeServices() {
    const API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;
    const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
    const SCOPES = 'https://www.googleapis.com/auth/drive';

    if (!API_KEY || !CLIENT_ID) {
      throw new Error('Google Drive API keys not configured. Please check your .env file.');
    }

    // Inicializar GAPI client sin Discovery Document (para evitar errores 502)
    await new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY
            // No usar discoveryDocs para evitar errores 502
          });
          this.gapi = window.gapi;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });

    // Inicializar Google Identity Services para autenticación
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          return;
        }
        this.accessToken = response.access_token;
        this.isSignedIn = true;
      },
    });
  }

  // Limpiar autenticación actual
  clearAuth() {
    this.isSignedIn = false;
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.clearStoredToken();
  }

  // Iniciar sesión en Google usando Google Identity Services
  async signIn() {
    if (!this.isGapiLoaded) {
      await this.loadGapi();
    }

    if (this.isSignedIn && this.isTokenValid()) {
      return true;
    }
    
    if (this.accessToken && !this.isTokenValid()) {
      this.clearAuth();
    }

    return new Promise((resolve, reject) => {
      try {
        // Actualizar el callback del tokenClient para esta llamada específica
        this.tokenClient.callback = (response) => {
          if (response.error) {
            reject(new Error(`Authentication failed: ${response.error}`));
            return;
          }
          
          this.accessToken = response.access_token;
          this.isSignedIn = true;
          
          const expiresIn = response.expires_in || 3600;
          this.saveToken(response.access_token, expiresIn);
          
          resolve(true);
        };
        
        this.tokenClient.requestAccessToken({ prompt: '' });
        
      } catch (error) {
        reject(new Error('Failed to sign in to Google Drive. Please try again.'));
      }
    });
  }

  // Verificar el token haciendo una llamada de prueba
  async verifyToken() {
    if (!this.accessToken) {
      return false;
    }
    
    try {
      // Hacer una llamada simple a la API para verificar que el token funciona
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (response.ok) {
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      this.clearAuth();
      return false;
    }
  }
  
  // Verificar si el usuario está autenticado
  async ensureSignedIn() {
    // Primero verificar si tenemos token y si es válido
    if (this.isSignedIn && this.isTokenValid()) {
      // Verificar que el token realmente funciona con una llamada de prueba
      const isWorking = await this.verifyToken();
      if (isWorking) {
        return;
      }
    }
    
    // Si llegamos aquí, necesitamos autenticar
    await this.signIn();
  }

  // Probar si la API Key funciona correctamente
  async testApiKey() {
    const API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;
    
    if (!API_KEY) {
      return false;
    }
    
    return true;
  }
  
  // Extraer ID de carpeta desde URL de Google Drive
  extractFolderIdFromUrl(url) {
    if (!url) {
      return null;
    }
    
    // Patrones comunes de URLs de Google Drive (más completos)
    const patterns = [
      // https://drive.google.com/drive/folders/ID
      /\/drive\/folders\/([a-zA-Z0-9-_]+)/,
      // https://drive.google.com/folders/ID
      /\/folders\/([a-zA-Z0-9-_]+)/,
      // https://drive.google.com/open?id=ID
      /[?&]id=([a-zA-Z0-9-_]+)/,
      // https://drive.google.com/drive/u/0/folders/ID
      /\/drive\/u\/\d+\/folders\/([a-zA-Z0-9-_]+)/,
      // Solo el ID si se pasa directamente
      /^([a-zA-Z0-9-_]{25,})$/
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  // Listar archivos en una carpeta específica para vista previa
  async listFolderFiles(folderId, maxResults = 100) {
    if (!this.isSignedIn || !this.isTokenValid()) {
      throw new Error('Usuario no autenticado en Google Drive');
    }

    try {

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?` + new URLSearchParams({
          q: `'${folderId}' in parents and trashed=false`,
          pageSize: maxResults,
          fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,iconLink,webContentLink),nextPageToken',
          orderBy: 'name'
        }),
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuth();
          throw new Error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
        }
        throw new Error(`Error al listar archivos: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Procesar archivos para agregar información útil
      const processedFiles = (data.files || []).map(file => {
        const fileInfo = this.getFileTypeInfo(file.mimeType, file.name);
        const isImage = fileInfo.category === 'image';
        
        return {
          ...file,
          ...fileInfo,
          formattedSize: this.formatFileSize(parseInt(file.size) || 0),
          formattedDate: file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('es-ES') : 'N/A',
          previewUrl: this.getPreviewUrl(file),
          directViewUrl: this.getDirectViewUrl(file),
          canPreview: this.canPreviewFile(file),
          // Para imágenes, agregar múltiples URLs de fallback
          ...(isImage ? { imageUrls: this.generateImageUrls(file) } : {})
        };
      });

      return {
        files: processedFiles,
        nextPageToken: data.nextPageToken
      };

    } catch (error) {
      console.error('💥 Error listando archivos:', error);
      throw error;
    }
  }

  // Obtener información de tipo de archivo
  getFileTypeInfo(mimeType, fileName) {
    if (!mimeType && !fileName) return { type: 'unknown', category: 'other', icon: '📄' };
    
    // CARPETAS - Detectar primero por mimeType
    if (mimeType === 'application/vnd.google-apps.folder') {
      return {
        type: 'folder', 
        category: 'folder', 
        icon: '📁', 
        color: '#f59e0b',
        canEmbed: false, // Las carpetas no se pueden embeber
        isFolder: true
      };
    }
    
    const extension = fileName ? fileName.split('.').pop().toLowerCase() : '';
    
    // Imágenes
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return { type: 'image', category: 'image', icon: '🖼️', color: '#10b981' };
    }
    
    // PDFs
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return { type: 'pdf', category: 'document', icon: '📄', color: '#ef4444' };
    }
    
    // Videos
    if (mimeType?.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
      return { type: 'video', category: 'media', icon: '🎥', color: '#8b5cf6' };
    }
    
    // Audio
    if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac', 'wma'].includes(extension)) {
      return { type: 'audio', category: 'media', icon: '🎵', color: '#06b6d4' };
    }
    
    // Documentos de texto
    if (
      mimeType?.includes('document') || 
      mimeType?.includes('text') ||
      ['txt', 'rtf', 'doc', 'docx'].includes(extension)
    ) {
      return { type: 'document', category: 'document', icon: '📝', color: '#3b82f6' };
    }
    
    // Hojas de cálculo
    if (
      mimeType?.includes('spreadsheet') ||
      ['xls', 'xlsx', 'csv'].includes(extension)
    ) {
      return { type: 'spreadsheet', category: 'document', icon: '📊', color: '#10b981' };
    }
    
    // Presentaciones
    if (
      mimeType?.includes('presentation') ||
      ['ppt', 'pptx'].includes(extension)
    ) {
      return { type: 'presentation', category: 'document', icon: '📽️', color: '#f59e0b' };
    }
    
    // Archivos comprimidos
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
      return { type: 'archive', category: 'archive', icon: '📦', color: '#6b7280' };
    }
    
    // Google Apps
    if (mimeType?.includes('google-apps')) {
      if (mimeType.includes('document')) {
        return { type: 'google-doc', category: 'document', icon: '📄', color: '#4285f4' };
      } else if (mimeType.includes('spreadsheet')) {
        return { type: 'google-sheet', category: 'document', icon: '📊', color: '#34a853' };
      } else if (mimeType.includes('presentation')) {
        return { type: 'google-slide', category: 'document', icon: '📽️', color: '#fbbc05' };
      }
    }

    return { type: 'unknown', category: 'other', icon: '📄', color: '#6b7280' };
  }

  // Generar URL de vista previa para archivos
  getPreviewUrl(file) {
    if (!file.id) return null;
    
    // Para archivos de Google Apps, usar webViewLink
    if (file.mimeType?.includes('google-apps')) {
      return file.webViewLink;
    }
    
    // Para imágenes, intentar URL directa primero
    if (file.mimeType?.startsWith('image/')) {
      return `https://drive.google.com/uc?id=${file.id}`;
    }
    
    // Para otros archivos, usar URL de preview
    return `https://drive.google.com/file/d/${file.id}/preview`;
  }

  // Generar URL de vista directa (especialmente para imágenes)
  getDirectViewUrl(file) {
    if (!file.id) return null;
    return `https://drive.google.com/uc?id=${file.id}&export=view`;
  }

  // Generar múltiples URLs para imágenes (fallback robusto)
  generateImageUrls(file) {
    if (!file.id) return [];
    
    return [
      // URL principal - directo de Google Drive
      `https://drive.google.com/uc?id=${file.id}`,
      
      // URL alternativa con export=view
      `https://drive.google.com/uc?id=${file.id}&export=view`,
      
      // URL alternativa con export=download
      `https://drive.google.com/uc?id=${file.id}&export=download`,
      
      // URL usando lh3.googleusercontent.com (para imágenes públicas)
      `https://lh3.googleusercontent.com/d/${file.id}`,
      
      // URL de thumbnail si está disponible
      ...(file.thumbnailLink ? [file.thumbnailLink] : []),
      
      // URL usando drive.google.com/thumbnail
      `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`,
      
      // URL de webContentLink si está disponible
      ...(file.webContentLink ? [file.webContentLink] : []),
      
      // URL usando docs.google.com para vista
      `https://docs.google.com/uc?id=${file.id}`,
      
      // URL alternativa usando lh4.googleusercontent.com
      `https://lh4.googleusercontent.com/d/${file.id}`,
      
      // URL usando lh5.googleusercontent.com
      `https://lh5.googleusercontent.com/d/${file.id}`,
    ].filter(Boolean); // Filtrar URLs vacías o undefined
  }

  // Crear URL de proxy para imágenes autenticadas
  async getAuthenticatedImageUrl(fileId) {
    if (!this.accessToken) {
      throw new Error('Token de autenticación no disponible');
    }

    try {
      // Intentar obtener la imagen usando el token de autenticación
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        return imageUrl;
      } else {
        throw new Error(`Error al obtener imagen: ${response.status}`);
      }
    } catch (error) {
      console.error('📷 Error obteniendo imagen autenticada:', error);
      throw error;
    }
  }

  // Generar datos de imagen como Data URL (base64)
  async getImageAsDataUrl(fileId) {
    if (!this.accessToken) {
      throw new Error('Token de autenticación no disponible');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } else {
        throw new Error(`Error al obtener imagen: ${response.status}`);
      }
    } catch (error) {
      console.error('📷 Error obteniendo imagen como DataURL:', error);
      throw error;
    }
  }

  // Verificar si un archivo se puede previsualizar
  canPreviewFile(file) {
    if (!file.mimeType) return false;
    
    const previewableTypes = [
      'application/pdf',
      'image/',
      'video/',
      'audio/',
      'text/',
      'google-apps'
    ];
    
    return previewableTypes.some(type => file.mimeType.includes(type));
  }

  // Formatear tamaño de archivo
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Subir archivo a Google Drive (con soporte para estructura de carpetas)
  async uploadFile(file, folderId, onProgress = null, preservePath = false) {
    await this.ensureSignedIn();
    
    let targetFolderId = folderId;
    if (preservePath && file.webkitRelativePath) {
      targetFolderId = await this.createFolderStructure(file.webkitRelativePath, folderId);
    }

    return new Promise((resolve, reject) => {
      try {
        const metadata = {
          name: file.name,
          parents: targetFolderId ? [targetFolderId] : undefined
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', file);

        const xhr = new XMLHttpRequest();
        const token = this.accessToken;
        
        if (!token) {
          reject(new Error('No access token available. Please sign in again.'));
          return;
        }
        
        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              onProgress(percentComplete);
            }
          });
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({
                id: response.id,
                name: response.name,
                webViewLink: `https://drive.google.com/file/d/${response.id}/view`,
                downloadLink: `https://drive.google.com/uc?id=${response.id}`
              });
            } catch (parseError) {
              reject(new Error(`Error parseando respuesta: ${parseError.message}`));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };

        xhr.onerror = (error) => {
          reject(new Error('Network error during upload'));
        };
        
        xhr.send(form);
        
      } catch (setupError) {
        reject(setupError);
      }
    });
  }

  // Subir múltiples archivos (version original - archivos individuales)
  async uploadFiles(files, folderId, onProgress = null) {
    return this.uploadFilesWithStructure(files, folderId, onProgress, false);
  }
  
  // Subir múltiples archivos con opción de preservar estructura
  async uploadFilesWithStructure(files, folderId, onProgress = null, preserveStructure = false) {
    const hasStructure = preserveStructure && files.some(f => f.webkitRelativePath);
    
    const results = [];
    const totalFiles = files.length;
    let completedFiles = 0;

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, folderId, (fileProgress) => {
          const overallProgress = ((completedFiles / totalFiles) + (fileProgress / 100) / totalFiles) * 100;
          const fileName = file.webkitRelativePath || file.name;
          if (onProgress) onProgress(overallProgress, fileName);
        }, preserveStructure);
        results.push({
          file: file.webkitRelativePath || file.name,
          success: true,
          result: result
        });
        
        completedFiles++;
      } catch (error) {
        results.push({
          file: file.webkitRelativePath || file.name,
          success: false,
          error: error.message
        });
        completedFiles++;
      }
    }

    return results;
  }

  // Obtener información de una carpeta usando fetch directo
  async getFolderInfo(folderId) {
    await this.ensureSignedIn();

    try {
      const url = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,parents,webViewLink`;
      
      if (!this.accessToken) {
        throw new Error('No access token available');
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data;
    } catch (error) {
      throw new Error(`Failed to get folder information: ${error.message}`);
    }
  }

  // Listar archivos en una carpeta
  async listFilesInFolder(folderId, maxResults = 100) {
    await this.ensureSignedIn();

    try {
      const response = await this.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: maxResults,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink)'
      });
      
      return response.result.files || [];
    } catch (error) {
      throw new Error('Failed to list files in folder');
    }
  }

  // Crear una carpeta usando fetch directo (más compatible)
  async createFolder(name, parentFolderId = null) {
    await this.ensureSignedIn();

    const metadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined
    };

    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }
  
  // Buscar si una carpeta ya existe en el directorio padre
  async findFolderByName(name, parentFolderId) {
    await this.ensureSignedIn();
    
    try {
      const query = parentFolderId ? 
        `name='${name}' and parents in '${parentFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false` :
        `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,parents)`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.files && data.files.length > 0 ? data.files[0] : null;
    } catch (error) {
      return null;
    }
  }
  
  // Crear o encontrar una carpeta (evita duplicados)
  async createOrFindFolder(name, parentFolderId = null) {
    // Primero intentar encontrar la carpeta
    const existingFolder = await this.findFolderByName(name, parentFolderId);
    
    if (existingFolder) {
      return existingFolder;
    }
    
    // Si no existe, crearla
    return await this.createFolder(name, parentFolderId);
  }
  
  // Crear estructura de carpetas basada en la ruta del archivo
  async createFolderStructure(filePath, baseFolderId) {
    const pathParts = filePath.split('/').filter(part => part.length > 0);
    
    // Remover el nombre del archivo (ultima parte)
    const folderParts = pathParts.slice(0, -1);
    
    if (folderParts.length === 0) {
      return baseFolderId;
    }
    
    let currentFolderId = baseFolderId;
    
    for (const folderName of folderParts) {
      const folder = await this.createOrFindFolder(folderName, currentFolderId);
      currentFolderId = folder.id;
    }
    
    return currentFolderId;
  }

  // Verificar permisos de una carpeta
  async checkFolderPermissions(folderId) {
    await this.ensureSignedIn();

    try {
      const response = await this.gapi.client.drive.files.get({
        fileId: folderId,
        fields: 'permissions,capabilities'
      });
      
      return {
        canEdit: response.result.capabilities?.canEdit || false,
        canAddChildren: response.result.capabilities?.canAddChildren || false,
        permissions: response.result.permissions || []
      };
    } catch (error) {
      return {
        canEdit: false,
        canAddChildren: false,
        permissions: []
      };
    }
  }
}

// Exportar una instancia singleton del servicio
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
