/**
 * Utilidades para autenticación y URLs de redirección
 */

/**
 * Obtiene la URL base de la aplicación según el entorno
 * En producción usa el dominio de Vercel, en desarrollo usa window.location.origin
 */
export const getAppBaseUrl = (): string => {
  // Si estamos en producción (Vercel), usar el dominio de producción
  if (import.meta.env.PROD) {
    return 'https://habit-streak-eight.vercel.app';
  }
  
  // En desarrollo, usar window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback para SSR
  return 'https://habit-streak-eight.vercel.app';
};

/**
 * Obtiene la URL de redirección para confirmación de email
 */
export const getEmailConfirmationUrl = (): string => {
  return `${getAppBaseUrl()}/`;
};

/**
 * Obtiene la URL de redirección para restablecimiento de contraseña
 */
export const getPasswordResetUrl = (): string => {
  return `${getAppBaseUrl()}/auth?mode=reset`;
};

