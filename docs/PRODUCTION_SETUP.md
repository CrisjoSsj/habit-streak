# 🚀 Configuración para Producción - Vercel

## ✅ Cambios Realizados en el Código

El código ahora está configurado para usar automáticamente:
- **Producción**: `https://habit-streak-eight.vercel.app`
- **Desarrollo**: `window.location.origin` (localhost o IP local)

### Archivos Modificados

1. **`src/lib/auth-utils.ts`** (NUEVO)
   - Función `getAppBaseUrl()`: Detecta automáticamente si está en producción
   - Función `getEmailConfirmationUrl()`: URL para confirmación de email
   - Función `getPasswordResetUrl()`: URL para restablecimiento de contraseña

2. **`src/pages/Auth.tsx`**
   - Actualizado para usar `getEmailConfirmationUrl()` en registro
   - Actualizado para usar `getPasswordResetUrl()` en restablecimiento de contraseña

## 🔧 Configuración Requerida en Supabase Dashboard

### Paso 1: Configurar Site URL

1. Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/settings/general
2. Busca la sección **"API Settings"**
3. En **"Site URL"**, configura:
   ```
   https://habit-streak-eight.vercel.app
   ```
4. Haz clic en **"Save"**

### Paso 2: Configurar Redirect URLs

1. Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/auth/url-configuration
2. En **"Redirect URLs"**, agrega estas URLs (una por línea):

   ```
   https://habit-streak-eight.vercel.app
   https://habit-streak-eight.vercel.app/
   https://habit-streak-eight.vercel.app/auth
   https://habit-streak-eight.vercel.app/auth?mode=reset
   ```

3. Para desarrollo local, también agrega:
   ```
   http://localhost:8080
   http://localhost:8080/
   http://localhost:8080/auth
   http://localhost:8080/auth?mode=reset
   http://192.168.123.5:8080
   http://192.168.123.5:8080/
   http://192.168.123.5:8080/auth
   http://192.168.123.5:8080/auth?mode=reset
   ```

4. Haz clic en **"Save"**

### Paso 3: Verificar Email Templates

1. Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/auth/templates
2. Verifica que los templates estén activos:
   - ✅ **Confirm signup** (Confirmar registro)
   - ✅ **Reset password** (Restablecer contraseña)
3. Los templates personalizados están en: `docs/email-templates/`

## 🧪 Pruebas

### Probar Confirmación de Email

1. Ve a: https://habit-streak-eight.vercel.app/auth
2. Regístrate con un email nuevo
3. Revisa tu correo electrónico
4. Haz clic en el enlace de confirmación
5. Deberías ser redirigido a: `https://habit-streak-eight.vercel.app/`
6. Ahora puedes iniciar sesión

### Probar Restablecimiento de Contraseña

1. Ve a: https://habit-streak-eight.vercel.app/auth
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa tu email
4. Revisa tu correo electrónico
5. Haz clic en el enlace de restablecimiento
6. Deberías ser redirigido a: `https://habit-streak-eight.vercel.app/auth?mode=reset`
7. Ingresa tu nueva contraseña

## ⚠️ Troubleshooting

### Error: "Invalid redirect URL"

**Solución**: Asegúrate de que todas las URLs estén exactamente como se muestran arriba en la lista de Redirect URLs de Supabase.

### Los correos no llegan

**Solución**: Verifica la configuración SMTP en:
- https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/settings/auth
- Sección "SMTP Settings"

### Los enlaces redirigen a localhost en producción

**Solución**: Verifica que `import.meta.env.PROD` esté configurado correctamente en Vercel. El código detecta automáticamente el entorno.

## 📝 Notas Importantes

- ✅ El código detecta automáticamente si está en producción o desarrollo
- ✅ En producción, siempre usará `https://habit-streak-eight.vercel.app`
- ✅ En desarrollo local, usará `window.location.origin`
- ⚠️ Los cambios en Supabase pueden tardar 1-2 minutos en aplicarse
- ⚠️ Asegúrate de hacer deploy a Vercel después de estos cambios

## 🔄 Despliegue

Después de configurar Supabase:

1. Haz commit de los cambios:
   ```bash
   git add .
   git commit -m "Configurar URLs de producción para autenticación"
   git push
   ```

2. Vercel desplegará automáticamente

3. Verifica que todo funcione en producción

