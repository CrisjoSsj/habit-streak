# 📧 Templates de Correo Electrónico - HabitTrack

## Descripción

Templates HTML personalizados para los correos de autenticación de Supabase. Estos templates son consistentes con el diseño de HabitTrack y usan el color primario naranja (#FF6B35).

## Configuración en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a: **Project Settings > Auth > Email Templates**
3. Selecciona el tipo de correo que quieres personalizar
4. Copia y pega el template correspondiente
5. Guarda los cambios

## Variables Disponibles

Supabase proporciona las siguientes variables que puedes usar en los templates:

- `{{ .ConfirmationURL }}` - URL para confirmar la acción
- `{{ .Token }}` - Código OTP (6 dígitos)
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL del sitio
- `{{ .Email }}` - Email del usuario
- `{{ .RedirectTo }}` - URL de redirección después de la acción

---

## 1. Confirmación de Cuenta (Signup)

**Tipo**: `Confirm signup`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirma tu cuenta - HabitTrack</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎯 Bienvenido a HabitTrack
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                Confirma tu cuenta para comenzar
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                ¡Hola!
              </p>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Gracias por registrarte en <strong>HabitTrack</strong>. Estamos emocionados de tenerte a bordo.
              </p>
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Para completar tu registro, por favor confirma tu dirección de correo electrónico haciendo clic en el botón de abajo:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);">
                      Confirmar mi cuenta
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative: OTP Code -->
              <p style="margin: 30px 0 10px 0; color: #666666; font-size: 14px; text-align: center;">
                O ingresa este código en la aplicación:
              </p>
              <table role="presentation" style="width: 100%; margin: 20px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 20px 40px; background-color: #f8f9fa; border: 2px dashed #FF6B35; border-radius: 8px;">
                      <span style="font-size: 32px; font-weight: 700; color: #FF6B35; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        {{ .Token }}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Link fallback -->
              <p style="margin: 30px 0 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #FF6B35; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                Este correo fue enviado porque creaste una cuenta en HabitTrack.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer Brand -->
        <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; text-align: center;">
          © 2025 HabitTrack. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Recuperación de Contraseña (Password Recovery)

**Tipo**: `Reset password`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperar contraseña - HabitTrack</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🔐 Recuperar Contraseña
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                Restablece tu contraseña de HabitTrack
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hola,
              </p>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>HabitTrack</strong>.
              </p>
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Haz clic en el botón de abajo para crear una nueva contraseña:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative: OTP Code -->
              <p style="margin: 30px 0 10px 0; color: #666666; font-size: 14px; text-align: center;">
                O ingresa este código en la aplicación:
              </p>
              <table role="presentation" style="width: 100%; margin: 20px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 20px 40px; background-color: #f8f9fa; border: 2px dashed #FF6B35; border-radius: 8px;">
                      <span style="font-size: 32px; font-weight: 700; color: #FF6B35; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        {{ .Token }}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <div style="margin: 30px 0; padding: 20px; background-color: #fff3e0; border-left: 4px solid #FF6B35; border-radius: 4px;">
                <p style="margin: 0; color: #e65100; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por seguridad. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
                </p>
              </div>
              
              <!-- Link fallback -->
              <p style="margin: 30px 0 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #FF6B35; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                Este correo fue enviado porque solicitaste restablecer tu contraseña.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Si no solicitaste este cambio, tu cuenta está segura y puedes ignorar este correo.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer Brand -->
        <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; text-align: center;">
          © 2025 HabitTrack. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic Link (Inicio de sesión)

**Tipo**: `Magic Link`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Iniciar sesión - HabitTrack</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ✨ Iniciar Sesión
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                Accede a tu cuenta de HabitTrack
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hola,
              </p>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Haz clic en el botón de abajo para iniciar sesión en tu cuenta de <strong>HabitTrack</strong>:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);">
                      Iniciar sesión
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative: OTP Code -->
              <p style="margin: 30px 0 10px 0; color: #666666; font-size: 14px; text-align: center;">
                O ingresa este código en la aplicación:
              </p>
              <table role="presentation" style="width: 100%; margin: 20px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 20px 40px; background-color: #f8f9fa; border: 2px dashed #FF6B35; border-radius: 8px;">
                      <span style="font-size: 32px; font-weight: 700; color: #FF6B35; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        {{ .Token }}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <div style="margin: 30px 0; padding: 20px; background-color: #e3f2fd; border-left: 4px solid #2196F3; border-radius: 4px;">
                <p style="margin: 0; color: #1565c0; font-size: 14px; line-height: 1.6;">
                  <strong>🔒 Seguridad:</strong> Este enlace es válido por 1 hora. Si no solicitaste iniciar sesión, puedes ignorar este correo de forma segura.
                </p>
              </div>
              
              <!-- Link fallback -->
              <p style="margin: 30px 0 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #FF6B35; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                Este correo fue enviado porque solicitaste iniciar sesión en HabitTrack.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Si no solicitaste este acceso, tu cuenta está segura y puedes ignorar este correo.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer Brand -->
        <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; text-align: center;">
          © 2025 HabitTrack. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Cambio de Email

**Tipo**: `Change Email Address`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmar cambio de email - HabitTrack</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                📧 Confirmar Cambio de Email
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                Confirma tu nueva dirección de correo
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hola,
              </p>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para cambiar la dirección de correo electrónico de tu cuenta en <strong>HabitTrack</strong>.
              </p>
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Haz clic en el botón de abajo para confirmar el cambio:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);">
                      Confirmar cambio de email
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <div style="margin: 30px 0; padding: 20px; background-color: #fff3e0; border-left: 4px solid #FF6B35; border-radius: 4px;">
                <p style="margin: 0; color: #e65100; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Importante:</strong> Si no solicitaste este cambio, por favor ignora este correo y contacta con soporte inmediatamente.
                </p>
              </div>
              
              <!-- Link fallback -->
              <p style="margin: 30px 0 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #FF6B35; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                Este correo fue enviado porque solicitaste cambiar tu dirección de correo electrónico.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Si no solicitaste este cambio, tu cuenta está segura y puedes ignorar este correo.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer Brand -->
        <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; text-align: center;">
          © 2025 HabitTrack. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Características de los Templates

✅ **Diseño Responsive**: Se adaptan a dispositivos móviles y escritorio  
✅ **Consistencia Visual**: Usan el color primario naranja (#FF6B35) de HabitTrack  
✅ **Profesional**: Diseño limpio y moderno  
✅ **Accesible**: Estructura HTML semántica y buena legibilidad  
✅ **Seguridad**: Incluyen avisos de seguridad cuando es necesario  
✅ **Fallback**: Incluyen código OTP y enlace alternativo  

## Notas Importantes

1. **Variables de Supabase**: Asegúrate de usar las variables correctas según el tipo de correo
2. **Pruebas**: Prueba cada template antes de ponerlo en producción
3. **Personalización**: Puedes ajustar colores, textos y estilos según tus necesidades
4. **Idioma**: Los templates están en español, pero puedes traducirlos fácilmente

## Cómo Probar

1. Configura los templates en Supabase Dashboard
2. Prueba cada tipo de correo:
   - Registra un nuevo usuario
   - Solicita recuperación de contraseña
   - Solicita magic link
   - Cambia el email de un usuario
3. Verifica que los correos se vean correctamente en diferentes clientes de correo (Gmail, Outlook, etc.)

