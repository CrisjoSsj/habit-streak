# 🔔 Sistema de Recordatorios por Correo Electrónico

## ✅ Estado Actual

He implementado un sistema completo de recordatorios por correo electrónico para los hábitos. La Edge Function `send-habit-reminders` ya está desplegada en tu proyecto de Supabase.

## 📋 Lo que se ha implementado

1. **Edge Function desplegada**: `send-habit-reminders`
   - Busca hábitos con recordatorios activos
   - Verifica la hora del recordatorio
   - Verifica si el hábito debe aparecer hoy
   - Verifica si el hábito no está completado
   - Envía correos electrónicos agrupados por usuario

2. **Template de correo HTML**: Diseño profesional con:
   - Header con gradiente naranja (color de la marca)
   - Lista de hábitos pendientes
   - Botón para ir a la aplicación
   - Footer informativo

## ⚙️ Configuración Requerida

### Paso 1: Configurar SMTP de Supabase

El sistema usa el SMTP configurado en Supabase. Para configurarlo:

1. **Configura SMTP en Auth Settings** (opcional pero recomendado):
   - Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/settings/auth
   - Navega a: **Project Settings > Auth > SMTP Settings**
   - Configura tu servidor SMTP para correos de autenticación

2. **Configura SMTP en Edge Functions Secrets** (requerido):
   - Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/settings/functions
   - Navega a: **Project Settings > Edge Functions > Secrets**
   - Agrega las siguientes variables de entorno:
     - `SMTP_HOST`: Tu servidor SMTP (ej: smtp.gmail.com, smtp.sendgrid.net)
     - `SMTP_PORT`: Puerto SMTP (ej: 587 para TLS, 465 para SSL)
     - `SMTP_USER`: Tu usuario SMTP
     - `SMTP_PASS`: Tu contraseña SMTP
     - `SMTP_FROM`: Email del remitente (ej: noreply@habittrack.com)
     - `SMTP_FROM_NAME`: Nombre del remitente (ej: HabitTrack) - Opcional

**Nota**: Las credenciales SMTP deben ser las mismas que configuraste en Auth Settings. Esto permite que el sistema use el mismo servidor SMTP para los recordatorios.

### Paso 2: Configurar Cron Job (Ejecución Automática)

La función necesita ejecutarse periódicamente. Tienes varias opciones:

#### Opción A: Usar GitHub Actions (Gratis y Fácil)

1. Crea el archivo `.github/workflows/reminders.yml`:

```yaml
name: Send Habit Reminders
on:
  schedule:
    - cron: '0 * * * *' # Cada hora en el minuto 0
  workflow_dispatch: # Permite ejecución manual

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            https://ejqcfkfqlqlchclhzeqv.supabase.co/functions/v1/send-habit-reminders \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
```

2. Agrega el secreto en GitHub:
   - Ve a tu repositorio en GitHub
   - Settings > Secrets and variables > Actions
   - Agrega `SUPABASE_SERVICE_ROLE_KEY` con tu Service Role Key

#### Opción B: Usar Cron-job.org (Gratis)

1. Ve a https://cron-job.org
2. Crea una cuenta gratuita
3. Crea un nuevo cron job:
   - **URL**: `https://ejqcfkfqlqlchclhzeqv.supabase.co/functions/v1/send-habit-reminders`
   - **Schedule**: Cada hora (`0 * * * *`)
   - **Method**: POST
   - **Headers**:
     - `Authorization`: `Bearer [TU_SERVICE_ROLE_KEY]`
     - `Content-Type`: `application/json`
   - **Body**: `{}`

#### Opción C: Usar pg_cron (si está disponible en Supabase)

Ejecuta la migración SQL que creé:
```bash
supabase db push
```

Esto intentará configurar un cron job en PostgreSQL.

### Paso 3: Probar la Función

Puedes probar la función manualmente usando el script que creé:

```bash
node scripts/test-reminders.js [TU_SERVICE_ROLE_KEY]
```

O usando curl:

```bash
curl -X POST \
  https://ejqcfkfqlqlchclhzeqv.supabase.co/functions/v1/send-habit-reminders \
  -H "Authorization: Bearer [TU_SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 🎯 Cómo Funciona

1. **Usuario configura recordatorio**:
   - En el formulario de hábito, activa "Recordatorio para este hábito"
   - Establece la hora (ej: 09:00)

2. **La función se ejecuta cada hora**:
   - Busca hábitos con `reminder_enabled = true`
   - Verifica si es la hora del recordatorio (±1 minuto de tolerancia)
   - Verifica si el hábito debe aparecer hoy según `repeat_type` y `repeat_days`
   - Verifica si el hábito NO está completado hoy

3. **Envía correo electrónico**:
   - Agrupa hábitos por usuario
   - Envía un correo con todos los hábitos pendientes del usuario
   - Incluye un enlace directo a la aplicación

## 📧 Ejemplo de Correo

El correo incluye:
- Saludo personalizado con el nombre del usuario
- Lista de hábitos pendientes
- Botón para ir a la aplicación
- Información sobre cómo desactivar recordatorios

## 🔧 Troubleshooting

### Los correos no se envían

1. **Verifica que RESEND_API_KEY esté configurada**:
   - Ve a Supabase Dashboard > Edge Functions > Secrets
   - Asegúrate de que `RESEND_API_KEY` esté presente

2. **Verifica los logs de la función**:
   - Ve a Supabase Dashboard > Edge Functions > send-habit-reminders > Logs
   - Busca errores relacionados con el envío de correos

3. **Prueba la función manualmente**:
   ```bash
   node scripts/test-reminders.js
   ```

### La función no se ejecuta automáticamente

1. **Verifica que el cron job esté configurado**:
   - Si usas GitHub Actions, verifica que el workflow esté activo
   - Si usas cron-job.org, verifica que el job esté activo

2. **Prueba ejecutando manualmente**:
   - Usa el script de prueba o curl para verificar que la función funciona

### Correos duplicados

La función tiene protección contra duplicados:
- Solo envía recordatorios si el hábito NO está completado hoy
- Verifica la hora exacta antes de enviar

## 📝 Notas Importantes

- **Límites de Resend**: El plan gratuito de Resend permite 3,000 correos/mes
- **Frecuencia de ejecución**: Recomendado cada hora. Puedes cambiarlo a cada 15 minutos si lo necesitas
- **Zona horaria**: La función usa la zona horaria del servidor. Asegúrate de que los usuarios configuren sus recordatorios en la zona horaria correcta

## 🚀 Próximos Pasos

1. Configura Resend API Key en Supabase
2. Configura el cron job (recomiendo GitHub Actions)
3. Prueba creando un hábito con recordatorio
4. Verifica que recibas el correo a la hora configurada

## 📚 Documentación Adicional

Ver `docs/REMINDERS_SETUP.md` para más detalles técnicos.

