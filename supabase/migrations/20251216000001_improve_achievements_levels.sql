-- Mejorar sistema de logros con niveles progresivos tipo TikTok
-- Reemplazar la función existente con una versión mejorada que maneja niveles

CREATE OR REPLACE FUNCTION check_and_create_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_habit_id UUID;
  v_completion_date DATE;
  v_streak_days INTEGER;
  v_perfect_days_count INTEGER;
  v_perfect_weeks_count INTEGER;
  v_total_habits INTEGER;
  v_completed_habits INTEGER;
  v_max_streak INTEGER;
BEGIN
  -- Solo procesar si la completación está marcada como completada
  IF NEW.is_completed = false THEN
    RETURN NEW;
  END IF;

  v_user_id := NEW.user_id;
  v_habit_id := NEW.habit_id;
  v_completion_date := NEW.completion_date;

  -- 1. Logro: Primera completación (nivel 1 solamente)
  IF NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'first_completion'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM habit_completions 
      WHERE user_id = v_user_id 
      AND is_completed = true
      AND completion_date < v_completion_date
      LIMIT 1
    ) THEN
      INSERT INTO achievements (user_id, achievement_type, achievement_level)
      VALUES (v_user_id, 'first_completion', 1)
      ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
    END IF;
  END IF;

  -- 2. Logros de RACHA con niveles progresivos
  -- Calcular la mejor racha actual de cualquier hábito del usuario
  WITH all_streaks AS (
    SELECT 
      habit_id,
      completion_date,
      ROW_NUMBER() OVER (PARTITION BY habit_id ORDER BY completion_date DESC) as rn,
      completion_date - (ROW_NUMBER() OVER (PARTITION BY habit_id ORDER BY completion_date DESC) - 1)::INTEGER as grp
    FROM habit_completions
    WHERE user_id = v_user_id
      AND is_completed = true
      AND completion_date <= v_completion_date
  ),
  streak_lengths AS (
    SELECT habit_id, grp, COUNT(*) as streak_length
    FROM all_streaks
    GROUP BY habit_id, grp
  )
  SELECT COALESCE(MAX(streak_length), 0) INTO v_max_streak
  FROM streak_lengths;

  -- Niveles de racha: 3, 7, 30, 60, 100, 365 días
  IF v_max_streak >= 3 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'streak'
    AND achievement_level = 1
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'streak', 1)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_max_streak >= 7 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'streak'
    AND achievement_level = 2
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'streak', 2)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_max_streak >= 30 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'streak'
    AND achievement_level = 3
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'streak', 3)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_max_streak >= 60 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'streak'
    AND achievement_level = 4
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'streak', 4)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_max_streak >= 100 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'streak'
    AND achievement_level = 5
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'streak', 5)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_max_streak >= 365 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'streak'
    AND achievement_level = 6
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'streak', 6)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  -- 3. Logro: Día perfecto con niveles progresivos
  -- Contar días perfectos totales del usuario
  SELECT COUNT(*) INTO v_total_habits
  FROM habits
  WHERE user_id = v_user_id
    AND is_archived = false;

  -- Contar días perfectos (días donde se completaron todos los hábitos activos)
  WITH perfect_days_list AS (
    SELECT completion_date
    FROM habit_completions hc
    WHERE hc.user_id = v_user_id
      AND hc.is_completed = true
      AND hc.completion_date <= v_completion_date
    GROUP BY completion_date
    HAVING COUNT(DISTINCT hc.habit_id) >= v_total_habits
  )
  SELECT COUNT(*) INTO v_perfect_days_count
  FROM perfect_days_list;

  -- Niveles de días perfectos: 1, 3, 5, 10, 20, 30, 50, 100 días
  IF v_perfect_days_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_day'
    AND achievement_level = 1
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_day', 1)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_perfect_days_count >= 3 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_day'
    AND achievement_level = 2
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_day', 2)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_perfect_days_count >= 5 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_day'
    AND achievement_level = 3
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_day', 3)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_perfect_days_count >= 10 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_day'
    AND achievement_level = 4
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_day', 4)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_perfect_days_count >= 20 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_day'
    AND achievement_level = 5
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_day', 5)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_perfect_days_count >= 30 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_day'
    AND achievement_level = 6
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_day', 6)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_perfect_days_count >= 50 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_day'
    AND achievement_level = 7
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_day', 7)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_perfect_days_count >= 100 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_day'
    AND achievement_level = 8
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_day', 8)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  -- 4. Logro: Semana perfecta con niveles progresivos
  -- Calcular semanas perfectas consecutivas
  WITH perfect_days AS (
    SELECT DISTINCT completion_date
    FROM habit_completions hc
    WHERE hc.user_id = v_user_id
      AND hc.is_completed = true
      AND hc.completion_date <= v_completion_date
    GROUP BY completion_date, hc.user_id
    HAVING COUNT(DISTINCT hc.habit_id) >= (
      SELECT COUNT(*) 
      FROM habits 
      WHERE user_id = hc.user_id 
      AND is_archived = false
    )
  ),
  week_groups AS (
    SELECT 
      DATE_TRUNC('week', completion_date) as week_start,
      COUNT(*) as perfect_days_in_week
    FROM perfect_days
    GROUP BY DATE_TRUNC('week', completion_date)
    HAVING COUNT(*) >= 7
  )
  SELECT COUNT(*) INTO v_perfect_weeks_count
  FROM week_groups;

  -- Niveles de semanas perfectas: 1, 2, 4, 8, 12, 24 semanas
  IF v_perfect_weeks_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_week'
    AND achievement_level = 1
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_week', 1)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_perfect_weeks_count >= 2 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_week'
    AND achievement_level = 2
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_week', 2)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_perfect_weeks_count >= 4 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_week'
    AND achievement_level = 3
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_week', 3)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_perfect_weeks_count >= 8 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_week'
    AND achievement_level = 4
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_week', 4)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_perfect_weeks_count >= 12 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_week'
    AND achievement_level = 5
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_week', 5)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  IF v_perfect_weeks_count >= 24 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE user_id = v_user_id 
    AND achievement_type = 'perfect_week'
    AND achievement_level = 6
  ) THEN
    INSERT INTO achievements (user_id, achievement_type, achievement_level)
    VALUES (v_user_id, 'perfect_week', 6)
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

