# Configuración de Recordatorios por Correo Electrónico

## Descripción

El sistema de recordatorios envía correos electrónicos automáticamente a los usuarios cuando llega la hora configurada para completar sus hábitos.

## Componentes

### 1. Edge Function: `send-habit-reminders`

Esta función se ejecuta periódicamente y:
- Busca hábitos con `reminder_enabled = true`
- Verifica si es la hora del recordatorio
- Verifica si el hábito debe aparecer hoy (según `repeat_type` y `repeat_days`)
- Verifica si el hábito aún no está completado hoy
- Envía correos electrónicos a los usuarios

### 2. Configuración Requerida

#### Variables de Entorno en Supabase

Necesitas configurar las siguientes variables de entorno en tu proyecto de Supabase:

1. **SUPABASE_URL**: URL de tu proyecto (ya configurada automáticamente)
2. **SUPABASE_SERVICE_ROLE_KEY**: Service Role Key de Supabase (ya configurada automáticamente)
3. **RESEND_API_KEY** (Opcional): API Key de Resend para envío de correos

### Configuración SMTP de Supabase

El sistema usa el SMTP configurado en Supabase. Para configurarlo:

1. **Configura SMTP en Auth Settings** (opcional pero recomendado):
   - Ve a tu proyecto en Supabase Dashboard
   - Navega a: **Project Settings > Auth > SMTP Settings**
   - Configura tu servidor SMTP para correos de autenticación

2. **Configura SMTP en Edge Functions Secrets** (requerido):
   - Ve a: **Project Settings > Edge Functions > Secrets**
   - Agrega las siguientes variables de entorno:
     - `SMTP_HOST`: Tu servidor SMTP (ej: smtp.gmail.com, smtp.sendgrid.net)
     - `SMTP_PORT`: Puerto SMTP (ej: 587 para TLS, 465 para SSL)
     - `SMTP_USER`: Tu usuario SMTP
     - `SMTP_PASS`: Tu contraseña SMTP
     - `SMTP_FROM`: Email del remitente (ej: noreply@habittrack.com)
     - `SMTP_FROM_NAME`: Nombre del remitente (ej: HabitTrack) - Opcional

**Nota**: Las credenciales SMTP deben ser las mismas que configuraste en Auth Settings. Esto permite que el sistema use el mismo servidor SMTP para los recordatorios.

### 3. Configurar Cron Job

La función necesita ejecutarse periódicamente (recomendado: cada hora o cada 15 minutos).

#### Opción 1: Usar pg_cron (si está disponible)

Ejecuta la migración `20251212000000_setup_reminder_cron.sql` que configura un cron job en PostgreSQL.

#### Opción 2: Usar un Servicio Externo

Puedes usar cualquier servicio de cron que haga HTTP POST a tu función:

**URL del endpoint:**
```
https://ejqcfkfqlqlchclhzeqv.supabase.co/functions/v1/send-habit-reminders
```

**Headers requeridos:**
```
Authorization: Bearer [SUPABASE_ANON_KEY o SERVICE_ROLE_KEY]
Content-Type: application/json
```

**Ejemplos de servicios:**

1. **GitHub Actions** (gratis):
```yaml
# .github/workflows/reminders.yml
name: Send Habit Reminders
on:
  schedule:
    - cron: '0 * * * *' # Cada hora
jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            https://ejqcfkfqlqlchclhzeqv.supabase.co/functions/v1/send-habit-reminders \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
```

2. **Vercel Cron Jobs**:
```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "0 * * * *"
  }]
}
```

3. **AWS Lambda + EventBridge**:
   - Crea una función Lambda que llame a la Edge Function
   - Configura EventBridge para ejecutarla cada hora

4. **Cron-job.org** (gratis):
   - Crea un job que haga POST a la URL cada hora

### 4. Probar la Función

Puedes probar la función manualmente:

```bash
curl -X POST \
  https://ejqcfkfqlqlchclhzeqv.supabase.co/functions/v1/send-habit-reminders \
  -H "Authorization: Bearer [TU_SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json"
```

O desde el Dashboard de Supabase:
- Ve a Edge Functions > send-habit-reminders > Invoke

## Cómo Funciona

1. **Usuario configura un recordatorio:**
   - Activa `reminder_enabled` en un hábito
   - Establece `reminder_time` (ej: "09:00")

2. **La función se ejecuta periódicamente:**
   - Busca hábitos con recordatorios activos
   - Verifica si es la hora correcta (±1 minuto de tolerancia)
   - Verifica si el hábito debe aparecer hoy
   - Verifica si el hábito no está completado

3. **Envía correo electrónico:**
   - Agrupa hábitos por usuario
   - Envía un correo con la lista de hábitos pendientes
   - Incluye un enlace directo a la aplicación

## Personalización

Puedes modificar el template del correo editando la función en:
`supabase/functions/send-habit-reminders/index.ts`

## Templates de Correo Personalizados

Para personalizar los correos de autenticación (confirmación de cuenta, recuperación de contraseña, etc.), consulta:

📧 **[Templates de Correo Electrónico](./EMAIL_TEMPLATES.md)**

Estos templates están diseñados para ser consistentes con el diseño de HabitTrack y usar el color primario naranja (#FF6B35).

### Configuración Rápida

1. Ve a: **Project Settings > Auth > Email Templates**
2. Selecciona el tipo de correo (Confirm signup, Reset password, etc.)
3. Copia el template correspondiente desde `docs/email-templates/`
4. Pega el HTML en el editor de Supabase
5. Guarda los cambios

## Troubleshooting

- **Los correos no se envían**: 
  - Verifica que SMTP esté configurado en **Project Settings > Auth > SMTP Settings**
  - Verifica que las credenciales SMTP sean correctas
  - Revisa los logs de la Edge Function en Supabase Dashboard
- **La función no se ejecuta**: Verifica que el cron job esté configurado correctamente
- **Correos duplicados**: La función tiene protección contra duplicados verificando si el hábito ya está completado
- **Error de autenticación SMTP**: Verifica que el usuario y contraseña SMTP sean correctos
- **Los correos no se ven bien**: Verifica que hayas copiado el HTML completo y que las variables de Supabase estén correctas ({{ .ConfirmationURL }}, {{ .Token }}, etc.)

