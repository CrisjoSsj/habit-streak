import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, addDays, isToday, isSameDay, subDays, parseISO, eachDayOfInterval } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Share2, Trophy, Calendar as CalendarIcon, TrendingUp, Flame, Target, Zap, Gem, Star, Sparkles, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { AchievementBadge } from "@/components/habits/AchievementBadge";
import { getHabitIcon } from "@/lib/habitIcons";
import type { Tables } from "@/integrations/supabase/types";
import { ACHIEVEMENT_DEFINITIONS, getAchievementProgress, getColorValue, getGradientStyle, LEVEL_COLORS } from "@/lib/achievements-config";
import { Progress } from "@/components/ui/progress";

type Habit = Tables<"habits">;
type HabitCompletion = Tables<"habit_completions">;
type Achievement = Tables<"achievements">;

const History = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const locale = language === "es" ? es : enUS;

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  
  // Calcular estadísticas reales
  const stats = useMemo(() => {
    if (!completions.length || !habits.length) {
      return {
    currentStreak: 0,
        bestStreak: 0,
    habitsCompletedThisWeek: 0,
        habitsCompletedToday: 0,
    completionRate: 0,
        totalCompletions: 0,
        totalHabits: habits.length,
      };
    }

    // Calcular racha actual
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(today, i);
      const dateStr = format(checkDate, "yyyy-MM-dd");
      
      // Verificar si todos los hábitos activos fueron completados ese día
      const activeHabits = habits.filter(h => !h.is_archived);
      const dayCompletions = completions.filter(
        c => c.completion_date === dateStr && c.is_completed
      );
      
      const completedHabitsCount = new Set(dayCompletions.map(c => c.habit_id)).size;
      
      if (completedHabitsCount >= activeHabits.length && activeHabits.length > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calcular mejor racha
    let bestStreak = 0;
    let tempStreak = 0;
    const sortedDates = [...new Set(completions.map(c => c.completion_date))].sort().reverse();
    
    for (const dateStr of sortedDates) {
      const activeHabits = habits.filter(h => !h.is_archived);
      const dayCompletions = completions.filter(
        c => c.completion_date === dateStr && c.is_completed
      );
      const completedHabitsCount = new Set(dayCompletions.map(c => c.habit_id)).size;
      
      if (completedHabitsCount >= activeHabits.length && activeHabits.length > 0) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Completados esta semana
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekCompletions = completions.filter(c => {
      const completionDate = parseISO(c.completion_date);
      return completionDate >= weekStart && c.is_completed;
    });
    const habitsCompletedThisWeek = new Set(weekCompletions.map(c => c.habit_id)).size;

    // Completados hoy
    const todayStr = format(today, "yyyy-MM-dd");
    const todayCompletions = completions.filter(
      c => c.completion_date === todayStr && c.is_completed
    );
    const habitsCompletedToday = new Set(todayCompletions.map(c => c.habit_id)).size;

    // Tasa de completación (últimos 30 días)
    const thirtyDaysAgo = subDays(today, 30);
    const recentCompletions = completions.filter(c => {
      const completionDate = parseISO(c.completion_date);
      return completionDate >= thirtyDaysAgo && c.is_completed;
    });
    const activeHabits = habits.filter(h => !h.is_archived);
    const totalPossible = activeHabits.length * 30;
    const completionRate = totalPossible > 0 
      ? Math.round((recentCompletions.length / totalPossible) * 100) 
      : 0;

    return {
      currentStreak,
      bestStreak,
      habitsCompletedThisWeek,
      habitsCompletedToday,
      completionRate,
      totalCompletions: completions.filter(c => c.is_completed).length,
      totalHabits: habits.length,
    };
  }, [completions, habits]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setUserId(session.user.id);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      // Fetch habits
      const { data: habitsData } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setHabits(habitsData || []);

      // Fetch all completions
      const { data: completionsData } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", userId)
        .order("completion_date", { ascending: false });
      setCompletions(completionsData || []);

      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false });
      setAchievements(achievementsData || []);
    };

    fetchData();
  }, [userId]);

  // Obtener completados de una fecha específica
  const getCompletionsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return completions.filter(c => c.completion_date === dateStr);
  };

  // Verificar si un día está completo
  const isDayComplete = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const activeHabits = habits.filter(h => !h.is_archived);
    if (activeHabits.length === 0) return false;
    
    const dayCompletions = completions.filter(
      c => c.completion_date === dateStr && c.is_completed
    );
    const completedHabitsCount = new Set(dayCompletions.map(c => c.habit_id)).size;
    
    return completedHabitsCount >= activeHabits.length;
  };

  // Calcular valores actuales para cada tipo de logro
  const currentStreak = stats?.bestStreak || 0; // Mejor racha del usuario
  
  const perfectDaysCount = useMemo(() => {
    const activeHabits = habits.filter(h => !h.is_archived);
    if (activeHabits.length === 0) return 0;
    
    const perfectDays = new Set<string>();
    const dates = new Set(completions.map(c => c.completion_date));
    
    for (const dateStr of dates) {
      const dayCompletions = completions.filter(
        c => c.completion_date === dateStr && c.is_completed
      );
      const completedHabitsCount = new Set(dayCompletions.map(c => c.habit_id)).size;
      
      if (completedHabitsCount >= activeHabits.length) {
        perfectDays.add(dateStr);
      }
    }
    
    return perfectDays.size;
  }, [completions, habits]);

  // Calcular semanas perfectas
  const perfectWeeksCount = useMemo(() => {
    const activeHabits = habits.filter(h => !h.is_archived);
    if (activeHabits.length === 0) return 0;
    
    const perfectDays = new Set<string>();
    const dates = new Set(completions.map(c => c.completion_date));
    
    for (const dateStr of dates) {
      const dayCompletions = completions.filter(
        c => c.completion_date === dateStr && c.is_completed
      );
      const completedHabitsCount = new Set(dayCompletions.map(c => c.habit_id)).size;
      
      if (completedHabitsCount >= activeHabits.length) {
        perfectDays.add(dateStr);
      }
    }
    
    // Agrupar por semana
    const weeks = new Map<string, Set<string>>();
    for (const dateStr of perfectDays) {
      const date = parseISO(dateStr);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekKey = format(weekStart, "yyyy-MM-dd");
      
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, new Set());
      }
      weeks.get(weekKey)!.add(dateStr);
    }
    
    // Contar semanas con 7 días perfectos
    let perfectWeeks = 0;
    for (const [_, days] of weeks) {
      if (days.size >= 7) {
        perfectWeeks++;
      }
    }
    
    return perfectWeeks;
  }, [completions, habits]);

  // Calcular valores adicionales para los nuevos logros
  const totalCompletions = useMemo(() => {
    return completions.filter(c => c.is_completed).length;
  }, [completions]);

  const habitsCreated = useMemo(() => {
    return habits.length;
  }, [habits]);

  const activeHabitsCount = useMemo(() => {
    return habits.filter(h => !h.is_archived).length;
  }, [habits]);

  const perfectMonthsCount = useMemo(() => {
    const activeHabits = habits.filter(h => !h.is_archived);
    if (activeHabits.length === 0) return 0;
    
    const perfectDays = new Set<string>();
    const dates = new Set(completions.map(c => c.completion_date));
    
    for (const dateStr of dates) {
      const dayCompletions = completions.filter(
        c => c.completion_date === dateStr && c.is_completed
      );
      const completedHabitsCount = new Set(dayCompletions.map(c => c.habit_id)).size;
      
      if (completedHabitsCount >= activeHabits.length) {
        perfectDays.add(dateStr);
      }
    }
    
    // Agrupar por mes
    const months = new Map<string, Set<string>>();
    for (const dateStr of perfectDays) {
      const date = parseISO(dateStr);
      const monthKey = format(date, "yyyy-MM");
      
      if (!months.has(monthKey)) {
        months.set(monthKey, new Set());
      }
      months.get(monthKey)!.add(dateStr);
    }
    
    // Contar meses con al menos 28 días perfectos (mes completo)
    let perfectMonths = 0;
    for (const [_, days] of months) {
      if (days.size >= 28) {
        perfectMonths++;
      }
    }
    
    return perfectMonths;
  }, [completions, habits]);

  const noMissStreak = useMemo(() => {
    const activeHabits = habits.filter(h => !h.is_archived);
    if (activeHabits.length === 0) return 0;
    
    // Encontrar la racha más larga sin faltar ningún día
    const dates = Array.from(new Set(completions.map(c => c.completion_date)))
      .sort()
      .reverse();
    
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      const dayCompletions = completions.filter(
        c => c.completion_date === dateStr && c.is_completed
      );
      const completedHabitsCount = new Set(dayCompletions.map(c => c.habit_id)).size;
      
      if (completedHabitsCount >= activeHabits.length) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  }, [completions, habits]);

  const timeVarietyCount = useMemo(() => {
    const timeSlots = new Set<string>();
    habits.forEach(habit => {
      if (habit.time_of_day && habit.time_of_day !== 'anytime') {
        timeSlots.add(habit.time_of_day);
      }
    });
    return timeSlots.size;
  }, [habits]);

  const weekendCompletions = useMemo(() => {
    const weekends = new Set<string>();
    completions.forEach(c => {
      if (c.is_completed) {
        const date = parseISO(c.completion_date);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Domingo o Sábado
          const weekStart = startOfWeek(date, { weekStartsOn: 1 });
          const weekKey = format(weekStart, "yyyy-MM-dd");
          weekends.add(weekKey);
        }
      }
    });
    return weekends.size;
  }, [completions]);

  const morningCompletions = useMemo(() => {
    const morningHabits = habits.filter(h => h.time_of_day === 'morning');
    if (morningHabits.length === 0) return 0;
    
    const morningDays = new Set<string>();
    completions.forEach(c => {
      if (c.is_completed && morningHabits.some(h => h.id === c.habit_id)) {
        morningDays.add(c.completion_date);
      }
    });
    return morningDays.size;
  }, [completions, habits]);

  // Crear estructura de logros con niveles y progreso
  const achievementTypesWithProgress = useMemo(() => {
    if (!achievements || achievements.length === 0) {
      return ACHIEVEMENT_DEFINITIONS.map((def) => ({
        ...def,
        currentValue: 0,
        progress: { currentLevel: null, nextLevel: def.levels[0] || null, progress: 0 },
        highestUnlockedLevel: 0,
        maxLevel: Math.max(...def.levels.map(l => l.level)),
        hasAnyLevel: false,
      }));
    }

    return ACHIEVEMENT_DEFINITIONS.map((def) => {
      let currentValue = 0;
      
      if (def.type === "first_completion") {
        currentValue = achievements.some((a) => a.achievement_type === "first_completion") ? 1 : 0;
      } else if (def.type === "streak") {
        currentValue = currentStreak || 0;
      } else if (def.type === "perfect_day") {
        currentValue = perfectDaysCount || 0;
      } else if (def.type === "perfect_week") {
        currentValue = perfectWeeksCount || 0;
      } else if (def.type === "total_completions") {
        currentValue = totalCompletions || 0;
      } else if (def.type === "habits_created") {
        currentValue = habitsCreated || 0;
      } else if (def.type === "perfect_month") {
        currentValue = perfectMonthsCount || 0;
      } else if (def.type === "no_miss_streak") {
        currentValue = noMissStreak || 0;
      } else if (def.type === "active_habits") {
        currentValue = activeHabitsCount || 0;
      } else if (def.type === "time_variety") {
        currentValue = timeVarietyCount || 0;
      } else if (def.type === "weekend_warrior") {
        currentValue = weekendCompletions || 0;
      } else if (def.type === "early_bird") {
        currentValue = morningCompletions || 0;
      }
      
      const progress = getAchievementProgress(def.type, currentValue);
      const maxLevel = Math.max(...def.levels.map(l => l.level));
      const highestUnlockedLevel = achievements
        .filter(a => a.achievement_type === def.type)
        .map(a => a.achievement_level || 0)
        .reduce((max, level) => Math.max(max, level), 0);
      
      return {
        ...def,
        currentValue,
        progress,
        highestUnlockedLevel,
        maxLevel,
        hasAnyLevel: highestUnlockedLevel > 0,
      };
    });
  }, [achievements, currentStreak, perfectDaysCount, perfectWeeksCount, totalCompletions, habitsCreated, perfectMonthsCount, noMissStreak, activeHabitsCount, timeVarietyCount, weekendCompletions, morningCompletions]);

  // Contar tipos únicos de logros desbloqueados (al menos un nivel)
  const unlockedCount = achievementTypesWithProgress.filter(a => a.hasAnyLevel).length;
  const totalAchievements = ACHIEVEMENT_DEFINITIONS.length;
  const achievementPercent = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{t("checkingSession")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <AppHeader title={t("history")} />

      <main className="container max-w-5xl mx-auto px-4 py-4">
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="calendar" className="flex-1">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {t("calendar")}
            </TabsTrigger>
            <TabsTrigger value="habits" className="flex-1">
              <Target className="mr-2 h-4 w-4" />
              {t("allHabits")}
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex-1">
              <Trophy className="mr-2 h-4 w-4" />
              {t("achievements")}
            </TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-5 w-5" />
                  <p className="text-xs font-medium opacity-90">{t("currentStreak")}</p>
                  </div>
                  <p className="text-3xl font-bold">{stats.currentStreak}</p>
                  <p className="text-xs opacity-75">{t("bestStreak")}: {stats.bestStreak}</p>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5" />
                  <p className="text-xs font-medium opacity-90">{t("habitCompleted")}</p>
                  </div>
                  <p className="text-3xl font-bold">{stats.habitsCompletedToday}</p>
                  <p className="text-xs opacity-75">{t("thisWeek")}: {stats.habitsCompletedThisWeek}</p>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5" />
                  <p className="text-xs font-medium opacity-90">{t("completionRate")}</p>
                  </div>
                  <p className="text-3xl font-bold">{stats.completionRate}%</p>
                  <p className="text-xs opacity-75">{stats.totalCompletions} {t("completed").toLowerCase()}</p>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5" />
                    <p className="text-xs font-medium opacity-90">Logros</p>
                  </div>
                  <p className="text-3xl font-bold">{unlockedCount}</p>
                  <p className="text-xs opacity-75">de {totalAchievements} total</p>
                </CardContent>
              </Card>
            </div>

            {/* Calendar con completados al lado */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t("calendar")}</CardTitle>
                <CardDescription className="text-xs">Selecciona una fecha para ver tus completados</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4">
                  {/* Calendario */}
                  <div className="flex justify-center lg:justify-start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={locale}
                  className="rounded-md"
                      modifiers={{
                        completed: (date) => isDayComplete(date),
                      }}
                      modifiersClassNames={{
                        completed: "bg-green-500 text-white rounded-full",
                      }}
                    />
                  </div>

                  {/* Completados del día seleccionado */}
                  <div className="space-y-2 border-l-0 lg:border-l lg:pl-4 lg:border-muted">
                    {selectedDate && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-base">
                            {format(selectedDate, "EEEE, d 'de' MMMM", { locale })}
                          </h3>
                          {isDayComplete(selectedDate) && (
                            <Badge className="bg-green-500 text-xs">Día completo</Badge>
                          )}
                        </div>
                        {(() => {
                          const dayCompletions = getCompletionsForDate(selectedDate);
                          if (dayCompletions.length === 0) {
                            return (
                              <p className="text-sm text-muted-foreground text-center py-6">
                                No hay completados para este día
                              </p>
                            );
                          }
                          return (
                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                              {dayCompletions
                                .filter(c => c.is_completed)
                                .map((completion) => {
                                  // Buscar hábito activo o usar información del hábito eliminado
                                  const habit = completion.habit_id 
                                    ? habits.find(h => h.id === completion.habit_id)
                                    : null;
                                  
                                  // Si no hay hábito activo, usar información del hábito eliminado
                                  const completionWithDeleted = completion as HabitCompletion & {
                                    deleted_habit_name?: string | null;
                                    deleted_habit_icon?: string | null;
                                    deleted_habit_color?: string | null;
                                  };
                                  const habitName = habit?.name || completionWithDeleted.deleted_habit_name || t("deletedHabit");
                                  const habitIcon = habit?.icon || completionWithDeleted.deleted_habit_icon || "target";
                                  const habitColor = habit?.color || completionWithDeleted.deleted_habit_color || "#3B82F6";
                                  const isDeleted = !completion.habit_id && !!completionWithDeleted.deleted_habit_name;
                                  
                                  if (!habitName) return null;
                                  
                                  const HabitIcon = getHabitIcon(habitIcon);
                                  return (
                                    <div
                                      key={completion.id}
                                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                                    >
                                      <div
                                        className="flex h-9 w-9 items-center justify-center rounded-full text-white shrink-0"
                                        style={{ backgroundColor: habitColor }}
                                      >
                                        <HabitIcon className="h-4 w-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-sm truncate">{habitName}</p>
                                          {isDeleted && (
                                            <Badge variant="outline" className="text-[10px] opacity-60 shrink-0 px-1.5 py-0">
                                              {t("deleted")}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {format(parseISO(completion.completion_date), "HH:mm", { locale })}
                                        </p>
                                      </div>
                                      {completion.is_completed && (
                                        <Badge className="bg-green-500 shrink-0 text-xs px-2 py-0.5">Completado</Badge>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          );
                        })()}
                      </>
                    )}
                    {!selectedDate && (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Selecciona una fecha para ver los completados
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Habits Tab */}
          <TabsContent value="habits" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {habits.length === 0 && completions.filter(c => !c.habit_id && (c as any).deleted_habit_name).length === 0 ? (
                <div className="col-span-2 py-8 text-center">
                <p className="text-muted-foreground">{t("noHabitsYet")}</p>
              </div>
            ) : (
                <>
                  {/* Hábitos activos */}
                {habits.map((habit) => {
                  const completionCount = completions.filter(
                    (c) => c.habit_id === habit.id && c.is_completed
                  ).length;
                    
                    const lastCompletion = completions
                      .filter(c => c.habit_id === habit.id && c.is_completed)
                      .sort((a, b) => b.completion_date.localeCompare(a.completion_date))[0];
                    
                    const HabitIcon = getHabitIcon(habit.icon);
                  
                  return (
                    <Card key={habit.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1">
                          <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
                            style={{ backgroundColor: habit.color || "#3B82F6" }}
                          >
                                <HabitIcon className="h-6 w-6" />
                          </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{habit.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {completionCount} {t("completed").toLowerCase()}
                            </p>
                                {lastCompletion && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Último: {format(parseISO(lastCompletion.completion_date), "d MMM", { locale })}
                                  </p>
                                )}
                          </div>
                        </div>
                        {habit.is_archived && (
                              <Badge variant="outline" className="text-xs">
                                {t("archived")}
                              </Badge>
                        )}
                          </div>
                      </CardContent>
                    </Card>
                  );
                })}
                  
                  {/* Hábitos eliminados (agrupados por nombre) */}
                  {(() => {
                    const deletedHabitsMap = new Map<string, { name: string; icon: string; color: string; completions: HabitCompletion[] }>();
                    
                    completions
                      .filter(c => !c.habit_id)
                      .forEach(completion => {
                        const completionWithDeleted = completion as HabitCompletion & {
                          deleted_habit_name?: string | null;
                          deleted_habit_icon?: string | null;
                          deleted_habit_color?: string | null;
                        };
                        
                        if (completionWithDeleted.deleted_habit_name) {
                          const key = completionWithDeleted.deleted_habit_name;
                          if (!deletedHabitsMap.has(key)) {
                            deletedHabitsMap.set(key, {
                              name: key,
                              icon: completionWithDeleted.deleted_habit_icon || "target",
                              color: completionWithDeleted.deleted_habit_color || "#3B82F6",
                              completions: []
                            });
                          }
                          deletedHabitsMap.get(key)!.completions.push(completion);
                        }
                      });
                    
                    return Array.from(deletedHabitsMap.values()).map((deletedHabit) => {
                      const completionCount = deletedHabit.completions.filter(c => c.is_completed).length;
                      const lastCompletion = deletedHabit.completions
                        .filter(c => c.is_completed)
                        .sort((a, b) => b.completion_date.localeCompare(a.completion_date))[0];
                      
                      const HabitIcon = getHabitIcon(deletedHabit.icon);
                      
                      return (
                        <Card key={`deleted-${deletedHabit.name}`} className="opacity-75">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div
                                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
                                  style={{ backgroundColor: deletedHabit.color }}
                                >
                                  <HabitIcon className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold truncate">{deletedHabit.name}</p>
                                    <Badge variant="outline" className="text-xs opacity-60">
                                      {t("deleted")}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {completionCount} {t("completed").toLowerCase()}
                                  </p>
                                  {lastCompletion && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Último: {format(parseISO(lastCompletion.completion_date), "d MMM", { locale })}
                                    </p>
                                  )}
                                </div>
                              </div>
              </div>
                          </CardContent>
                        </Card>
                      );
                    });
                  })()}
                </>
            )}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            {/* Summary Card */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-lg font-semibold">{t("myAchievements")}</p>
                  <p className="text-sm opacity-90">
                    Has desbloqueado {unlockedCount} de {totalAchievements} logros ({achievementPercent}%)
                  </p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/20">
                  <Trophy className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievementTypesWithProgress && achievementTypesWithProgress.length > 0 ? (
                achievementTypesWithProgress.map((achievement) => {
                const AchievementIcon = achievement.icon;
                const currentLevel = achievement.progress?.currentLevel || null;
                const nextLevel = achievement.progress?.nextLevel || null;
                const isUnlocked = achievement.hasAnyLevel || false;
                const isMaxLevel = currentLevel ? currentLevel.level === achievement.maxLevel : false;
              
                // Usar colores unificados según el nivel
                const levelColor = currentLevel 
                  ? LEVEL_COLORS[currentLevel.level]
                  : nextLevel 
                  ? LEVEL_COLORS[nextLevel.level]
                  : null;

                return (
                  <Card 
                    key={achievement.type}
                    className={isUnlocked ? "border-2" : "border"}
                    style={levelColor ? {
                      borderColor: levelColor.solid,
                      opacity: currentLevel ? 1 : 0.5
                    } : {}}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        {/* Header con icono y nivel */}
                        <div className="flex items-center gap-3">
                          <div
                            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white"
                            style={{
                              background: levelColor
                                ? levelColor.gradient
                                : undefined,
                              opacity: currentLevel ? 1 : nextLevel ? 0.5 : 1,
                              backgroundColor: !levelColor ? 'hsl(var(--muted))' : undefined,
                              color: levelColor ? 'white' : 'hsl(var(--muted-foreground))'
                            }}
                          >
                            <AchievementIcon className="h-8 w-8" />
                            {isUnlocked && (
                              <div className="absolute -top-1 -right-1">
                                <Sparkles className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${
                              isUnlocked ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              {achievement.name}
                            </p>
                            {currentLevel && (
                              <p className="text-xs text-muted-foreground">
                                Nivel {currentLevel.level}: {currentLevel.label}
                              </p>
                            )}
                            {!currentLevel && nextLevel && (
                              <p className="text-xs text-muted-foreground">
                                Siguiente: {nextLevel.label}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Descripción */}
                        <p className="text-xs text-muted-foreground">
                          {achievement.description}
                        </p>
                        
                        {/* Barra de progreso - Solo mostrar una vez */}
                        {isMaxLevel ? (
                          <Badge className="w-fit mx-auto bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                            Máximo nivel alcanzado
                          </Badge>
                        ) : nextLevel && achievement.progress ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {achievement.currentValue || 0} / {nextLevel.requirement}
                              </span>
                              <span className="text-muted-foreground">
                                {Math.round(achievement.progress.progress || 0)}%
                              </span>
                            </div>
                            <Progress value={Math.min(100, Math.max(0, achievement.progress.progress || 0))} className="h-2" />
                            <p className="text-xs text-muted-foreground text-center">
                              {Math.max(0, nextLevel.requirement - (achievement.currentValue || 0))} más para {nextLevel.label}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <p>Cargando logros...</p>
                </div>
              )}
            </div>

            {/* Logros recientes */}
            {achievements.length > 0 && (
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Logros Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-2">
                    {achievements.slice(0, 5).map((achievement) => {
                      const achievementInfo = ACHIEVEMENT_DEFINITIONS.find(a => a.type === achievement.achievement_type);
                      const AchievementIcon = achievementInfo?.icon || Trophy;
                      const levelInfo = achievementInfo?.levels.find(l => l.level === achievement.achievement_level);
                      const displayLabel = levelInfo?.label || achievementInfo?.name || achievement.achievement_type;
                      return (
                        <div
                          key={achievement.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <AchievementIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{displayLabel}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(achievement.unlocked_at), "d 'de' MMMM, yyyy", { locale })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default History;
