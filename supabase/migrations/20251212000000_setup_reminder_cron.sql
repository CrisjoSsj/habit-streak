-- Configurar cron job para ejecutar la función de recordatorios cada 5 minutos
-- Nota: Esto requiere que la extensión pg_cron esté habilitada en Supabase
-- También requiere que la extensión pg_net esté habilitada para hacer HTTP requests

-- Primero, eliminar el cron job anterior si existe
SELECT cron.unschedule('send-habit-reminders-hourly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-habit-reminders-hourly'
);

-- Verificar si pg_cron está disponible y crear el cron job
DO $$
BEGIN
  -- Intentar crear el cron job
  -- Se ejecutará cada 5 minutos para capturar mejor los recordatorios
  PERFORM cron.schedule(
    'send-habit-reminders-hourly',
    '*/5 * * * *', -- Cada 5 minutos
    $$
    SELECT
      net.http_post(
        url := 'https://ejqcfkfqlqlchclhzeqv.supabase.co/functions/v1/send-habit-reminders',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcWNma2ZxbHFsY2hjbGh6ZXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5MjE1NSwiZXhwIjoyMDgwODY4MTU1fQ.HvD_fOy1mErPKHaRJLkoko9Y1NqRMSDFo1kloJU6oLI'
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $$
  );
  
  RAISE NOTICE 'Cron job creado exitosamente: send-habit-reminders-hourly (cada 5 minutos)';
EXCEPTION
  WHEN OTHERS THEN
    -- Si pg_cron no está disponible, registrar un mensaje
    RAISE NOTICE 'pg_cron extension not available. Error: %', SQLERRM;
    RAISE NOTICE 'Please configure cron job manually or use an external service like:';
    RAISE NOTICE '- GitHub Actions with cron';
    RAISE NOTICE '- Vercel Cron Jobs';
    RAISE NOTICE '- AWS Lambda with EventBridge';
END $$;

-- Alternativa: Si pg_cron no está disponible, puedes usar un servicio externo como:
-- - GitHub Actions con cron
-- - Vercel Cron Jobs
-- - AWS Lambda con EventBridge
-- - Otro servicio de cron que haga HTTP POST a la función
