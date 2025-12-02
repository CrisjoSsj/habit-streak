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

const AuthSchema = z.object({
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

type AuthValues = z.infer<typeof AuthSchema>;

type AuthMode = "login" | "register";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthValues>({
    resolver: zodResolver(AuthSchema),
  });

  useEffect(() => {
    // Si ya hay sesión, redirigimos al panel principal
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/", { replace: true });
      }
    });
  }, [navigate]);

  const onSubmit = async (values: AuthValues) => {
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) {
          setErrorMessage(error.message || "No se pudo iniciar sesión. Inténtalo de nuevo.");
          return;
        }

        navigate("/", { replace: true });
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          setErrorMessage(error.message || "No se pudo crear la cuenta. Inténtalo de nuevo.");
          return;
        }

        setInfoMessage(
          "Cuenta creada correctamente. Revisa tu correo para confirmar el acceso si es necesario y luego inicia sesión.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/20">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-wide text-primary">HABITTRACK</span>
            <span className="text-xs text-muted-foreground">Acceso a tu panel de hábitos</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <a href="/" className="text-muted-foreground hover:text-foreground">
              Volver al inicio
            </a>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container flex min-h-[calc(100vh-5rem)] items-center justify-center py-10">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-semibold">Accede a HabitTrack</CardTitle>
            <CardDescription className="text-center text-sm">
              Inicia sesión para continuar con tus hábitos o crea una cuenta nueva en segundos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={mode}
              onValueChange={(value) => setMode(value as AuthMode)}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="register">Crear cuenta</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="space-y-1">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" type="email" autoComplete="email" {...register("email")} />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
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
                    {loading ? "Procesando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="space-y-1">
                    <Label htmlFor="email-register">Correo electrónico</Label>
                    <Input id="email-register" type="email" autoComplete="email" {...register("email")} />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password-register">Contraseña</Label>
                    <Input
                      id="password-register"
                      type="password"
                      autoComplete="new-password"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
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
                    {loading ? "Procesando..." : "Crear cuenta"}
                  </Button>
                  <p className="mt-1 text-center text-[0.7rem] text-muted-foreground">
                    Al crear una cuenta aceptas que gestionemos tus hábitos de forma privada y segura en nuestro
                    backend.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
