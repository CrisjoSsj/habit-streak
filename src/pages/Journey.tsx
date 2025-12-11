import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfWeek, eachDayOfInterval, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { getTodayInUserTimezone, getTodayForSupabase } from "@/lib/date-utils";
import { Trophy, Flame, Target, TrendingUp, Calendar as CalendarIcon, Award, Star, Zap, Gem, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { getHabitIcon } from "@/lib/habitIcons";
import type { Tables } from "@/integrations/supabase/types";

type Habit = Tables<"habits">;
type HabitCompletion = Tables<"habit_completions">;
type Achievement = Tables<"achievements">;

const Journey = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const locale = language === "es" ? es : enUS;

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

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

  // Calcular estadísticas del viaje
  const journeyStats = useMemo(() => {
    if (!completions.length || !habits.length) {
      return {
        totalDays: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        completionRate: 0,
        achievementsUnlocked: achievements.length,
      };
    }

    const today = getTodayInUserTimezone();
    const todayStr = getTodayForSupabase();
    
    // Obtener hábitos activos una sola vez
    const activeHabits = habits.filter(h => !h.is_archived);
    if (activeHabits.length === 0) {
      return {
        totalDays: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        completionRate: 0,
        achievementsUnlocked: achievements.length,
      };
    }
    
    // Verificar si hoy está completo
    const todayCompletions = completions.filter(
      c => c.completion_date === todayStr && c.is_completed
    );
    const completedActiveHabitsToday = new Set(todayCompletions.filter(c => c.habit_id !== null).map(c => c.habit_id)).size;
    const isTodayComplete = completedActiveHabitsToday >= activeHabits.length;
    
    // Calcular racha actual
    // Si hoy está completo, empezar desde hoy, si no, desde ayer
    let currentStreak = 0;
    const startOffset = isTodayComplete ? 0 : 1;
    
    for (let i = startOffset; i < 365; i++) {
      const checkDate = subDays(today, i);
      const dateStr = format(checkDate, "yyyy-MM-dd");
      
      // Verificar si todos los hábitos activos fueron completados ese día
      // Incluir tanto hábitos activos como eliminados
      const dayCompletions = completions.filter(
        c => c.completion_date === dateStr && c.is_completed
      );
      
      // Obtener los hábitos activos que existían en esa fecha
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
      
      // Total de hábitos que existían en esa fecha (activos + eliminados completados ese día)
      const totalHabitsOnDate = habitsActiveOnDate.length + deletedHabitsOnDate.size;
      
      if (totalHabitsOnDate === 0) break;
      
      // Contar completaciones: hábitos activos completados + hábitos eliminados completados
      const completedActiveHabits = new Set(dayCompletions.filter(c => c.habit_id !== null).map(c => c.habit_id)).size;
      const completedDeletedHabits = deletedHabitsOnDate.size;
      const completedHabitsCount = completedActiveHabits + completedDeletedHabits;
      
      // Verificar que todos los hábitos que existían en esa fecha fueron completados
      if (completedHabitsCount >= totalHabitsOnDate) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calcular mejor racha
    let bestStreak = 0;
    let tempStreak = 0;
    
    // Obtener todas las fechas únicas desde la fecha más antigua hasta hoy
    const allDates = new Set<string>();
    const todayDate = parseISO(todayStr);
    
    // Agregar todas las fechas desde hoy hasta 365 días atrás
    for (let i = 0; i < 365; i++) {
      const date = subDays(todayDate, i);
      allDates.add(format(date, "yyyy-MM-dd"));
    }
    
    // Ordenar fechas de más reciente a más antigua
    const sortedDates = Array.from(allDates).sort().reverse();
    
    for (const dateStr of sortedDates) {
      const dayCompletions = completions.filter(
        c => c.completion_date === dateStr && c.is_completed
      );
      
      // Obtener los hábitos activos que existían en esa fecha
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
      
      if (totalHabitsOnDate === 0) {
        tempStreak = 0;
        continue;
      }
      
      // Contar completaciones: hábitos activos + eliminados
      const completedActiveHabits = new Set(dayCompletions.filter(c => c.habit_id !== null).map(c => c.habit_id)).size;
      const completedDeletedHabits = deletedHabitsOnDate.size;
      const completedHabitsCount = completedActiveHabits + completedDeletedHabits;
      
      if (completedHabitsCount >= totalHabitsOnDate) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Días totales activos
    const uniqueDays = new Set(completions.map(c => c.completion_date)).size;
    
    // Tasa de completación (últimos 30 días) - incluyendo hábitos eliminados
    const thirtyDaysAgo = subDays(today, 30);
    const thirtyDaysAgoStr = format(thirtyDaysAgo, "yyyy-MM-dd");
    const recentCompletions = completions.filter(c => {
      return c.completion_date >= thirtyDaysAgoStr && c.is_completed;
    });
    const totalPossible = activeHabits.length * 30;
    const completionRate = totalPossible > 0 
      ? Math.round((recentCompletions.length / totalPossible) * 100) 
      : 0;

    return {
      totalDays: uniqueDays,
      currentStreak,
      bestStreak,
      totalCompletions: completions.filter(c => c.is_completed).length,
      completionRate,
      achievementsUnlocked: achievements.length,
    };
  }, [completions, habits, achievements]);

  // Obtener últimos 30 días de actividad organizados en semanas
  const last30Days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Obtener el lunes de la semana que contiene el día más antiguo (hace 29 días)
    const oldestDay = subDays(today, 29);
    const startOfOldestWeek = startOfWeek(oldestDay, { weekStartsOn: 1 });
    
    // Obtener el domingo de la semana actual
    const endOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    endOfCurrentWeek.setDate(endOfCurrentWeek.getDate() + 6);
    
    // Obtener todos los días desde el lunes más antiguo hasta el domingo actual
    const days = eachDayOfInterval({
      start: startOfOldestWeek,
      end: endOfCurrentWeek,
    });

    // Mapear cada día con su información de completación
    const daysWithData = days.map(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const activeHabits = habits.filter(h => !h.is_archived);
      const dayCompletions = completions.filter(
        c => c.completion_date === dateStr && c.is_completed
      );
      // Contar hábitos activos completados
      const completedActiveHabits = new Set(
        dayCompletions.filter(c => c.habit_id !== null).map(c => c.habit_id)
      ).size;
      // Contar hábitos eliminados completados ese día
      const deletedHabitsOnDate = new Set(
        dayCompletions
          .filter(c => !c.habit_id && (c as any).deleted_habit_name)
          .map(c => (c as any).deleted_habit_name)
      );
      const completedHabitsCount = completedActiveHabits + deletedHabitsOnDate.size;
      
      // Para determinar si está completo, considerar hábitos activos actuales + eliminados completados ese día
      const totalHabitsOnDate = activeHabits.length + deletedHabitsOnDate.size;
      const isComplete = totalHabitsOnDate > 0 && completedHabitsCount >= totalHabitsOnDate;
      
      return {
        date: day,
        dateStr,
        completed: completedHabitsCount,
        total: totalHabitsOnDate || activeHabits.length,
        isComplete,
        dayOfWeek: format(day, "EEE", { locale }),
      };
    });

    // Organizar en semanas (filas de 7 días)
    const weeks: typeof daysWithData[] = [];
    for (let i = 0; i < daysWithData.length; i += 7) {
      weeks.push(daysWithData.slice(i, i + 7));
    }

    return weeks;
  }, [completions, habits, locale]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{t("checkingSession")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <AppHeader title={t("navJourney")} />

      <main className="container max-w-5xl mx-auto px-4 py-4 space-y-6">
        {/* Hero Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5" />
                <p className="text-xs font-medium opacity-90">Racha Actual</p>
              </div>
              <p className="text-3xl font-bold">{journeyStats.currentStreak}</p>
              <p className="text-xs opacity-75">días consecutivos</p>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5" />
                <p className="text-xs font-medium opacity-90">Mejor Racha</p>
              </div>
              <p className="text-3xl font-bold">{journeyStats.bestStreak}</p>
              <p className="text-xs opacity-75">días récord</p>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" />
                <p className="text-xs font-medium opacity-90">Completados</p>
              </div>
              <p className="text-3xl font-bold">{journeyStats.totalCompletions}</p>
              <p className="text-xs opacity-75">en total</p>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5" />
                <p className="text-xs font-medium opacity-90">Logros</p>
              </div>
              <p className="text-3xl font-bold">{journeyStats.achievementsUnlocked}</p>
              <p className="text-xs opacity-75">desbloqueados</p>
            </CardContent>
          </Card>
        </div>

        {/* Layout de dos columnas: Calendario a la izquierda, otras secciones a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Calendario de actividad */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Actividad de los últimos 30 días
                </CardTitle>
                <CardDescription>
                  Tu progreso día a día en tu viaje hacia mejores hábitos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Encabezados de días de la semana */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {["L", "M", "X", "J", "V", "S", "D"].map((day, index) => (
                    <div key={index} className="text-center">
                      <span className="text-[9px] font-medium text-muted-foreground">{day}</span>
                    </div>
                  ))}
                </div>
                
                {/* Calendario organizado en semanas */}
                <div className="space-y-0.5">
                  {last30Days.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-0.5">
                      {week.map((day) => (
                        <div
                          key={day.dateStr}
                          className="flex flex-col items-center"
                          title={`${format(day.date, "d 'de' MMMM", { locale })}: ${day.completed}/${day.total} completados`}
                        >
                          <div
                            className={`w-full aspect-square rounded flex items-center justify-center text-[9px] font-medium transition-all hover:scale-110 cursor-pointer ${
                              day.isComplete
                                ? "bg-green-500 text-white"
                                : day.completed > 0
                                ? "bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {format(day.date, "d")}
                          </div>
                        </div>
                      ))}
                      {/* Rellenar días faltantes en la última semana */}
                      {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-center gap-2 text-[9px] text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-green-500"></div>
                    <span>Día completo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-green-200 dark:bg-green-900"></div>
                    <span>Parcial</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-muted"></div>
                    <span>Sin actividad</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha: Progreso por hábito, Logros recientes y Resumen */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progreso por hábito */}
            <Card>
              <CardHeader>
                <CardTitle>Progreso por Hábito</CardTitle>
                <CardDescription>
                  Ve cómo vas con cada uno de tus hábitos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {habits.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aún no tienes hábitos creados
                  </p>
                ) : (
                  habits
                    .filter(h => !h.is_archived)
                    .map((habit) => {
                      const habitCompletions = completions.filter(
                        c => c.habit_id === habit.id && c.is_completed
                      ).length;
                      const totalDays = Math.max(
                        Math.ceil((new Date().getTime() - new Date(habit.created_at).getTime()) / (1000 * 60 * 60 * 24)),
                        1
                      );
                      const progressPercent = Math.min((habitCompletions / totalDays) * 100, 100);
                      
                      const HabitIcon = getHabitIcon(habit.icon);
                      
                      return (
                        <div key={habit.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                                style={{ backgroundColor: habit.color || "#3B82F6" }}
                              >
                                <HabitIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">{habit.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {habitCompletions} completados de {totalDays} días
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {Math.round(progressPercent)}%
                            </Badge>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      );
                    })
                )}
              </CardContent>
            </Card>

            {/* Resumen de estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Resumen del Viaje
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        <p className="text-xs font-medium text-muted-foreground">Días activos</p>
                      </div>
                      <p className="text-2xl font-bold">{journeyStats.totalDays}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <p className="text-xs font-medium text-muted-foreground">Tasa de completación</p>
                      </div>
                      <p className="text-2xl font-bold">{journeyStats.completionRate}%</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 justify-center p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    <p className="text-sm text-muted-foreground text-center">
                      Sigue así, estás haciendo un gran trabajo construyendo hábitos duraderos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Journey;

