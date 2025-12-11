/**
 * Utilidades para manejo de fechas y zonas horarias
 * Supabase almacena fechas en UTC, pero trabajamos con fechas locales del usuario
 * 
 * Nota: Como trabajamos solo con fechas (sin hora), podemos usar date-fns directamente
 * sin necesidad de date-fns-tz, ya que las fechas se comparan por día completo.
 */

import { format, parseISO, startOfDay, isSameDay } from 'date-fns';

/**
 * Obtiene la zona horaria del usuario desde el navegador
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Obtiene la fecha actual en la zona horaria del usuario (sin horas/minutos/segundos)
 * Esto representa "hoy" según la zona horaria del navegador/dispositivo
 */
export const getTodayInUserTimezone = (): Date => {
  // Usar Intl.DateTimeFormat para obtener la fecha actual en la zona horaria del navegador
  const now = new Date();
  const timeZone = getUserTimezone();
  
  // Obtener los componentes de fecha en la zona horaria local del usuario
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
  
  // Crear fecha local sin hora (solo día) en la zona horaria del usuario
  const localDate = new Date(year, month, day);
  return startOfDay(localDate);
};

/**
 * Formatea una fecha para almacenar en Supabase (formato yyyy-MM-dd)
 * Usa la fecha local del usuario según su zona horaria del navegador
 */
export const formatDateForSupabase = (date: Date): string => {
  // Asegurar que usamos la fecha en la zona horaria local del usuario
  const timeZone = getUserTimezone();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // 'en-CA' devuelve formato yyyy-MM-dd directamente
  return formatter.format(date);
};

/**
 * Parsea una fecha de Supabase (formato yyyy-MM-dd) a Date local
 * Supabase almacena fechas como yyyy-MM-dd, las parseamos como fecha local
 */
export const parseDateFromSupabase = (dateStr: string): Date => {
  // Parsear como fecha local (no UTC) para mantener consistencia con la zona horaria del usuario
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

/**
 * Verifica si una fecha es "hoy" en la zona horaria del usuario
 */
export const isTodayInUserTimezone = (date: Date | string): boolean => {
  const dateToCheck = typeof date === 'string' ? parseDateFromSupabase(date) : date;
  const today = getTodayInUserTimezone();
  
  return isSameDay(dateToCheck, today);
};

/**
 * Obtiene la fecha actual formateada para Supabase (yyyy-MM-dd)
 * Representa "hoy" según la zona horaria del usuario
 */
export const getTodayForSupabase = (): string => {
  const today = getTodayInUserTimezone();
  return formatDateForSupabase(today);
};

/**
 * Obtiene la fecha y hora actual en la zona horaria del usuario
 * Útil para mostrar información de sincronización
 */
export const getCurrentDateTime = (): { date: string; time: string; timezone: string } => {
  const now = new Date();
  const timeZone = getUserTimezone();
  
  const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    timeZone: timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const timeFormatter = new Intl.DateTimeFormat('es-ES', {
    timeZone: timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  return {
    date: dateFormatter.format(now),
    time: timeFormatter.format(now),
    timezone: timeZone
  };
};
