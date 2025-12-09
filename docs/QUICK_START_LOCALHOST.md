# 🚀 Guía Rápida: Desarrollo en Localhost

## Confirmar Email en Desarrollo Local

Cuando trabajas en `localhost` o `192.168.x.x`, los correos de confirmación pueden no llegar. Aquí tienes las soluciones:

### ✅ Solución Rápida: Script Automático

```bash
# Confirmar email de un usuario
node scripts/confirm-user-email.js tu-email@ejemplo.com

# Ejemplo:
node scripts/confirm-user-email.js crisjcq2004@gmail.com
```

### 📋 Otras Opciones

#### 1. Desde Supabase Dashboard (Más Fácil)

1. Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/auth/users
2. Busca tu usuario por email
3. Haz clic en el usuario
4. Haz clic en "Confirm email" o marca el checkbox "Email Confirmed"

#### 2. Deshabilitar Confirmación (Solo Desarrollo)

1. Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/auth/providers
2. Desactiva "Confirm email" en Email provider
3. ⚠️ **Solo para desarrollo**, nunca en producción

#### 3. Configurar Redirect URLs para Localhost

1. Ve a: https://supabase.com/dashboard/project/ejqcfkfqlqlchclhzeqv/auth/url-configuration
2. Agrega estas URLs:
   - `http://localhost:8080`
   - `http://192.168.123.5:8080`
   - `http://127.0.0.1:8080`

## Usuarios de Prueba (Ya Confirmados)

Estos usuarios ya están confirmados y listos para usar:

- **Admin**: `admin@habittrack.com` / `Admin123!`
- **Usuario**: `usuario@habittrack.com` / `Usuario123!`

## Comandos Útiles

```bash
# Confirmar email de un usuario
node scripts/confirm-user-email.js <email>

# Ver usuarios no confirmados (desde SQL Editor en Supabase)
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email_confirmed_at IS NULL;
```

## Estado Actual

✅ **Tu email `crisjcq2004@gmail.com` ya está confirmado** - Puedes iniciar sesión ahora.

