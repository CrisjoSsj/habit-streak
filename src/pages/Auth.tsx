  import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, Eye, EyeOff, Mail, Lock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { getEmailConfirmationUrl, getPasswordResetUrl } from "@/lib/auth-utils";

const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .nonempty({ message: "El correo es obligatorio" })
    .email({ message: "Correo electrónico no válido" })
    .max(255, { message: "El correo es demasiado largo" })
    .toLowerCase(),
  password: z
    .string()
    .nonempty({ message: "La contraseña es obligatoria" })
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .max(72, { message: "La contraseña es demasiado larga" }),
});

const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .nonempty({ message: "El correo es obligatorio" })
    .email({ message: "Correo electrónico no válido" })
    .max(255, { message: "El correo es demasiado largo" })
    .toLowerCase(),
});

const RegisterSchema = z.object({
  email: z
    .string()
    .trim()
    .nonempty({ message: "El correo es obligatorio" })
    .email({ message: "Correo electrónico no válido" })
    .max(255, { message: "El correo es demasiado largo" })
    .toLowerCase()
    .refine((email) => {
      // Validar que no sea un email temporal común
      const tempDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
      const domain = email.split('@')[1]?.toLowerCase();
      return !tempDomains.includes(domain);
    }, { message: "Por favor usa un correo electrónico válido y permanente" }),
  password: z
    .string()
    .nonempty({ message: "La contraseña es obligatoria" })
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    .max(72, { message: "La contraseña es demasiado larga" })
    .regex(/[A-Z]/, { message: "Debe contener al menos una mayúscula" })
    .regex(/[a-z]/, { message: "Debe contener al menos una minúscula" })
    .regex(/[0-9]/, { message: "Debe contener al menos un número" })
    .refine((password) => {
      // Validar que no sea una contraseña común
      const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
      return !commonPasswords.includes(password.toLowerCase());
    }, { message: "Por favor usa una contraseña más segura" }),
  confirmPassword: z
    .string()
    .nonempty({ message: "Por favor confirma tu contraseña" }),
  firstName: z
    .string()
    .trim()
    .nonempty({ message: "El nombre es obligatorio" })
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(100, { message: "El nombre es demasiado largo" })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, { message: "El nombre solo puede contener letras y espacios" }),
  lastName: z
    .string()
    .trim()
    .nonempty({ message: "Los apellidos son obligatorios" })
    .min(2, { message: "Los apellidos deben tener al menos 2 caracteres" })
    .max(100, { message: "Los apellidos son demasiado largos" })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, { message: "Los apellidos solo pueden contener letras y espacios" }),
  phone: z
    .string()
    .trim()
    .nonempty({ message: "El teléfono es obligatorio" })
    .refine((val) => {
      // Validar que tenga código de país (debe empezar con +)
      if (!val.startsWith('+')) {
        return false;
      }
      // Limpiar el teléfono (quitar espacios, guiones, paréntesis)
      const cleanPhone = val.replace(/[\s\-\(\)]/g, '');
      // Validar formato internacional E.164: +[código país 1-3 dígitos][número 4-14 dígitos]
      // Longitud total: mínimo 8 caracteres (ej: +1234567), máximo 16 caracteres (ej: +123456789012345)
      const phoneRegex = /^\+[1-9]\d{1,3}\d{4,14}$/;
      return phoneRegex.test(cleanPhone) && cleanPhone.length >= 8 && cleanPhone.length <= 16;
    }, { message: "Debe incluir código de país con formato internacional (ejemplo: +34 123 456 789)" }),
  age: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1 && num <= 120;
    }, { message: "La edad debe ser un número entre 1 y 120" })
    .transform((val) => (val && val !== '' ? parseInt(val, 10) : undefined)),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof LoginSchema>;
type RegisterValues = z.infer<typeof RegisterSchema>;
type ForgotPasswordValues = z.infer<typeof ForgotPasswordSchema>;

type AuthMode = "login" | "register" | "forgot";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [resendEmail, setResendEmail] = useState<string | null>(null);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
  });

  const forgotPasswordForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  // Calcular fortaleza de contraseña
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 40) return "bg-red-500";
    if (strength < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength < 40) return "Débil";
    if (strength < 70) return "Media";
    return "Fuerte";
  };

  useEffect(() => {
    document.title = "Acceso a HabitTrack · Sistema de Gestión de Hábitos";

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        checkRoleAndRedirect(data.session.user.id);
      }
    });
  }, [navigate]);

  const checkRoleAndRedirect = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/app", { replace: true });
    }
  };

  const onLoginSubmit = async (values: LoginValues) => {
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("Login error:", {
          message: error.message,
          status: error.status,
          name: error.name,
          fullError: error
        });
        
        // Traducir mensajes de error comunes de Supabase
        let errorMsg = error.message;
        
        // Errores 400 (Bad Request)
        if (error.status === 400) {
          if (error.message.includes("Invalid login credentials") || 
              error.message.includes("Invalid credentials") ||
              error.message.includes("incorrect")) {
            errorMsg = "Correo o contraseña incorrectos. Por favor, verifica tus credenciales.";
          } else if (error.message.includes("Email not confirmed") ||
                     error.message.includes("email_not_confirmed")) {
            errorMsg = "Por favor, confirma tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.";
          } else if (error.message.includes("User not found") ||
                     error.message.includes("user_not_found")) {
            errorMsg = "No existe una cuenta con este correo electrónico. ¿Quieres registrarte?";
          } else if (error.message.includes("Email rate limit") ||
                     error.message.includes("rate_limit")) {
            errorMsg = "Demasiados intentos. Por favor, espera 5-10 minutos antes de intentar nuevamente.";
          } else {
            errorMsg = "Error al iniciar sesión. Por favor, verifica que tu correo y contraseña sean correctos.";
          }
        } 
        // Errores 429 (Too Many Requests)
        else if (error.status === 429) {
          errorMsg = "Demasiados intentos. Por favor, espera 5-10 minutos antes de intentar nuevamente.";
        }
        // Otros errores
        else {
          if (error.message.includes("Invalid login credentials")) {
            errorMsg = "Correo o contraseña incorrectos. Por favor, verifica tus credenciales.";
          } else if (error.message.includes("Email not confirmed")) {
            errorMsg = "Por favor, confirma tu correo electrónico antes de iniciar sesión.";
          } else if (error.message.includes("Too many requests")) {
            errorMsg = "Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.";
          } else if (error.message.includes("User not found")) {
            errorMsg = "No existe una cuenta con este correo electrónico.";
          }
        }
        
        setErrorMessage(errorMsg);
        setLoading(false);
        return;
      }

      if (data.session && data.user) {
        await checkRoleAndRedirect(data.user.id);
      } else if (data.user && !data.session) {
        // Usuario existe pero no hay sesión (probablemente email no confirmado)
        setErrorMessage("Por favor, confirma tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.");
      } else {
        // Caso inesperado
        setErrorMessage("No se pudo iniciar sesión. Por favor, intenta nuevamente.");
      }
    } catch (error: any) {
      console.error("Login error (catch):", {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        name: error?.name,
        fullError: error
      });
      
      let errorMsg = "Ocurrió un error al iniciar sesión. Por favor, intenta nuevamente.";
      
      if (error?.status === 400) {
        if (error?.message?.includes("Invalid") || error?.message?.includes("incorrect")) {
          errorMsg = "Correo o contraseña incorrectos. Por favor, verifica tus credenciales.";
        } else if (error?.message?.includes("not confirmed") || error?.message?.includes("email_not_confirmed")) {
          errorMsg = "Por favor, confirma tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.";
        } else {
          errorMsg = error?.message || "Error al iniciar sesión. Verifica tus credenciales.";
        }
      } else if (error?.status === 429) {
        errorMsg = "Demasiadas solicitudes. Por favor, espera 5-10 minutos antes de intentar nuevamente.";
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (values: RegisterValues) => {
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const redirectUrl = getEmailConfirmationUrl();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: `${values.firstName} ${values.lastName}`.trim(),
            first_name: values.firstName.trim(),
            last_name: values.lastName.trim(),
          },
        },
      });

      if (error) {
        // Traducir mensajes de error comunes de Supabase
        let errorMsg = error.message;
        if (error.message.includes("User already registered") || error.message.includes("already registered")) {
          errorMsg = "Ya existe una cuenta con este correo electrónico. Inicia sesión en su lugar.";
        } else if (error.message.includes("Password should be at least")) {
          errorMsg = "La contraseña debe cumplir con los requisitos de seguridad.";
        } else if (error.message.includes("Invalid email")) {
          errorMsg = "El correo electrónico no es válido.";
        } else if (error.message.includes("Email rate limit exceeded") || error.status === 429) {
          errorMsg = "Demasiados intentos. Por favor, espera 5-10 minutos antes de intentar nuevamente. Esto es una medida de seguridad para proteger tu cuenta.";
        } else if (error.status === 429) {
          errorMsg = "Demasiadas solicitudes. Por favor, espera unos minutos antes de intentar nuevamente.";
        }
        console.error("Signup error:", error);
        setErrorMessage(errorMsg);
        setLoading(false);
        return;
      }

      // Verificar si el usuario necesita confirmar su email
      const needsEmailConfirmation = data.user && !data.session;

      // Create profile with extended data
      // Nota: El trigger en la BD crea el perfil básico automáticamente
      // Aquí solo actualizamos con los datos adicionales del formulario
      if (data.user) {
        try {
          // Esperar un momento para que el trigger cree el perfil básico
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Obtener la zona horaria del navegador
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          // Actualizar el perfil con los datos adicionales del formulario
          const { error: profileError } = await supabase.from("profiles").update({
            first_name: values.firstName.trim() || null,
            last_name: values.lastName.trim() || null,
            full_name: `${values.firstName} ${values.lastName}`.trim(),
            phone: values.phone.trim() || null,
            age: values.age || null,
            timezone: userTimezone,
          }).eq("id", data.user.id);

          if (profileError) {
            console.error("Profile update error:", {
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint,
              code: profileError.code,
              fullError: profileError
            });
            
            // Si el perfil no existe aún (puede pasar si el trigger falla), intentar crearlo
            if (profileError.code === "PGRST116" || profileError.message.includes("No rows")) {
              // Intentar crear el perfil manualmente usando upsert
              // Obtener la zona horaria del navegador
              const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              
              const { error: createError } = await supabase.from("profiles").upsert({
                id: data.user.id,
                first_name: values.firstName.trim() || null,
                last_name: values.lastName.trim() || null,
                full_name: `${values.firstName} ${values.lastName}`.trim(),
                phone: values.phone.trim() || null,
                age: values.age || null,
                timezone: userTimezone,
              }, {
                onConflict: 'id'
              });
              
              if (createError) {
                console.error("Profile creation fallback error:", createError);
                setErrorMessage("Error al crear el perfil. Por favor, intenta iniciar sesión o contacta al soporte.");
                setLoading(false);
                return;
              }
            } else {
              // Mensajes de error más específicos
              let profileErrorMsg = "Error al actualizar el perfil.";
              if (profileError.message.includes("violates foreign key")) {
                profileErrorMsg = "Error de validación. Por favor, intenta nuevamente.";
              } else if (profileError.message.includes("rate limit") || profileError.message.includes("429")) {
                profileErrorMsg = "Demasiadas solicitudes. Por favor, espera unos minutos.";
              } else if (profileError.message.includes("permission") || profileError.message.includes("401")) {
                profileErrorMsg = "Error de permisos. Por favor, intenta iniciar sesión nuevamente.";
              }
              
              setErrorMessage(profileErrorMsg);
              setLoading(false);
              return;
            }
          }

          // El rol ya debería estar creado por el trigger, pero verificamos/actualizamos por si acaso
          // Usar upsert para evitar errores si ya existe
          const { error: roleError } = await supabase.from("user_roles").upsert({
            user_id: data.user.id,
            role: "user",
          }, {
            onConflict: 'user_id'
          });

          if (roleError) {
            console.error("Role assignment error:", {
              message: roleError.message,
              details: roleError.details,
              code: roleError.code,
              fullError: roleError
            });
            // No bloqueamos el registro si falla la asignación de rol, solo lo registramos
          }
        } catch (profileCreationError: any) {
          console.error("Unexpected error during profile creation:", profileCreationError);
          setErrorMessage("Error inesperado al crear el perfil. Por favor, intenta nuevamente o contacta al soporte.");
          setLoading(false);
          return;
        }
      }

      if (needsEmailConfirmation) {
        setResendEmail(values.email);
        setInfoMessage(
          `¡Cuenta creada exitosamente! Se ha enviado un correo de verificación a ${values.email}. Por favor, revisa tu bandeja de entrada y haz clic en el enlace para confirmar tu cuenta antes de iniciar sesión.`,
        );
      } else if (data.session) {
        // Si ya tiene sesión (email confirmado automáticamente o en desarrollo)
        setInfoMessage("Cuenta creada correctamente. Redirigiendo...");
        await checkRoleAndRedirect(data.user!.id);
        return;
      } else {
        setInfoMessage(
          "Cuenta creada correctamente. Inicie sesión para continuar.",
        );
      }
      setMode("login");
    } catch (error: any) {
      console.error("Registration error:", {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        fullError: error
      });
      
      let errorMsg = "Ocurrió un error al registrar. Por favor, intenta nuevamente.";
      
      // Manejar errores específicos
      if (error?.status === 429) {
        errorMsg = "Demasiadas solicitudes. Por favor, espera 5-10 minutos antes de intentar nuevamente.";
      } else if (error?.message) {
        if (error.message.includes("rate limit") || error.message.includes("Too Many Requests")) {
          errorMsg = "Demasiadas solicitudes. Por favor, espera 5-10 minutos antes de intentar nuevamente.";
        } else {
          errorMsg = error.message;
        }
      } else if (error?.statusText) {
        errorMsg = `Error ${error.status}: ${error.statusText}`;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const onForgotPasswordSubmit = async (values: ForgotPasswordValues) => {
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: getPasswordResetUrl(),
      });

      if (error) {
        // Traducir mensajes de error comunes de Supabase
        let errorMsg = error.message;
        if (error.message.includes("User not found")) {
          errorMsg = "No existe una cuenta con este correo electrónico.";
        } else if (error.message.includes("Email rate limit exceeded")) {
          errorMsg = "Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.";
        } else if (error.message.includes("Invalid email")) {
          errorMsg = "El correo electrónico no es válido.";
        }
        setErrorMessage(errorMsg);
        return;
      }

      setInfoMessage("Se ha enviado un correo con las instrucciones para restablecer tu contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      // Reenviar correo de verificación usando signInWithOtp
      // Esto envía un magic link que también puede servir para verificar el email
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: getEmailConfirmationUrl(),
        },
      });

      if (error) {
        let errorMsg = error.message;
        if (error.message.includes("Email rate limit exceeded")) {
          errorMsg = "Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.";
        } else if (error.message.includes("User not found")) {
          errorMsg = "No existe una cuenta con este correo electrónico. Por favor, regístrate primero.";
        } else if (error.message.includes("signups_disabled")) {
          errorMsg = "Los registros están deshabilitados temporalmente.";
        }
        setErrorMessage(errorMsg);
        return;
      }

      setInfoMessage(`Se ha enviado un correo de verificación a ${email}. Por favor, revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-accent/10">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide text-primary">{t("brand")}</span>
              <span className="text-xs text-muted-foreground">{t("tagline")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container flex flex-1 items-center justify-center py-10">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold">{t("accessTitle")}</CardTitle>
            <CardDescription className="text-sm">
              {t("accessSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "forgot" ? (
              <Tabs value="forgot" className="space-y-4">
                <TabsContent value="forgot" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Recuperar contraseña</h3>
                      <p className="text-sm text-muted-foreground">
                        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                      </p>
                    </div>
                    <form className="space-y-4" onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} noValidate>
                      <div className="space-y-1">
                        <Label htmlFor="forgot-email">{t("email")}</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            id="forgot-email" 
                            type="email" 
                            autoComplete="email" 
                            className="pl-9"
                            placeholder="tu@email.com"
                            {...forgotPasswordForm.register("email")}
                          />
                        </div>
                        {forgotPasswordForm.formState.errors.email && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            {forgotPasswordForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                    {errorMessage && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
                      </Alert>
                    )}

                    {infoMessage && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription className="text-xs">{infoMessage}</AlertDescription>
                      </Alert>
                    )}

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setMode("login");
                            setErrorMessage(null);
                            setInfoMessage(null);
                            forgotPasswordForm.reset();
                          }}
                        >
                          Volver
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={loading}
                        >
                          {loading ? "Enviando..." : "Enviar correo"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <Tabs
                value={mode}
                onValueChange={(value) => {
                  setMode(value as AuthMode);
                  setErrorMessage(null);
                  setInfoMessage(null);
                  setResendEmail(null);
                }}
                className="space-y-4"
              >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t("loginTab")}</TabsTrigger>
                <TabsTrigger value="register">{t("registerTab")}</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form className="space-y-4" onSubmit={loginForm.handleSubmit(onLoginSubmit)} noValidate>
                  <div className="space-y-1">
                    <Label htmlFor="login-email">{t("email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        id="login-email" 
                        type="email" 
                        autoComplete="email" 
                        className="pl-9"
                        {...loginForm.register("email")} 
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="login-password">{t("password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        id="login-password" 
                        type={showPassword ? "text" : "password"} 
                        autoComplete="current-password" 
                        className="pl-9 pr-9"
                        {...loginForm.register("password")} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  {errorMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {infoMessage && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {infoMessage}
                        {infoMessage.includes("correo de verificación") && resendEmail && (
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={loading}
                              onClick={() => resendVerificationEmail(resendEmail)}
                            >
                              Reenviar correo
                            </Button>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t("processing") : t("enter")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form className="space-y-4" onSubmit={registerForm.handleSubmit(onRegisterSubmit)} noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="reg-firstName">{t("firstName")}</Label>
                      <Input id="reg-firstName" type="text" autoComplete="given-name" {...registerForm.register("firstName")} />
                      {registerForm.formState.errors.firstName && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {registerForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reg-lastName">{t("lastName")}</Label>
                      <Input id="reg-lastName" type="text" autoComplete="family-name" {...registerForm.register("lastName")} />
                      {registerForm.formState.errors.lastName && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {registerForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="reg-phone">{t("phone")} <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+</span>
                        <Input 
                          id="reg-phone" 
                          type="tel" 
                          autoComplete="tel" 
                          className="pl-6"
                          placeholder="34 123 456 789"
                          {...registerForm.register("phone", {
                            onChange: (e) => {
                              let value = e.target.value;
                              // Remover todo excepto números, espacios, guiones, paréntesis y +
                              value = value.replace(/[^\d\s\-\(\)\+]/g, '');
                              
                              // Agregar automáticamente el + si no está presente
                              if (value && !value.startsWith('+')) {
                                value = '+' + value.replace(/^\+/g, '');
                              }
                              
                              // Actualizar el valor
                              e.target.value = value;
                              registerForm.setValue('phone', value, { shouldValidate: true });
                            },
                          })} 
                        />
                      </div>
                      {registerForm.formState.errors.phone && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {registerForm.formState.errors.phone.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Formato: +[código país] [número] (ejemplo: +34 123 456 789)
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reg-age">{t("age")}</Label>
                      <Input id="reg-age" type="number" min="1" max="120" {...registerForm.register("age")} />
                      {registerForm.formState.errors.age && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {registerForm.formState.errors.age.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-email">{t("email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="reg-email" type="email" autoComplete="email" className="pl-9" {...registerForm.register("email")} />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-password">{t("password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        id="reg-password" 
                        type={showPassword ? "text" : "password"} 
                        autoComplete="new-password" 
                        className="pl-9 pr-9"
                        {...registerForm.register("password", {
                          onChange: (e) => {
                            const strength = calculatePasswordStrength(e.target.value);
                            setPasswordStrength(strength);
                          },
                        })} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerForm.watch("password") && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Fortaleza:</span>
                          <span className={`font-medium ${
                            passwordStrength < 40 ? "text-red-500" : 
                            passwordStrength < 70 ? "text-yellow-500" : 
                            "text-green-500"
                          }`}>
                            {getPasswordStrengthText(passwordStrength)}
                          </span>
                        </div>
                        <Progress value={passwordStrength} className="h-1.5" />
                      </div>
                    )}
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-confirmPassword">{t("confirmPassword")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        id="reg-confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"} 
                        autoComplete="new-password" 
                        className="pl-9 pr-9"
                        {...registerForm.register("confirmPassword")} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {errorMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {infoMessage && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {infoMessage}
                        {infoMessage.includes("correo de verificación") && resendEmail && (
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={loading}
                              onClick={() => resendVerificationEmail(resendEmail)}
                            >
                              Reenviar correo
                            </Button>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t("processing") : t("createAccount")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            )}

          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
