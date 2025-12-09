# 🏠 Configuración para Desarrollo Local (Localhost)

## Problema: Confirmación de Email en Localhost

Cuando trabajas en desarrollo local (`localhost` o `192.168.x.x`), los correos de confirmación de Supabase pueden no llegar o las URLs de confirmación pueden no funcionar correctamente.

## Soluciones

### Opción 1: Confirmar Email Manualmente (Recomendado para Desarrollo)

#### Método A: Usar el Script Automático

```bash
# Confirmar email de un usuario específico
node scripts/confirm-user-email.js crisjcq2004@gmail.com

# O confirmar el email por defecto (crisjcq2004@gmail.com)
node scripts/confirm-user-email.js
```

#### Método B: Desde Supabase Dashboard

1. Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/auth/users
2. Busca el usuario por email
3. Haz clic en el usuario
4. En la sección "Email", haz clic en "Confirm email" o marca el checkbox "Email Confirmed"

#### Método C: Usando SQL Directamente

```sql
-- Confirmar email de un usuario específico
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'tu-email@ejemplo.com'
  AND email_confirmed_at IS NULL;
```

### Opción 2: Deshabilitar Confirmación de Email para Desarrollo

**⚠️ Solo para desarrollo local, NO para producción**

1. Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/auth/providers
2. En la sección "Email", desactiva "Confirm email"
3. Guarda los cambios

**Nota**: Esto permite que los usuarios inicien sesión sin confirmar su email. Solo úsalo en desarrollo.

### Opción 3: Configurar Redirect URLs para Localhost

Para que los correos de confirmación funcionen en localhost:

1. Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/auth/url-configuration
2. Agrega las siguientes URLs a "Redirect URLs":
   - `http://localhost:8080`
   - `http://192.168.123.5:8080`
   - `http://127.0.0.1:8080`
3. Guarda los cambios

### Opción 4: Usar Magic Link en lugar de Contraseña (Solo para Desarrollo)

Para desarrollo rápido, puedes usar Magic Link que no requiere confirmación previa:

```typescript
// En lugar de signInWithPassword, usar:
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'tu-email@ejemplo.com',
  options: {
    emailRedirectTo: 'http://localhost:8080/app'
  }
});
```

## Scripts Útiles

### Confirmar Email de Usuario

```bash
node scripts/confirm-user-email.js <email>
```

### Listar Usuarios No Confirmados

```sql
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;
```

### Confirmar Todos los Usuarios No Confirmados (Solo Desarrollo)

```sql
-- ⚠️ CUIDADO: Esto confirma TODOS los emails no confirmados
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

## Recomendación para Desarrollo

1. **Usa el script `confirm-user-email.js`** para confirmar emails rápidamente durante desarrollo
2. **Mantén la confirmación de email habilitada** para simular el comportamiento de producción
3. **Confirma manualmente** los usuarios de prueba cuando los necesites

## Verificación

Después de confirmar el email, verifica que puedas iniciar sesión:

```bash
# El usuario debería poder iniciar sesión normalmente
# Email: crisjcq2004@gmail.com
# Contraseña: (la que usaste al registrarte)
```

## Troubleshooting

### Error: "Email not confirmed"
- **Solución**: Usa el script `confirm-user-email.js` o confirma manualmente desde el Dashboard

### Error: "Invalid login credentials"
- **Solución**: Verifica que el email y contraseña sean correctos
- **Solución**: Asegúrate de que el email esté confirmado

### Los correos no llegan en localhost
- **Solución**: Esto es normal. Usa el script de confirmación manual o deshabilita la confirmación para desarrollo

