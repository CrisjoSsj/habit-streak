-- Agregar campo onboarding_completed a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Comentario
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Indica si el usuario ha completado el proceso de onboarding inicial';

-- Los usuarios existentes se consideran que ya completaron el onboarding
UPDATE public.profiles 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL;

