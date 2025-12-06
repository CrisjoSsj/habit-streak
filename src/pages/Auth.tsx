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
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield } from "lucide-react";

const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .nonempty({ message: "El correo es obligatorio" })
    .email({ message: "Correo electrónico no válido" })
    .max(255, { message: "El correo es demasiado largo" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .max(72, { message: "La contraseña es demasiado larga" }),
});

const RegisterSchema = z.object({
  email: z
    .string()
    .trim()
    .nonempty({ message: "El correo es obligatorio" })
    .email({ message: "Correo electrónico no válido" })
    .max(255, { message: "El correo es demasiado largo" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .max(72, { message: "La contraseña es demasiado larga" }),
  firstName: z
    .string()
    .trim()
    .nonempty({ message: "El nombre es obligatorio" })
    .max(100, { message: "El nombre es demasiado largo" }),
  lastName: z
    .string()
    .trim()
    .nonempty({ message: "Los apellidos son obligatorios" })
    .max(100, { message: "Los apellidos son demasiado largos" }),
  phone: z
    .string()
    .trim()
    .max(20, { message: "El teléfono es demasiado largo" })
    .optional(),
  age: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 1 && val <= 120), {
      message: "Edad debe ser entre 1 y 120",
    }),
});

type LoginValues = z.infer<typeof LoginSchema>;
type RegisterValues = z.infer<typeof RegisterSchema>;

type AuthMode = "login" | "register";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
  });

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
        setErrorMessage(error.message || "No se pudo iniciar sesión. Inténtalo de nuevo.");
        return;
      }

      if (data.user) {
        await checkRoleAndRedirect(data.user.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (values: RegisterValues) => {
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: `${values.firstName} ${values.lastName}`.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || "No se pudo crear la cuenta. Inténtalo de nuevo.");
        return;
      }

      // Create profile with extended data
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: `${values.firstName} ${values.lastName}`.trim(),
          last_name: values.lastName,
          phone: values.phone || null,
          age: values.age || null,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      }

      setInfoMessage(
        "Cuenta creada correctamente. Inicie sesión para continuar.",
      );
      setMode("login");
    } finally {
      setLoading(false);
    }
  };

  const createTestAccount = async (type: "admin" | "user") => {
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    const email = type === "admin" ? "admin@habittrack.com" : "usuario@habittrack.com";
    const password = type === "admin" ? "admin123" : "usuario123";
    const redirectUrl = `${window.location.origin}/`;

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        const message = error.message?.toLowerCase() ?? "";
        if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
          setInfoMessage(
            `La cuenta de demostración (${email}) ya existe. Puede iniciar sesión directamente.`,
          );
        } else {
          setErrorMessage(error.message || "No se pudo crear la cuenta de demostración.");
        }
        return;
      }

      setInfoMessage(
        `Cuenta de demostración creada (${email}). Ahora puede iniciar sesión.`,
      );
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
            <Tabs
              value={mode}
              onValueChange={(value) => setMode(value as AuthMode)}
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
                    <Input id="login-email" type="email" autoComplete="email" {...loginForm.register("email")} />
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="login-password">{t("password")}</Label>
                    <Input id="login-password" type="password" autoComplete="current-password" {...loginForm.register("password")} />
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  {errorMessage && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {infoMessage && (
                    <Alert>
                      <AlertDescription className="text-xs">{infoMessage}</AlertDescription>
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
                        <p className="text-xs text-destructive">{registerForm.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reg-lastName">{t("lastName")}</Label>
                      <Input id="reg-lastName" type="text" autoComplete="family-name" {...registerForm.register("lastName")} />
                      {registerForm.formState.errors.lastName && (
                        <p className="text-xs text-destructive">{registerForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="reg-phone">{t("phone")}</Label>
                      <Input id="reg-phone" type="tel" autoComplete="tel" {...registerForm.register("phone")} />
                      {registerForm.formState.errors.phone && (
                        <p className="text-xs text-destructive">{registerForm.formState.errors.phone.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reg-age">{t("age")}</Label>
                      <Input id="reg-age" type="number" min="1" max="120" {...registerForm.register("age")} />
                      {registerForm.formState.errors.age && (
                        <p className="text-xs text-destructive">{registerForm.formState.errors.age.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-email">{t("email")}</Label>
                    <Input id="reg-email" type="email" autoComplete="email" {...registerForm.register("email")} />
                    {registerForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-password">{t("password")}</Label>
                    <Input id="reg-password" type="password" autoComplete="new-password" {...registerForm.register("password")} />
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  {errorMessage && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {infoMessage && (
                    <Alert>
                      <AlertDescription className="text-xs">{infoMessage}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t("processing") : t("createAccount")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 space-y-2 rounded-md border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("testAccounts")}</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>
                  <span className="font-semibold">Admin:</span> admin@habittrack.com / <span className="font-mono">admin123</span>
                </li>
                <li>
                  <span className="font-semibold">Usuario:</span> usuario@habittrack.com / <span className="font-mono">usuario123</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  disabled={loading}
                  onClick={() => createTestAccount("admin")}
                >
                  {t("createAdminAccount")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  disabled={loading}
                  onClick={() => createTestAccount("user")}
                >
                  {t("createUserAccount")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
