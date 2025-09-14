/**
 * Utilidades para manejar archivos y URLs de Google Drive
 * Incluye funciones para convertir URLs a formatos embedables y detectar tipos de archivo
 */

/**
 * Extrae el ID de archivo de una URL de Google Drive
 * @param {string} url - URL de Google Drive
 * @returns {string|null} ID del archivo o null si no es válida
 */
export const extractDriveFileId = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Diferentes formatos de URLs de Google Drive
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,           // https://drive.google.com/file/d/ID/view
    /\/open\?id=([a-zA-Z0-9-_]+)/,          // https://drive.google.com/open?id=ID
    /\/document\/d\/([a-zA-Z0-9-_]+)/,      // Google Docs
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,  // Google Sheets
    /\/presentation\/d\/([a-zA-Z0-9-_]+)/,  // Google Slides
    /\/folders\/([a-zA-Z0-9-_]+)/,          // Carpetas de Google Drive
    /\/drive\/u\/\d+\/folders\/([a-zA-Z0-9-_]+)/, // Carpetas con usuario específico
    /id=([a-zA-Z0-9-_]+)/,                  // Cualquier URL con id=
    /\/d\/([a-zA-Z0-9-_]+)/                 // Formato genérico
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
};

/**
 * Detecta si una URL es de una carpeta de Google Drive
 * @param {string} url - URL a verificar
 * @returns {boolean} true si es una carpeta
 */
export const isDriveFolder = (url) => {
  if (!url) return false;
  
  const folderPatterns = [
    /\/drive\/folders\//,
    /\/drive\/u\/\d+\/folders\//,
    /\/folders\//,
    /folder/,
    /folderview/
  ];
  
  const isFolder = folderPatterns.some(pattern => pattern.test(url));
  
  return isFolder;
};

/**
 * Extrae el ID de carpeta de una URL de Google Drive
 * @param {string} url - URL de carpeta de Google Drive
 * @returns {string|null} ID de la carpeta o null
 */
export const extractDriveFolderId = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  const patterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,
    /\/drive\/u\/\d+\/folders\/([a-zA-Z0-9-_]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Convierte una URL de Google Drive a formato de vista previa embedable
 * @param {string} url - URL original de Google Drive
 * @returns {string|null} URL embedable o null si no es válida
 */
export const getDriveEmbedUrl = (url) => {
  const fileId = extractDriveFileId(url);
  if (!fileId) return null;

  // URL para vista previa embedable
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

/**
 * Convierte una URL de Google Drive a formato de descarga directa
 * @param {string} url - URL original de Google Drive
 * @returns {string|null} URL de descarga o null si no es válida
 */
export const getDriveDownloadUrl = (url) => {
  const fileId = extractDriveFileId(url);
  if (!fileId) return null;

  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

/**
 * Convierte una URL de Google Drive a formato de vista directa (para imágenes)
 * @param {string} url - URL original de Google Drive
 * @returns {string|null} URL de vista directa o null si no es válida
 */
export const getDriveDirectViewUrl = (url) => {
  const fileId = extractDriveFileId(url);
  if (!fileId) return null;

  return `https://drive.google.com/uc?id=${fileId}`;
};

/**
 * Detecta el tipo de archivo basado en la extensión de la URL o nombre
 * @param {string} url - URL o nombre del archivo
 * @returns {Object} Objeto con información del tipo de archivo
 */
export const detectFileType = (url) => {
  if (!url) return { type: 'unknown', category: 'other', canEmbed: false };

  const urlLower = url.toLowerCase();
  
  // Imágenes
  if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)($|\?|#)/.test(urlLower)) {
    return {
      type: 'image',
      category: 'image',
      canEmbed: true,
      icon: '🖼️'
    };
  }
  
  // PDFs
  if (/\.pdf($|\?|#)/.test(urlLower)) {
    return {
      type: 'pdf',
      category: 'document',
      canEmbed: true,
      icon: '📄'
    };
  }
  
  // Videos
  if (/\.(mp4|avi|mov|wmv|flv|webm|mkv)($|\?|#)/.test(urlLower)) {
    return {
      type: 'video',
      category: 'media',
      canEmbed: true,
      icon: '🎥'
    };
  }
  
  // Audio
  if (/\.(mp3|wav|ogg|aac|flac|wma)($|\?|#)/.test(urlLower)) {
    return {
      type: 'audio',
      category: 'media',
      canEmbed: true,
      icon: '🎵'
    };
  }
  
  // Documentos de texto
  if (/\.(txt|rtf|doc|docx)($|\?|#)/.test(urlLower)) {
    return {
      type: 'document',
      category: 'document',
      canEmbed: false,
      icon: '📝'
    };
  }
  
  // Hojas de cálculo
  if (/\.(xls|xlsx|csv)($|\?|#)/.test(urlLower)) {
    return {
      type: 'spreadsheet',
      category: 'document',
      canEmbed: false,
      icon: '📊'
    };
  }
  
  // Presentaciones
  if (/\.(ppt|pptx)($|\?|#)/.test(urlLower)) {
    return {
      type: 'presentation',
      category: 'document',
      canEmbed: false,
      icon: '📽️'
    };
  }
  
  // Archivos comprimidos
  if (/\.(zip|rar|7z|tar|gz|bz2)($|\?|#)/.test(urlLower)) {
    return {
      type: 'archive',
      category: 'archive',
      canEmbed: false,
      icon: '📦'
    };
  }
  
  // Código
  if (/\.(js|html|css|json|xml|py|java|cpp|c|php|rb|go|ts)($|\?|#)/.test(urlLower)) {
    return {
      type: 'code',
      category: 'code',
      canEmbed: false,
      icon: '💻'
    };
  }

  // Google Drive específicos
  if (urlLower.includes('docs.google.com')) {
    return {
      type: 'google-doc',
      category: 'document',
      canEmbed: true,
      icon: '📄'
    };
  }
  
  if (urlLower.includes('sheets.google.com')) {
    return {
      type: 'google-sheet',
      category: 'document',
      canEmbed: true,
      icon: '📊'
    };
  }
  
  if (urlLower.includes('slides.google.com')) {
    return {
      type: 'google-slide',
      category: 'document',
      canEmbed: true,
      icon: '📽️'
    };
  }

  return {
    type: 'unknown',
    category: 'other',
    canEmbed: false,
    icon: '📄'
  };
};

/**
 * Valida si una URL de Google Drive es accesible públicamente
 * @param {string} url - URL de Google Drive
 * @returns {boolean} true si es accesible públicamente
 */
export const isDriveUrlPublic = (url) => {
  if (!url) return false;
  
  // URLs que indican acceso público
  const publicPatterns = [
    /\/view\?usp=sharing/,
    /\/edit\?usp=sharing/,
    /sharingaction=default/,
    /sharing/
  ];
  
  return publicPatterns.some(pattern => pattern.test(url));
};

/**
 * Convierte una URL de Google Drive privada a pública (si es posible)
 * @param {string} url - URL original
 * @returns {string} URL con parámetros públicos
 */
export const makeDriveUrlPublic = (url) => {
  if (!url) return url;
  
  const fileId = extractDriveFileId(url);
  if (!fileId) return url;
  
  // Si ya es público, devolver como está
  if (isDriveUrlPublic(url)) return url;
  
  // Intentar hacer público agregando parámetros
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
};

/**
 * Extrae información completa de un archivo de Drive
 * @param {string} url - URL de Google Drive
 * @returns {Object} Información completa del archivo
 */
export const getDriveFileInfo = (url) => {
  const fileId = extractDriveFileId(url);
  const fileType = detectFileType(url);
  const isFolder = isDriveFolder(url);
  
  // Si es una carpeta, crear URLs especiales para carpeta
  if (isFolder && fileId) {
    return {
      fileId,
      originalUrl: url,
      embedUrl: `https://drive.google.com/embeddedfolderview?id=${fileId}`,
      downloadUrl: null, // No se pueden descargar carpetas directamente
      directViewUrl: url,
      publicUrl: makeDriveUrlPublic(url),
      isPublic: isDriveUrlPublic(url),
      type: 'folder',
      category: 'folder',
      canEmbed: true,
      icon: '📁'
    };
  }
  
  return {
    fileId,
    originalUrl: url,
    embedUrl: getDriveEmbedUrl(url),
    downloadUrl: getDriveDownloadUrl(url),
    directViewUrl: getDriveDirectViewUrl(url),
    publicUrl: makeDriveUrlPublic(url),
    isPublic: isDriveUrlPublic(url),
    ...fileType
  };
};

/**
 * Parsea múltiples URLs de Google Drive de un string
 * @param {string} text - Texto que puede contener URLs de Drive
 * @returns {Array} Array de objetos con información de archivos
 */
export const parseDriveUrls = (text) => {
  if (!text) return [];
  
  // Patrones más amplios para URLs de Google Drive
  const driveUrlPatterns = [
    /https?:\/\/(?:drive|docs)\.google\.com\/[^\s\)\]\}"']+/g,
    /https?:\/\/drive\.google\.com\/[^\s\)\]\}"']+/g
  ];
  
  let urls = [];
  
  // Probar todos los patrones
  for (const pattern of driveUrlPatterns) {
    const matches = text.match(pattern) || [];
    urls.push(...matches);
  }
  
  // Eliminar duplicados
  urls = [...new Set(urls)];
  
  // Si no se encuentran URLs con patrones, intentar buscar IDs directamente
  if (urls.length === 0) {
    
    // Buscar IDs de archivos directamente
    const idPatterns = [
      /[a-zA-Z0-9-_]{25,}/g,  // IDs típicos de Google Drive
      /id=([a-zA-Z0-9-_]+)/g   // Parámetro id=
    ];
    
    for (const pattern of idPatterns) {
      const matches = text.match(pattern) || [];
      // Convertir IDs a URLs completas
      const idUrls = matches
        .filter(match => match.length >= 25) // Filtrar IDs válidos
        .map(id => `https://drive.google.com/file/d/${id}/view`);
      urls.push(...idUrls);
    }
  }
  
  // Si aún no hay URLs pero el texto parece ser una URL de Drive incompleta
  if (urls.length === 0 && text.includes('drive.google.com')) {
    urls.push(text.trim());
  }
  
  return urls.map(url => {
    const info = getDriveFileInfo(url);
    return info;
  }).filter(info => {
    const isValid = info.fileId;
    return isValid;
  });
};

/**
 * Genera URL de thumbnail para un archivo de Google Drive
 * @param {string} url - URL original
 * @param {number} size - Tamaño del thumbnail (por defecto 200)
 * @returns {string|null} URL del thumbnail
 */
export const getDriveThumbnailUrl = (url, size = 200) => {
  const fileId = extractDriveFileId(url);
  if (!fileId) return null;
  
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=s${size}`;
};

export default {
  extractDriveFileId,
  getDriveEmbedUrl,
  getDriveDownloadUrl,
  getDriveDirectViewUrl,
  detectFileType,
  isDriveUrlPublic,
  makeDriveUrlPublic,
  getDriveFileInfo,
  parseDriveUrls,
  getDriveThumbnailUrl
};
