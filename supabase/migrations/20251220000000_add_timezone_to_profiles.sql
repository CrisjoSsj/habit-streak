-- Agregar campo de zona horaria a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Mexico_City';

-- Comentario sobre el campo
COMMENT ON COLUMN public.profiles.timezone IS 'Zona horaria del usuario (ej: America/Mexico_City, America/New_York, Europe/Madrid). Se usa para enviar recordatorios en la hora local correcta.';

