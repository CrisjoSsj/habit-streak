-- Función para verificar y crear logros automáticamente
CREATE OR REPLACE FUNCTION check_and_create_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_habit_id UUID;
  v_completion_date DATE;
  v_is_completed BOOLEAN;
  v_existing_achievement BOOLEAN;
  v_streak_days INTEGER;
  v_perfect_days INTEGER;
  v_total_habits INTEGER;
  v_completed_habits INTEGER;
BEGIN
  -- Solo procesar si la completación está marcada como completada
  IF NEW.is_completed = false THEN
    RETURN NEW;
  END IF;

  v_user_id := NEW.user_id;
  v_habit_id := NEW.habit_id;
  v_completion_date := NEW.completion_date;
  v_is_completed := NEW.is_completed;

  -- 1. Logro: Primera completación (first_completion)
  -- Verificar si es la primera vez que este usuario completa cualquier hábito
  IF NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'first_completion'
  ) THEN
    -- Verificar si esta es la primera completación (no hay otras anteriores)
    IF NOT EXISTS (
      SELECT 1 FROM habit_completions 
      WHERE user_id = v_user_id 
      AND is_completed = true
      AND completion_date < v_completion_date
      LIMIT 1
    ) THEN
      -- Esta es realmente la primera completación
      INSERT INTO achievements (user_id, achievement_type, achievement_level)
      VALUES (v_user_id, 'first_completion', 1)
      ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
    END IF;
  END IF;

  -- 2. Logros de racha (streak_3_days, streak_7_days, streak_30_days)
  -- Calcular la racha actual para este hábito específico
  WITH streak_calc AS (
    SELECT 
      completion_date,
      ROW_NUMBER() OVER (ORDER BY completion_date DESC) as rn,
      completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC) - 1)::INTEGER as grp
    FROM habit_completions
    WHERE habit_id = v_habit_id
      AND user_id = v_user_id
      AND is_completed = true
      AND completion_date <= v_completion_date
    ORDER BY completion_date DESC
  ),
  streak_groups AS (
    SELECT grp, COUNT(*) as streak_length
    FROM streak_calc
    GROUP BY grp
    ORDER BY MAX(completion_date) DESC
    LIMIT 1
  )
  SELECT COALESCE(streak_length, 0) INTO v_streak_days
  FROM streak_groups;

  -- Crear logros de racha si se alcanzan
  IF v_streak_days >= 3 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'streak_3_days'
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'streak_3_days', 3)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_streak_days >= 7 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'streak_7_days'
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'streak_7_days', 7)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_streak_days >= 30 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'streak_30_days'
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'streak_30_days', 30)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  -- 3. Logro: Día perfecto (perfect_day)
  -- Verificar si todos los hábitos activos están completados en este día
  SELECT COUNT(*) INTO v_total_habits
  FROM habits
  WHERE user_id = v_user_id
    AND is_archived = false;

  SELECT COUNT(DISTINCT habit_id) INTO v_completed_habits
  FROM habit_completions
  WHERE user_id = v_user_id
    AND completion_date = v_completion_date
    AND is_completed = true;

  IF v_total_habits > 0 AND v_completed_habits >= v_total_habits THEN
    -- Crear logro de día perfecto para este día específico
    -- Usamos achievement_level para almacenar el día (como timestamp numérico)
    INSERT INTO achievements (user_id, achievement_type, achievement_level, unlocked_at)
    VALUES (v_user_id, 'perfect_day', EXTRACT(EPOCH FROM v_completion_date)::INTEGER, v_completion_date)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  -- 4. Logro: Semana perfecta (perfect_week)
  -- Verificar si hay 7 días perfectos consecutivos
  WITH perfect_days AS (
    SELECT DISTINCT completion_date
    FROM habit_completions hc
    WHERE hc.user_id = v_user_id
      AND hc.is_completed = true
      AND hc.completion_date <= v_completion_date
      AND hc.completion_date >= v_completion_date - INTERVAL '6 days'
    GROUP BY completion_date, hc.user_id
    HAVING COUNT(DISTINCT hc.habit_id) >= (
      SELECT COUNT(*) 
      FROM habits 
      WHERE user_id = hc.user_id 
      AND is_archived = false
    )
  ),
  perfect_weeks AS (
    SELECT 
      completion_date,
      completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC) - 1)::INTEGER as week_start
    FROM perfect_days
    ORDER BY completion_date DESC
  ),
  week_groups AS (
    SELECT week_start, COUNT(*) as perfect_days_count
    FROM perfect_weeks
    GROUP BY week_start
    HAVING COUNT(*) >= 7
    ORDER BY week_start DESC
    LIMIT 1
  )
  SELECT COALESCE(perfect_days_count, 0) INTO v_perfect_days
  FROM week_groups;

  IF v_perfect_days >= 7 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_week'
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_week', 7)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nota: La función SECURITY DEFINER debería poder insertar logros
-- porque se ejecuta con privilegios elevados, pero las políticas RLS
-- existentes deberían ser suficientes ya que verificamos user_id explícitamente

-- Crear trigger que se ejecute después de insertar o actualizar una completación
DROP TRIGGER IF EXISTS check_achievements_trigger ON habit_completions;
CREATE TRIGGER check_achievements_trigger
  AFTER INSERT OR UPDATE OF is_completed ON habit_completions
  FOR EACH ROW
  WHEN (NEW.is_completed = true)
  EXECUTE FUNCTION check_and_create_achievements();

-- Función auxiliar para recalcular logros existentes (útil para migración)
-- Esta función simula el trigger para cada completación existente
CREATE OR REPLACE FUNCTION recalculate_all_achievements(p_user_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_completion_record RECORD;
  v_user_record RECORD;
BEGIN
  -- Si se proporciona un user_id específico, solo procesar ese usuario
  IF p_user_id IS NOT NULL THEN
    -- Procesar todas las completaciones del usuario en orden cronológico
    FOR v_completion_record IN 
      SELECT * FROM habit_completions
      WHERE user_id = p_user_id
        AND is_completed = true
      ORDER BY completion_date ASC, created_at ASC
    LOOP
      -- Simular el trigger llamando a la lógica directamente
      PERFORM check_and_create_achievements_manual(
        v_completion_record.user_id,
        v_completion_record.habit_id,
        v_completion_record.completion_date
      );
    END LOOP;
  ELSE
    -- Procesar todos los usuarios
    FOR v_user_record IN SELECT DISTINCT user_id FROM habit_completions WHERE is_completed = true
    LOOP
      PERFORM recalculate_all_achievements(v_user_record.user_id);
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar que contiene la lógica del trigger pero puede ser llamada manualmente
CREATE OR REPLACE FUNCTION check_and_create_achievements_manual(
  p_user_id UUID,
  p_habit_id UUID,
  p_completion_date DATE
)
RETURNS void AS $$
DECLARE
  v_streak_days INTEGER;
  v_perfect_days INTEGER;
  v_total_habits INTEGER;
  v_completed_habits INTEGER;
BEGIN
  -- 1. Logro: Primera completación
  IF NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = p_user_id 
    AND achievement_type = 'first_completion'
  ) AND NOT EXISTS (
    SELECT 1 FROM habit_completions 
    WHERE user_id = p_user_id 
    AND is_completed = true
    AND completion_date < p_completion_date
    LIMIT 1
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (p_user_id, 'first_completion', 1)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  -- 2. Logros de racha
  WITH streak_calc AS (
    SELECT 
      completion_date,
      ROW_NUMBER() OVER (ORDER BY completion_date DESC) as rn,
      completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC) - 1)::INTEGER as grp
    FROM habit_completions
    WHERE habit_id = p_habit_id
      AND user_id = p_user_id
      AND is_completed = true
      AND completion_date <= p_completion_date
    ORDER BY completion_date DESC
  ),
  streak_groups AS (
    SELECT grp, COUNT(*) as streak_length
    FROM streak_calc
    GROUP BY grp
    ORDER BY MAX(completion_date) DESC
    LIMIT 1
  )
  SELECT COALESCE(streak_length, 0) INTO v_streak_days
  FROM streak_groups;

  IF v_streak_days >= 3 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = p_user_id 
    AND achievement_type = 'streak_3_days'
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (p_user_id, 'streak_3_days', 3)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_streak_days >= 7 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = p_user_id 
    AND achievement_type = 'streak_7_days'
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (p_user_id, 'streak_7_days', 7)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_streak_days >= 30 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = p_user_id 
    AND achievement_type = 'streak_30_days'
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (p_user_id, 'streak_30_days', 30)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  -- 3. Logro: Día perfecto
  SELECT COUNT(*) INTO v_total_habits
  FROM habits
  WHERE user_id = p_user_id
    AND is_archived = false;

  SELECT COUNT(DISTINCT habit_id) INTO v_completed_habits
  FROM habit_completions
  WHERE user_id = p_user_id
    AND completion_date = p_completion_date
    AND is_completed = true;

  IF v_total_habits > 0 AND v_completed_habits >= v_total_habits THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level, unlocked_at)
    VALUES (p_user_id, 'perfect_day', EXTRACT(EPOCH FROM p_completion_date)::INTEGER, p_completion_date)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  -- 4. Logro: Semana perfecta
  WITH perfect_days AS (
    SELECT DISTINCT completion_date
    FROM habit_completions hc
    WHERE hc.user_id = p_user_id
      AND hc.is_completed = true
      AND hc.completion_date <= p_completion_date
      AND hc.completion_date >= p_completion_date - INTERVAL '6 days'
    GROUP BY completion_date, hc.user_id
    HAVING COUNT(DISTINCT hc.habit_id) >= (
      SELECT COUNT(*) 
      FROM habits 
      WHERE user_id = hc.user_id 
      AND is_archived = false
    )
  ),
  perfect_weeks AS (
    SELECT 
      completion_date,
      completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC) - 1)::INTEGER as week_start
    FROM perfect_days
    ORDER BY completion_date DESC
  ),
  week_groups AS (
    SELECT week_start, COUNT(*) as perfect_days_count
    FROM perfect_weeks
    GROUP BY week_start
    HAVING COUNT(*) >= 7
    ORDER BY week_start DESC
    LIMIT 1
  )
  SELECT COALESCE(perfect_days_count, 0) INTO v_perfect_days
  FROM week_groups;

  IF v_perfect_days >= 7 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = p_user_id 
    AND achievement_type = 'perfect_week'
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (p_user_id, 'perfect_week', 7)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

