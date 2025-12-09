import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ChevronRight, LogOut, User, Bell, Clock, Settings, Eye, EyeOff, Camera, Lock, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type GlobalReminder = Tables<"global_reminders">;
type TimePeriod = Tables<"time_periods">;

const ProfileEditSchema = z.object({
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
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .optional()
    .refine((val) => {
      // Si se proporciona nueva contraseña, debe cumplir los mismos requisitos que en registro
      if (val && val.trim() !== '') {
        if (val.length < 8) return false;
        if (!/[A-Z]/.test(val)) return false;
        if (!/[a-z]/.test(val)) return false;
        if (!/[0-9]/.test(val)) return false;
        const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
        if (commonPasswords.includes(val.toLowerCase())) return false;
      }
      return true;
    }, { message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número" }),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // Si se proporciona nueva contraseña, debe coincidir con confirmación
  if (data.newPassword && data.newPassword.trim() !== '' && data.confirmPassword) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
}).refine((data) => {
  // Si se proporciona nueva contraseña, debe proporcionarse contraseña actual
  if (data.newPassword && data.newPassword.trim() !== '') {
    return data.currentPassword && data.currentPassword.trim() !== '';
  }
  return true;
}, {
  message: "Debes ingresar tu contraseña actual para cambiarla",
  path: ["currentPassword"],
});

type ProfileEditValues = z.infer<typeof ProfileEditSchema>;

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reminders, setReminders] = useState<GlobalReminder[]>([]);
  const [timePeriods, setTimePeriods] = useState<TimePeriod[]>([]);
  const [showTimePeriods, setShowTimePeriods] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const profileForm = useForm<ProfileEditValues>({
    resolver: zodResolver(ProfileEditSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      age: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { language } = useLanguage();
  const locale = language === "es" ? es : enUS;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setUserId(session.user.id);
      setUserEmail(session.user.email || "");
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(profileData);

      // Fetch global reminders
      const { data: remindersData } = await supabase
        .from("global_reminders")
        .select("*")
        .eq("user_id", userId);
      setReminders(remindersData || []);

      // Fetch time periods
      const { data: timePeriodsData } = await supabase
        .from("time_periods")
        .select("*")
        .eq("user_id", userId);
      
      // Initialize default time periods if none exist
      if (!timePeriodsData || timePeriodsData.length === 0) {
        const defaults = [
          { user_id: userId, period_type: "morning", start_time: "08:00" },
          { user_id: userId, period_type: "afternoon", start_time: "14:00" },
          { user_id: userId, period_type: "night", start_time: "19:00" },
          { user_id: userId, period_type: "end_of_day", start_time: "23:00" },
        ];
        const { data: inserted } = await supabase
          .from("time_periods")
          .insert(defaults)
          .select();
        setTimePeriods(inserted || []);
      } else {
        setTimePeriods(timePeriodsData);
      }
    };

    fetchData();
  }, [userId]);

  // Inicializar formulario cuando cambie el perfil
  useEffect(() => {
    if (profile && userEmail) {
      // Usar first_name y last_name de la base de datos si existen
      // Si no existen, separar full_name como fallback
      let firstName = "";
      let lastName = "";
      
      if ((profile as any).first_name) {
        firstName = (profile as any).first_name;
      } else if (profile.full_name) {
        const nameParts = profile.full_name.trim().split(/\s+/);
        firstName = nameParts[0] || "";
      }
      
      if ((profile as any).last_name) {
        lastName = (profile as any).last_name;
      } else if (profile.full_name) {
        const nameParts = profile.full_name.trim().split(/\s+/);
        lastName = nameParts.slice(1).join(" ") || "";
      }
      
      profileForm.reset({
        firstName: firstName,
        lastName: lastName,
        phone: profile.phone || "",
        age: profile.age?.toString() || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [profile, userEmail, profileForm]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const handleUpdateTimePeriod = async (periodType: string, startTime: string) => {
    if (!userId) return;
    
    const existing = timePeriods.find((tp) => tp.period_type === periodType);
    if (existing) {
      await supabase
        .from("time_periods")
        .update({ start_time: startTime })
        .eq("id", existing.id);
      setTimePeriods((prev) =>
        prev.map((tp) => (tp.id === existing.id ? { ...tp, start_time: startTime } : tp))
      );
    }
    toast({ title: "Periodo actualizado" });
  };

  const handleToggleReminder = async (reminderType: string, enabled: boolean, time: string) => {
    if (!userId) return;
    
    const existing = reminders.find((r) => r.reminder_type === reminderType);
    if (existing) {
      await supabase
        .from("global_reminders")
        .update({ enabled })
        .eq("id", existing.id);
      setReminders((prev) =>
        prev.map((r) => (r.id === existing.id ? { ...r, enabled } : r))
      );
    } else {
      const { data } = await supabase
        .from("global_reminders")
        .insert({ user_id: userId, reminder_type: reminderType, reminder_time: time, enabled })
        .select()
        .single();
      if (data) setReminders((prev) => [...prev, data]);
    }
  };

  const handleUpdateReminderTime = async (reminderType: string, time: string) => {
    if (!userId) return;
    
    const existing = reminders.find((r) => r.reminder_type === reminderType);
    if (existing) {
      await supabase
        .from("global_reminders")
        .update({ reminder_time: time })
        .eq("id", existing.id);
      setReminders((prev) =>
        prev.map((r) => (r.id === existing.id ? { ...r, reminder_time: time } : r))
      );
    }
  };

  const getTimePeriod = (type: string) => timePeriods.find((tp) => tp.period_type === type);
  const getReminder = (type: string) => reminders.find((r) => r.reminder_type === type);

  const handleSaveProfile = async (data: ProfileEditValues) => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.",
      });
      return;
    }
    
    setSaving(true);
    try {
      console.log("Guardando perfil con datos:", { ...data, currentPassword: "***", newPassword: "***", confirmPassword: "***" });
      
      // Validar que los campos obligatorios estén presentes
      if (!data.firstName || !data.lastName || !data.phone) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: "Por favor completa todos los campos obligatorios",
        });
        setSaving(false);
        return;
      }

      // Actualizar perfil en Supabase (igual que en registro)
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
      const updateData: any = {
        first_name: data.firstName.trim() || null,
        last_name: data.lastName.trim() || null,
        full_name: fullName || null,
        phone: data.phone.trim() || null,
        age: data.age || null,
      };

      // Si hay un preview de avatar pendiente, ya debería estar guardado en handleAvatarUpload
      // pero por si acaso, lo incluimos aquí también
      if (avatarPreview && avatarPreview.startsWith('http')) {
        updateData.avatar_url = avatarPreview;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (profileError) {
        console.error("Error al actualizar perfil:", profileError);
        toast({
          variant: "destructive",
          title: "Error",
          description: profileError.message || "No se pudo actualizar el perfil. Verifica que todos los campos sean válidos.",
        });
        setSaving(false);
        return;
      }

      // Si se proporcionó nueva contraseña, verificar contraseña actual y actualizarla
      if (data.newPassword && data.newPassword.trim() !== "" && data.currentPassword) {
        // Verificar contraseña actual
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: data.currentPassword,
        });

        if (signInError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "La contraseña actual es incorrecta",
          });
          setSaving(false);
          return;
        }

        // Actualizar contraseña
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.newPassword,
        });

        if (passwordError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: passwordError.message || "No se pudo actualizar la contraseña",
          });
          setSaving(false);
          return;
        }
      }

      if (profileData) {
        setProfile(profileData);
        // Limpiar preview después de guardar
        setAvatarPreview(null);
        // Cerrar collapsibles y limpiar campos de contraseña
        setShowChangePassword(false);
        profileForm.setValue("currentPassword", "");
        profileForm.setValue("newPassword", "");
        profileForm.setValue("confirmPassword", "");
        toast({
          title: "Perfil actualizado",
          description: "Tus datos se han guardado correctamente",
        });
      }
    } catch (error: any) {
      console.error("Error al guardar perfil:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil. Por favor intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validar tamaño (1 MB máximo)
    if (file.size > 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La imagen es demasiado grande. Máximo 1 MB",
      });
      return;
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor selecciona una imagen válida",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      // Crear preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Subir a Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Subir archivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("Error al subir avatar:", uploadError);
        
        // Mensajes de error más específicos
        let errorMessage = "No se pudo subir la imagen";
        
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
          errorMessage = "El bucket de avatares no está configurado. Por favor, contacta al administrador.";
        } else if (uploadError.message.includes('new row violates row-level security policy') || uploadError.message.includes('permission denied') || uploadError.message.includes('RLS')) {
          errorMessage = "No tienes permisos para subir imágenes. Por favor, asegúrate de estar autenticado correctamente.";
        } else if (uploadError.message.includes('File size exceeds')) {
          errorMessage = "La imagen es demasiado grande. Máximo 1 MB.";
        } else if (uploadError.message.includes('Invalid file type')) {
          errorMessage = "Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF, WEBP).";
        } else {
          errorMessage = uploadError.message || "Error al subir la imagen. Por favor, intenta nuevamente.";
        }
        
        toast({
          variant: "destructive",
          title: "Error al subir avatar",
          description: errorMessage,
        });
        setUploadingAvatar(false);
        event.target.value = '';
        setAvatarPreview(null);
        return;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Actualizar perfil con la nueva URL del avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Actualizar estado local
      if (profile) {
        setProfile({ ...profile, avatar_url: publicUrl });
      }

      toast({
        title: "Avatar actualizado",
        description: "Tu foto de perfil se ha guardado correctamente",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
      });
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      // Limpiar el input para permitir subir el mismo archivo de nuevo
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{t("checkingSession")}</p>
      </div>
    );
  }

  // Time Periods View
  if (showTimePeriods) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="container flex items-center gap-3 py-4">
            <Button variant="ghost" size="icon" onClick={() => setShowTimePeriods(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">{t("timePeriods")}</h1>
          </div>
        </header>

        <main className="container max-w-2xl space-y-4 px-4 py-4">
          <Card>
            <CardContent className="divide-y p-0">
              {["morning", "afternoon", "night", "end_of_day"].map((periodType) => {
                const period = getTimePeriod(periodType);
                const label = periodType === "end_of_day" ? t("endOfDay") : t(periodType as any);
                const ranges: Record<string, string> = {
                  morning: "08:00 - 14:00",
                  afternoon: "14:00 - 19:00",
                  night: "19:00 - 23:00",
                  end_of_day: "",
                };

                return (
                  <div key={periodType} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{label}</p>
                      {ranges[periodType] && (
                        <p className="text-sm text-muted-foreground">{ranges[periodType]}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("startAt")}</span>
                      <Input
                        type="time"
                        value={period?.start_time || "08:00"}
                        onChange={(e) => handleUpdateTimePeriod(periodType, e.target.value)}
                        className="w-24"
                      />
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Notifications View
  if (showNotifications) {
    const reminderTypes = [
      { type: "global", label: t("globalReminders"), defaultTime: "22:30" },
      { type: "morning", label: t("morningHabit"), defaultTime: "08:20" },
      { type: "afternoon", label: t("afternoonHabit"), defaultTime: "14:20" },
      { type: "night", label: t("nightHabit"), defaultTime: "19:20" },
    ];

    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="container flex items-center gap-3 py-4">
            <Button variant="ghost" size="icon" onClick={() => setShowNotifications(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">{t("notifications")}</h1>
          </div>
        </header>

        <main className="container max-w-2xl space-y-4 px-4 py-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {t("globalReminders")}
          </p>

          <div className="space-y-3">
            {reminderTypes.map(({ type, label, defaultTime }) => {
              const reminder = getReminder(type);
              const isEnabled = reminder?.enabled ?? false;
              const time = reminder?.reminder_time || defaultTime;

              return (
                <Card key={type}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{label}</p>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggleReminder(type, checked, time)}
                      />
                    </div>
                    {isEnabled && (
                      <div className="flex gap-2">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => handleUpdateReminderTime(type, e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="secondary" className="flex-1">
                          {t("allDays")}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <span>{t("soundEffects")}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("systemDefault")}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Main Profile View
  const fullName = profile?.full_name || userEmail.split("@")[0] || "Usuario";
  const username = userEmail.split("@")[0] || "";
  const memberSince = profile?.created_at 
    ? format(new Date(profile.created_at), "d MMMM yyyy", { locale })
    : "";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <AppHeader title={t("navProfile")} />

      <main className="container max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={avatarPreview || profile?.avatar_url || ""} />
                      <AvatarFallback className="text-2xl">
                        {fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                    >
                      <Camera className="h-5 w-5" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                  
                  <div className="text-center space-y-1">
                    <h2 className="text-2xl font-bold">{fullName}</h2>
                    <p className="text-muted-foreground">@{username}</p>
                  </div>

                  <label htmlFor="avatar-upload-button">
                    <Button
                      variant="outline"
                      className="w-full cursor-pointer"
                      asChild
                      disabled={uploadingAvatar}
                    >
                      <span>
                        {uploadingAvatar ? t("processing") : "Subir nueva foto"}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="avatar-upload-button"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />

                  <p className="text-xs text-muted-foreground text-center">
                    Sube un nuevo avatar. Las imágenes grandes se redimensionarán automáticamente. Tamaño máximo de carga es 1 MB.
                  </p>

                  {memberSince && (
                    <div className="pt-4 border-t w-full text-center">
                      <p className="text-sm text-muted-foreground">
                        Miembro desde: {memberSince}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Settings Quick Access */}
            <Card className="mt-6">
              <CardContent className="p-0 divide-y">
                <button
                  className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  onClick={() => setShowTimePeriods(true)}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>{t("timePeriods")}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  onClick={() => setShowNotifications(true)}
                >
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span>{t("notifications")}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Edit Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("editProfile")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="user-info" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="user-info">Información de Usuario</TabsTrigger>
                    <TabsTrigger value="billing">Información de Facturación</TabsTrigger>
                  </TabsList>

                  <TabsContent value="user-info" className="space-y-6 mt-6">
                    <form 
                      onSubmit={profileForm.handleSubmit(
                        handleSaveProfile,
                        (errors) => {
                          console.log("Errores de validación:", errors);
                          toast({
                            variant: "destructive",
                            title: "Error de validación",
                            description: "Por favor corrige los errores en el formulario antes de guardar",
                          });
                        }
                      )} 
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{t("firstName")} *</Label>
                        <Input
                          id="firstName"
                          {...profileForm.register("firstName")}
                          placeholder={t("firstName")}
                        />
                        {profileForm.formState.errors.firstName && (
                          <p className="text-xs text-destructive">
                            {profileForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">{t("lastName")} *</Label>
                        <Input
                          id="lastName"
                          {...profileForm.register("lastName")}
                          placeholder={t("lastName")}
                        />
                        {profileForm.formState.errors.lastName && (
                          <p className="text-xs text-destructive">
                            {profileForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">{t("email")}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userEmail}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          El correo electrónico no se puede modificar
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="age">{t("age")}</Label>
                        <Input
                          id="age"
                          type="number"
                          min="1"
                          max="120"
                          {...profileForm.register("age")}
                          placeholder={t("age")}
                        />
                        {profileForm.formState.errors.age && (
                          <p className="text-xs text-destructive">
                            {profileForm.formState.errors.age.message}
                          </p>
                        )}
                      </div>

                      {/* Cambiar Contraseña - Collapsible */}
                      <Collapsible open={showChangePassword} onOpenChange={setShowChangePassword}>
                        <CollapsibleTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              <span>Cambiar Contraseña</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${showChangePassword ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">Contraseña Actual *</Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showCurrentPassword ? "text" : "password"}
                                {...profileForm.register("currentPassword")}
                                placeholder="Ingresa tu contraseña actual"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            {profileForm.formState.errors.currentPassword && (
                              <p className="text-xs text-destructive">
                                {profileForm.formState.errors.currentPassword.message}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Debes ingresar tu contraseña actual para cambiarla
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                {...profileForm.register("newPassword")}
                                placeholder="Mínimo 8 caracteres, mayúscula, minúscula y número"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            {profileForm.formState.errors.newPassword && (
                              <p className="text-xs text-destructive">
                                {profileForm.formState.errors.newPassword.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                {...profileForm.register("confirmPassword")}
                                placeholder="Confirma tu nueva contraseña"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            {profileForm.formState.errors.confirmPassword && (
                              <p className="text-xs text-destructive">
                                {profileForm.formState.errors.confirmPassword.message}
                              </p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <div className="space-y-2">
                        <Label htmlFor="phone">{t("phone")} *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          {...profileForm.register("phone")}
                          placeholder="+34 123 456 789"
                        />
                        {profileForm.formState.errors.phone && (
                          <p className="text-xs text-destructive">
                            {profileForm.formState.errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={saving || profileForm.formState.isSubmitting}
                        >
                          {saving || profileForm.formState.isSubmitting ? t("processing") : "Actualizar información"}
                        </Button>
                        {Object.keys(profileForm.formState.errors).length > 0 && (
                          <p className="text-xs text-destructive mt-2 text-center">
                            Por favor corrige los errores en el formulario antes de guardar
                          </p>
                        )}
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="billing" className="space-y-6 mt-6">
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        La información de facturación estará disponible próximamente.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;