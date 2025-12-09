# 🔗 Configuración de URLs en Supabase para Producción

## URLs de Redirección Permitidas

Para que los correos de confirmación y restablecimiento de contraseña funcionen correctamente, necesitas configurar las siguientes URLs en Supabase Dashboard.

### Paso 1: Configurar Site URL

1. Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/settings/general
2. En la sección **"API Settings"**, busca **"Site URL"**
3. Configura la URL de producción:
   ```
   https://habit-streak-eight.vercel.app
   ```
4. Guarda los cambios

### Paso 2: Configurar Redirect URLs

1. Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/auth/url-configuration
2. En la sección **"Redirect URLs"**, agrega las siguientes URLs (una por línea):

   ```
   https://habit-streak-eight.vercel.app
   https://habit-streak-eight.vercel.app/
   https://habit-streak-eight.vercel.app/auth
   https://habit-streak-eight.vercel.app/auth?mode=reset
   http://localhost:8080
   http://localhost:8080/
   http://localhost:8080/auth
   http://localhost:8080/auth?mode=reset
   http://192.168.123.5:8080
   http://192.168.123.5:8080/
   http://192.168.123.5:8080/auth
   http://192.168.123.5:8080/auth?mode=reset
   ```

3. Guarda los cambios

### Paso 3: Verificar Configuración de Email Templates

Los templates de email ya están configurados para usar las URLs correctas. Verifica que en Supabase Dashboard:

1. Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/auth/templates
2. Verifica que los templates de **"Confirm signup"** y **"Reset password"** estén activos
3. Los templates personalizados están en: `docs/email-templates/`

## URLs Configuradas en el Código

El código ahora usa automáticamente:
- **Producción**: `https://habit-streak-eight.vercel.app`
- **Desarrollo**: `window.location.origin` (localhost o IP local)

Esto se maneja en `src/lib/auth-utils.ts`:

```typescript
export const getAppBaseUrl = (): string => {
  if (import.meta.env.PROD) {
    return 'https://habit-streak-eight.vercel.app';
  }
  return window.location.origin;
};
```

## Verificación

### Probar Confirmación de Email

1. Registra un nuevo usuario en producción
2. Revisa tu correo electrónico
3. Haz clic en el enlace de confirmación
4. Deberías ser redirigido a: `https://habit-streak-eight.vercel.app/`

### Probar Restablecimiento de Contraseña

1. Ve a la página de login
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa tu email
4. Revisa tu correo electrónico
5. Haz clic en el enlace de restablecimiento
6. Deberías ser redirigido a: `https://habit-streak-eight.vercel.app/auth?mode=reset`

## Troubleshooting

### Error: "Invalid redirect URL"

- **Causa**: La URL no está en la lista de Redirect URLs permitidas
- **Solución**: Agrega la URL exacta a la lista en Supabase Dashboard

### Error: "Email not sent"

- **Causa**: Configuración SMTP incorrecta
- **Solución**: Verifica la configuración SMTP en: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/settings/auth

### Los enlaces no funcionan en producción

- **Causa**: Site URL no está configurada correctamente
- **Solución**: Configura la Site URL en Settings > General > API Settings

## Notas Importantes

- ⚠️ **Nunca compartas** las Service Role Keys públicamente
- ✅ Las URLs de desarrollo (`localhost`) están incluidas para facilitar el desarrollo local
- ✅ En producción, solo se usarán las URLs de Vercel
- ✅ Los cambios en Supabase Dashboard pueden tardar unos minutos en aplicarse

