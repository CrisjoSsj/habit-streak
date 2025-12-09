-- Migración para preservar el historial de hábitos eliminados
-- Cambiar la foreign key de CASCADE a SET NULL y agregar campos para información del hábito eliminado

-- Paso 1: Agregar columnas para almacenar información del hábito eliminado
ALTER TABLE public.habit_completions
ADD COLUMN IF NOT EXISTS deleted_habit_name TEXT,
ADD COLUMN IF NOT EXISTS deleted_habit_icon TEXT,
ADD COLUMN IF NOT EXISTS deleted_habit_color TEXT;

-- Paso 2: Eliminar la constraint de foreign key existente
ALTER TABLE public.habit_completions
DROP CONSTRAINT IF EXISTS habit_completions_habit_id_fkey;

-- Paso 3: Hacer habit_id nullable (para permitir SET NULL)
ALTER TABLE public.habit_completions
ALTER COLUMN habit_id DROP NOT NULL;

-- Paso 4: Recrear la foreign key con ON DELETE SET NULL
ALTER TABLE public.habit_completions
ADD CONSTRAINT habit_completions_habit_id_fkey
FOREIGN KEY (habit_id)
REFERENCES public.habits(id)
ON DELETE SET NULL;

-- Paso 5: Actualizar el UNIQUE constraint para permitir NULL en habit_id
-- Primero eliminar el constraint existente
ALTER TABLE public.habit_completions
DROP CONSTRAINT IF EXISTS habit_completions_habit_id_completion_date_key;

-- Crear un nuevo constraint que permita múltiples NULLs pero mantenga unicidad cuando habit_id no es NULL
CREATE UNIQUE INDEX IF NOT EXISTS habit_completions_unique_active_habit
ON public.habit_completions (habit_id, completion_date)
WHERE habit_id IS NOT NULL;

-- Para hábitos eliminados, usar una combinación única de deleted_habit_name, user_id y completion_date
CREATE UNIQUE INDEX IF NOT EXISTS habit_completions_unique_deleted_habit
ON public.habit_completions (deleted_habit_name, user_id, completion_date)
WHERE habit_id IS NULL AND deleted_habit_name IS NOT NULL;

