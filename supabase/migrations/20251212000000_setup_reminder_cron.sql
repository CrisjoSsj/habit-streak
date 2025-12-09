-- Configurar cron job para ejecutar la función de recordatorios cada hora
-- Nota: Esto requiere que la extensión pg_cron esté habilitada en Supabase

-- Verificar si pg_cron está disponible
DO $$
BEGIN
  -- Intentar crear el cron job
  -- Se ejecutará cada hora en el minuto 0
  PERFORM cron.schedule(
    'send-habit-reminders-hourly',
    '0 * * * *', -- Cada hora
    $$
    SELECT
      net.http_post(
        url := 'https://ejqcfkfqlqlchclhzeqv.supabase.co/functions/v1/send-habit-reminders',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $$
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Si pg_cron no está disponible, registrar un mensaje
    RAISE NOTICE 'pg_cron extension not available. Please configure cron job manually or use an external service.';
END $$;

-- Alternativa: Si pg_cron no está disponible, puedes usar un servicio externo como:
-- - GitHub Actions con cron
-- - Vercel Cron Jobs
-- - AWS Lambda con EventBridge
-- - Otro servicio de cron que haga HTTP POST a la función

