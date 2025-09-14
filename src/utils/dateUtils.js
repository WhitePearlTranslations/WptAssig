/**
 * Utilidades para manejar fechas sin problemas de zona horaria
 */

/**
 * Convierte una fecha string del input date (YYYY-MM-DD) a un objeto Date
 * manteniendo la fecha local sin conversión de zona horaria
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  
  // Dividir la fecha en partes para evitar problemas de UTC
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Los meses en JS van de 0-11
  const day = parseInt(parts[2], 10);
  
  // Crear fecha local sin conversión UTC
  return new Date(year, month, day);
};

/**
 * Convierte un objeto Date a string formato YYYY-MM-DD para input date
 * manteniendo la fecha local sin conversión de zona horaria
 */
export const formatLocalDate = (date) => {
  if (!date) return '';
  
  // Si es string, intentar parsearlo como fecha local
  if (typeof date === 'string') {
    // Si ya está en formato YYYY-MM-DD, retornarlo tal como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Si es ISO string o otro formato, convertirlo
    date = new Date(date);
  }
  
  // Obtener componentes de fecha local (no UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Convierte una fecha del input date a ISO string manteniendo la fecha exacta
 * sin cambios por zona horaria
 */
export const dateInputToISOString = (dateString) => {
  if (!dateString) return '';
  
  const date = parseLocalDate(dateString);
  if (!date) return '';
  
  // Crear la fecha con hora a mediodía (12:00:00) para evitar problemas de zona horaria
  // y asegurar que la fecha se mantenga igual independientemente de la zona horaria
  date.setHours(12, 0, 0, 0);
  
  return date.toISOString();
};

/**
 * Convierte una fecha ISO string a formato para input date
 * manteniendo la fecha original sin conversión de zona horaria
 */
export const isoStringToDateInput = (isoString) => {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  return formatLocalDate(date);
};

/**
 * Valida si una fecha string está en formato correcto YYYY-MM-DD
 */
export const isValidDateInput = (dateString) => {
  if (!dateString) return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = parseLocalDate(dateString);
  return date && !isNaN(date.getTime());
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
export const getTodayDateString = () => {
  const today = new Date();
  return formatLocalDate(today);
};

/**
 * Compara dos fechas string en formato YYYY-MM-DD
 * Retorna: -1 si date1 < date2, 0 si son iguales, 1 si date1 > date2
 */
export const compareDateStrings = (date1, date2) => {
  if (!date1 && !date2) return 0;
  if (!date1) return -1;
  if (!date2) return 1;
  
  const d1 = parseLocalDate(date1);
  const d2 = parseLocalDate(date2);
  
  if (!d1 && !d2) return 0;
  if (!d1) return -1;
  if (!d2) return 1;
  
  return d1.getTime() - d2.getTime();
};
