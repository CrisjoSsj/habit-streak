import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, LogOut, User, Bell, Clock, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <AppHeader />

      <main className="container max-w-2xl space-y-6 px-4 py-4">
        {/* Profile Card */}
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">
                {profile?.full_name || profile?.last_name
                  ? `${profile?.full_name || ""} ${profile?.last_name || ""}`.trim()
                  : userEmail}
              </p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
            <Button variant="outline" size="sm">
              {t("editProfile")}
            </Button>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted-foreground px-1">
            {t("settings")}
          </p>
          
          <Card>
            <CardContent className="divide-y p-0">
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

        {/* Appearance Section */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted-foreground px-1">
            Apariencia
          </p>
          
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <span>Tema</span>
              <ModeToggle />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <span>Idioma</span>
              <LanguageToggle />
            </CardContent>
          </Card>
        </div>

        {/* Sign Out */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("logout")}
        </Button>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;