# Usuarios de Demostración

Este documento explica cómo crear usuarios de demostración con datos de ejemplo en todas las funciones de la base de datos.

## Credenciales de Usuarios

### Usuario Administrador
- **Email:** `admin@habittrack.com`
- **Contraseña:** `Admin123!`
- **Rol:** `admin`

### Usuario Normal
- **Email:** `usuario@habittrack.com`
- **Contraseña:** `Usuario123!`
- **Rol:** `user`

## Pasos para Crear los Usuarios

### Opción 1: Crear manualmente desde la aplicación

1. Ve a la página de registro (`/auth`)
2. Crea el usuario admin con:
   - Email: `admin@habittrack.com`
   - Contraseña: `Admin123!`
   - Nombre: `Administrador`
   - Apellidos: `Sistema`
   - Teléfono: `+34 123 456 789`
   - Edad: `35`

3. Crea el usuario normal con:
   - Email: `usuario@habittrack.com`
   - Contraseña: `Usuario123!`
   - Nombre: `Usuario`
   - Apellidos: `Demo`
   - Teléfono: `+34 987 654 321`
   - Edad: `28`

4. Ejecuta el siguiente SQL en Supabase SQL Editor:

```sql
-- Ejecutar después de crear los usuarios
DO $$
DECLARE
  admin_user_id UUID;
  normal_user_id UUID;
BEGIN
  -- Obtener IDs de usuarios
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@habittrack.com' LIMIT 1;
  SELECT id INTO normal_user_id FROM auth.users WHERE email = 'usuario@habittrack.com' LIMIT 1;
  
  -- Asignar roles
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'admin') ON CONFLICT DO NOTHING;
    PERFORM populate_user_data(admin_user_id, true);
  END IF;
  
  IF normal_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (normal_user_id, 'user') ON CONFLICT DO NOTHING;
    PERFORM populate_user_data(normal_user_id, false);
  END IF;
END $$;
```

### Opción 2: Usar el script automatizado (requiere Service Role Key)

1. Agrega `SUPABASE_SERVICE_ROLE_KEY` a tu archivo `.env`
2. Ejecuta: `node scripts/create-demo-users.js`

## Datos Creados para Cada Usuario

### Usuario Admin
- **Perfil:** Administrador Sistema, 35 años
- **1 Hábito:** "Revisar reportes diarios" (tipo check, mañana)
- **5 Completados:** Últimos 5 días completados
- **1 Recordatorio:** Mañana a las 08:00
- **3 Períodos de tiempo:** Mañana (06:00), Tarde (12:00), Noche (20:00)

### Usuario Normal
- **Perfil:** Usuario Demo, 28 años
- **3 Hábitos:**
  - "Ejercicio matutino" (tipo check, mañana)
  - "Vasos de agua" (tipo count, meta: 8 vasos)
  - "Meditación" (tipo timer, meta: 15 minutos, noche)
- **Completados variados:** 
  - Ejercicio: 4 de 6 días completados
  - Agua: 5 días con progreso variado (5-8 vasos)
  - Meditación: 4 días completados (15 min cada uno)
- **3 Logros:** Primera completación, Racha de 3 días, Día perfecto
- **1 Recordatorio:** Mañana a las 08:00
- **3 Períodos de tiempo:** Mañana (06:00), Tarde (12:00), Noche (20:00)

## Verificar Datos Creados

Ejecuta esta consulta para ver el resumen:

```sql
SELECT 
  'profiles' as tabla, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 'habits', COUNT(*) FROM habits
UNION ALL
SELECT 'habit_completions', COUNT(*) FROM habit_completions
UNION ALL
SELECT 'achievements', COUNT(*) FROM achievements
UNION ALL
SELECT 'global_reminders', COUNT(*) FROM global_reminders
UNION ALL
SELECT 'time_periods', COUNT(*) FROM time_periods
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles;
```

## Funciones Disponibles

La función `populate_user_data(user_id UUID, is_admin BOOLEAN)` está disponible para poblar datos de cualquier usuario.

Ejemplo de uso:
```sql
-- Para un usuario admin
SELECT populate_user_data('user-uuid-here', true);

-- Para un usuario normal
SELECT populate_user_data('user-uuid-here', false);
```

