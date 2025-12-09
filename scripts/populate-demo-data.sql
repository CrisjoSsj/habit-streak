-- Script SQL para poblar datos de usuarios de demostración
-- Ejecutar DESPUÉS de crear los usuarios en Supabase Auth
-- 
-- Credenciales:
-- Admin: admin@habittrack.com / Admin123!
-- Usuario: usuario@habittrack.com / Usuario123!

-- Este script busca los usuarios y crea todos sus datos automáticamente

DO $$
DECLARE
  admin_user_id UUID;
  normal_user_id UUID;
BEGIN
  -- Buscar usuario admin
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@habittrack.com'
  LIMIT 1;
  
  -- Buscar usuario normal
  SELECT id INTO normal_user_id
  FROM auth.users
  WHERE email = 'usuario@habittrack.com'
  LIMIT 1;
  
  -- Crear datos para admin
  IF admin_user_id IS NOT NULL THEN
    -- Asignar rol admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Poblar datos del admin
    PERFORM populate_user_data(admin_user_id, true);
    
    RAISE NOTICE '✅ Datos del admin creados para: %', admin_user_id;
  ELSE
    RAISE NOTICE '⚠️  Usuario admin@habittrack.com no encontrado. Crear primero el usuario.';
  END IF;
  
  -- Crear datos para usuario normal
  IF normal_user_id IS NOT NULL THEN
    -- Asignar rol user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (normal_user_id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Poblar datos del usuario normal
    PERFORM populate_user_data(normal_user_id, false);
    
    RAISE NOTICE '✅ Datos del usuario normal creados para: %', normal_user_id;
  ELSE
    RAISE NOTICE '⚠️  Usuario usuario@habittrack.com no encontrado. Crear primero el usuario.';
  END IF;
  
  -- Mostrar resumen
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumen de datos creados:';
  RAISE NOTICE '   - Profiles: %', (SELECT COUNT(*) FROM profiles);
  RAISE NOTICE '   - Habits: %', (SELECT COUNT(*) FROM habits);
  RAISE NOTICE '   - Habit Completions: %', (SELECT COUNT(*) FROM habit_completions);
  RAISE NOTICE '   - Achievements: %', (SELECT COUNT(*) FROM achievements);
  RAISE NOTICE '   - Global Reminders: %', (SELECT COUNT(*) FROM global_reminders);
  RAISE NOTICE '   - Time Periods: %', (SELECT COUNT(*) FROM time_periods);
  RAISE NOTICE '   - User Roles: %', (SELECT COUNT(*) FROM user_roles);
END $$;

-- Ver datos creados por usuario
SELECT 
  u.email,
  ur.role,
  (SELECT COUNT(*) FROM profiles p WHERE p.id = u.id) as tiene_perfil,
  (SELECT COUNT(*) FROM habits h WHERE h.user_id = u.id) as num_habitos,
  (SELECT COUNT(*) FROM habit_completions hc WHERE hc.user_id = u.id) as num_completados,
  (SELECT COUNT(*) FROM achievements a WHERE a.user_id = u.id) as num_logros,
  (SELECT COUNT(*) FROM global_reminders gr WHERE gr.user_id = u.id) as num_recordatorios,
  (SELECT COUNT(*) FROM time_periods tp WHERE tp.user_id = u.id) as num_periodos
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('admin@habittrack.com', 'usuario@habittrack.com')
ORDER BY u.email;

