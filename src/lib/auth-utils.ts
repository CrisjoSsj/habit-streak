/**
 * Utilidades para autenticación y URLs de redirección
 */

/**
 * Obtiene la URL base de la aplicación según el entorno
 * En producción usa window.location.origin para funcionar con cualquier URL de Vercel
 * En desarrollo también usa window.location.origin
 */
export const getAppBaseUrl = (): string => {
  // Siempre usar window.location.origin si está disponible (funciona en producción y desarrollo)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback para SSR: usar variable de entorno o URL de producción
  const prodUrl = import.meta.env.VITE_APP_URL || 'https://habit-streak-git-main-crisjos-projects.vercel.app';
  return prodUrl;
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

