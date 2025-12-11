-- Actualizar usuarios existentes con zona horaria por defecto si no tienen una
UPDATE public.profiles 
SET timezone = 'America/Mexico_City' 
WHERE timezone IS NULL OR timezone = '';

-- Comentario
COMMENT ON COLUMN public.profiles.timezone IS 'Zona horaria del usuario (ej: America/Mexico_City, America/New_York, Europe/Madrid). Se usa para enviar recordatorios en la hora local correcta.';

