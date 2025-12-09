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
 * Esto representa "hoy" según la zona horaria del usuario
 */
export const getTodayInUserTimezone = (): Date => {
  const now = new Date();
  // Crear una fecha local sin hora (solo día)
  const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return startOfDay(localDate);
};

/**
 * Formatea una fecha para almacenar en Supabase (formato yyyy-MM-dd)
 * Usa la fecha local del usuario, que se interpretará correctamente en Supabase
 */
export const formatDateForSupabase = (date: Date): string => {
  // Usar la fecha local directamente, ya que trabajamos solo con días
  return format(date, 'yyyy-MM-dd');
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
