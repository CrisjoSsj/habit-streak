-- Script para crear usuarios de demostración y poblar sus datos
-- Ejecutar después de crear los usuarios en Supabase Auth

-- PASO 1: Crear usuarios en Supabase Dashboard o usando la API
-- Usuario Admin: admin@habittrack.com / Admin123!
-- Usuario Normal: usuario@habittrack.com / Usuario123!

-- PASO 2: Obtener los IDs de los usuarios creados
-- SELECT id, email FROM auth.users WHERE email IN ('admin@habittrack.com', 'usuario@habittrack.com');

-- PASO 3: Ejecutar esta función para cada usuario (reemplazar USER_ID con el ID real)

-- Para el usuario ADMIN (reemplazar USER_ID_ADMIN con el ID real del admin):
-- SELECT populate_user_data('USER_ID_ADMIN', true);

-- Para el usuario NORMAL (reemplazar USER_ID_NORMAL con el ID real del usuario):
-- SELECT populate_user_data('USER_ID_NORMAL', false);

-- Verificar datos creados:
-- SELECT 'profiles' as tabla, COUNT(*) as registros FROM profiles
-- UNION ALL
-- SELECT 'habits', COUNT(*) FROM habits
-- UNION ALL
-- SELECT 'habit_completions', COUNT(*) FROM habit_completions
-- UNION ALL
-- SELECT 'achievements', COUNT(*) FROM achievements
-- UNION ALL
-- SELECT 'global_reminders', COUNT(*) FROM global_reminders
-- UNION ALL
-- SELECT 'time_periods', COUNT(*) FROM time_periods
-- UNION ALL
-- SELECT 'user_roles', COUNT(*) FROM user_roles;

