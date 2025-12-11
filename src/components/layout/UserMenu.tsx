import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Shield, Flame } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTodayInUserTimezone, getTodayForSupabase } from "@/lib/date-utils";
import type { Tables } from "@/integrations/supabase/types";

type Habit = Tables<"habits">;
type HabitCompletion = Tables<"habit_completions">;

export const UserMenu = () => {
  const { user, role, signOut, fullName: authFullName } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
          setFullName(authFullName || user.email?.split("@")[0] || "Usuario");
          return;
        }

        if (data?.full_name) {
          setFullName(data.full_name);
        } else if (authFullName) {
          setFullName(authFullName);
        } else {
          // Si no hay nombre completo, usar el email
          setFullName(user.email?.split("@")[0] || "Usuario");
        }

        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setFullName(authFullName || user.email?.split("@")[0] || "Usuario");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authFullName]);

  // Calcular racha actual
  useEffect(() => {
    const calculateStreak = async () => {
      if (!user?.id) {
        setCurrentStreak(0);
        return;
      }

      try {
        // Obtener hábitos activos
        const { data: habitsData } = await supabase
          .from("habits")
          .select("id, created_at, is_archived")
          .eq("user_id", user.id)
          .eq("is_archived", false);

        if (!habitsData || habitsData.length === 0) {
          setCurrentStreak(0);
          return;
        }

        // Obtener todas las completaciones (incluyendo campos de hábitos eliminados)
        const { data: completionsData } = await supabase
          .from("habit_completions")
          .select("habit_id, completion_date, is_completed, deleted_habit_name, deleted_habit_icon, deleted_habit_color")
          .eq("user_id", user.id)
          .eq("is_completed", true);

        if (!completionsData || completionsData.length === 0) {
          setCurrentStreak(0);
          return;
        }

        const habits = habitsData as Habit[];
        const completions = completionsData as HabitCompletion[];

        const today = getTodayInUserTimezone();
        const todayStr = getTodayForSupabase();

        // Verificar si hoy está completo
        const todayCompletions = completions.filter(
          c => c.completion_date === todayStr && c.is_completed
        );
        const activeHabits = habits.filter(h => !h.is_archived);
        const completedActiveHabitsToday = new Set(
          todayCompletions.filter(c => c.habit_id !== null).map(c => c.habit_id)
        ).size;
        const isTodayComplete = completedActiveHabitsToday >= activeHabits.length;

        // Calcular racha actual
        let streak = 0;
        const startOffset = isTodayComplete ? 0 : 1;

        for (let i = startOffset; i < 365; i++) {
          const checkDate = subDays(today, i);
          const dateStr = format(checkDate, "yyyy-MM-dd");

          // Incluir tanto hábitos activos como eliminados
          const dayCompletions = completions.filter(
            c => c.completion_date === dateStr && c.is_completed
          );

          const habitsActiveOnDate = activeHabits.filter(h => {
            if (!h.created_at) return true;
            const habitCreatedDate = parseISO(h.created_at);
            habitCreatedDate.setHours(0, 0, 0, 0);
            const checkDateOnly = parseISO(dateStr);
            checkDateOnly.setHours(0, 0, 0, 0);
            return checkDateOnly >= habitCreatedDate;
          });

          // Obtener hábitos eliminados que fueron completados en esa fecha
          const deletedHabitsOnDate = new Set<string>();
          dayCompletions.forEach(c => {
            if (!c.habit_id && (c as any).deleted_habit_name) {
              deletedHabitsOnDate.add((c as any).deleted_habit_name);
            }
          });

          // Total de hábitos que existían en esa fecha
          const totalHabitsOnDate = habitsActiveOnDate.length + deletedHabitsOnDate.size;

          if (totalHabitsOnDate === 0) break;

          // Contar completaciones: hábitos activos + eliminados
          const completedActiveHabits = new Set(dayCompletions.filter(c => c.habit_id !== null).map(c => c.habit_id)).size;
          const completedDeletedHabits = deletedHabitsOnDate.size;
          const completedHabitsCount = completedActiveHabits + completedDeletedHabits;

          if (completedHabitsCount >= totalHabitsOnDate) {
            streak++;
          } else {
            break;
          }
        }

        setCurrentStreak(streak);
      } catch (error) {
        console.error("Error calculating streak:", error);
        setCurrentStreak(0);
      }
    };

    calculateStreak();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getDisplayName = () => {
    if (fullName) {
      // Truncar si es muy largo
      if (fullName.length > 20) {
        return fullName.substring(0, 17) + "...";
      }
      return fullName;
    }
    return user?.email?.split("@")[0] || "Usuario";
  };

  if (loading || !user) {
    return null;
  }

  const getInitials = () => {
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return fullName.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-all hover:bg-background hover:text-foreground text-foreground">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} alt={fullName || "Usuario"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{getDisplayName()}</span>
          {currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">{currentStreak}</span>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {role === "admin" && (
          <>
            <DropdownMenuItem onClick={() => navigate("/admin")}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Panel Administrativo</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

