import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, addDays, isToday, isSameDay, startOfMonth, startOfYear, parseISO, getDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { WeekCalendar } from "@/components/habits/WeekCalendar";
import { TimeFilter } from "@/components/habits/TimeFilter";
import { HabitCard } from "@/components/habits/HabitCard";
import { HabitFormDialog } from "@/components/habits/HabitFormDialog";
import { CompletionModal } from "@/components/habits/CompletionModal";
import { getHabitIcon } from "@/lib/habitIcons";
import { hexToRgba } from "@/lib/utils";
import { getTodayForSupabase, isTodayInUserTimezone, parseDateFromSupabase, getTodayInUserTimezone } from "@/lib/date-utils";
import type { Tables } from "@/integrations/supabase/types";

type Habit = Tables<"habits">;
type HabitCompletion = Tables<"habit_completions">;
type TimeOfDayFilter = "all" | "morning" | "afternoon" | "night";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const locale = language === "es" ? es : enUS;

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayInUserTimezone());
  const [timeFilter, setTimeFilter] = useState<TimeOfDayFilter>("all");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [timerStates, setTimerStates] = useState<Record<string, { running: boolean; elapsed: number }>>({});
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Auth check
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth", { replace: true });
      else setUserId(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch habits
  useEffect(() => {
    if (!userId) return;
    const fetchHabits = async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .eq("is_archived", false)
        .order("created_at", { ascending: true });

      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }
      setHabits(data || []);
    };
    fetchHabits();
  }, [userId, toast]);

  // Fetch completions - necesitamos todas las completiones para calcular el progreso del período
  useEffect(() => {
    if (!userId) return;
    const fetchCompletions = async () => {
      // Obtener todas las completiones del usuario (necesarias para calcular progreso semanal/mensual/anual)
      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", userId)
        .order("completion_date", { ascending: false });

      if (error) {
        console.error("Error fetching completions:", error);
        return;
      }
      setCompletions(data || []);
    };
    fetchCompletions();
  }, [userId]);

  // Timer interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerStates((prev) => {
        let hasRunning = false;
        const next: typeof prev = {};
        for (const [id, state] of Object.entries(prev)) {
          if (state.running) {
            hasRunning = true;
            next[id] = { ...state, elapsed: state.elapsed + 1 };
          } else {
            next[id] = state;
          }
        }
        return hasRunning ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if all habits completed (solo una vez por día)
  useEffect(() => {
    if (habits.length === 0) return;
    
    const allCompleted = habits.every((habit) => {
      const completion = completions.find((c) => c.habit_id === habit.id);
      return completion?.is_completed;
    });
    
    if (allCompleted && habits.length > 0) {
      // Verificar si ya se mostró el modal hoy
      const today = format(selectedDate, "yyyy-MM-dd");
      const lastShownDate = localStorage.getItem("completionModalLastShown");
      
      // Solo mostrar si no se ha mostrado hoy
      if (lastShownDate !== today) {
      setShowCompletionModal(true);
        // Guardar la fecha actual para no mostrar de nuevo hoy
        localStorage.setItem("completionModalLastShown", today);
      }
    }
  }, [completions, habits, selectedDate]);

  const getCompletion = (habitId: string): HabitCompletion | undefined => {
    // Buscar completión para el día seleccionado
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return completions.find(
      (c) => c.habit_id === habitId && c.completion_date === dateStr
    );
  };

  // Calcular progreso del período actual para hábitos con repetición x_per_week/month/year
  const getPeriodProgress = (habit: Habit): { current: number; goal: number; periodLabel: string } | null => {
    if (!habit.repeat_type || !habit.repeat_count) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let periodStart: Date;
    let periodLabel: string;
    
    if (habit.repeat_type === "x_per_week") {
      periodStart = startOfWeek(today, { weekStartsOn: 1 });
      periodLabel = t("progressThisWeek");
    } else if (habit.repeat_type === "x_per_month") {
      periodStart = startOfMonth(today);
      periodLabel = t("progressThisMonth");
    } else if (habit.repeat_type === "x_per_year") {
      periodStart = startOfYear(today);
      periodLabel = t("progressThisYear");
    } else {
      return null;
    }
    
    // Contar completados en el período actual
    const periodCompletions = completions.filter(c => {
      if (c.habit_id !== habit.id || !c.is_completed) return false;
      const completionDate = parseISO(c.completion_date);
      return completionDate >= periodStart && completionDate <= today;
    });
    
    return {
      current: periodCompletions.length,
      goal: habit.repeat_count,
      periodLabel,
    };
  };

  const upsertCompletion = async (
    habitId: string,
    updates: Partial<HabitCompletion>
  ) => {
    if (!userId) return;
    
    // Solo permitir check-in en el día actual (en la zona horaria del usuario)
    const todayStr = getTodayForSupabase();
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    
    if (!isTodayInUserTimezone(selectedDate)) {
      toast({
        variant: "destructive",
        title: t("onlyTodayCheckIn"),
        description: t("selectToday"),
      });
      return;
    }
    
    const dateStr = todayStr; // Usar la fecha de hoy en formato Supabase
    
    // Buscar completión existente para esta fecha (no solo del día seleccionado)
    const existing = completions.find(
      (c) => c.habit_id === habitId && c.completion_date === dateStr
    );

    if (existing) {
      const { error } = await supabase
        .from("habit_completions")
        .update(updates)
        .eq("id", existing.id);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }
      // Actualizar el estado local correctamente
      setCompletions((prev) =>
        prev.map((c) => (c.id === existing.id ? { ...c, ...updates } : c))
      );
    } else {
      const { data, error } = await supabase
        .from("habit_completions")
        .insert({
          habit_id: habitId,
          user_id: userId,
          completion_date: dateStr,
          ...updates,
        })
        .select()
        .single();
      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }
      if (data) {
        // Agregar la nueva completión al estado
        setCompletions((prev) => {
          // Verificar si ya existe una completión para esta fecha/hábito
          const exists = prev.some(
            (c) => c.habit_id === habitId && c.completion_date === dateStr
          );
          if (exists) {
            // Si existe, actualizarla
            return prev.map((c) =>
              c.habit_id === habitId && c.completion_date === dateStr
                ? { ...c, ...data }
                : c
            );
          }
          // Si no existe, agregarla
          return [...prev, data];
        });
      }
    }
  };

  const handleToggleComplete = async (habit: Habit) => {
    const completion = getCompletion(habit.id);
    const isCompleted = !completion?.is_completed;
    
    // Stop timer if running
    if (habit.habit_type === "timer" && timerStates[habit.id]?.running) {
      setTimerStates((prev) => ({
        ...prev,
        [habit.id]: { ...prev[habit.id], running: false },
      }));
    }

    await upsertCompletion(habit.id, {
      is_completed: isCompleted,
      timer_seconds: timerStates[habit.id]?.elapsed || completion?.timer_seconds || 0,
    });
  };

  const handleAddProgress = async (habit: Habit, amount: number) => {
    const completion = getCompletion(habit.id);
    const currentProgress = completion?.count_progress || 0;
    const newProgress = Math.min(currentProgress + amount, habit.goal_count || 1);
    const isCompleted = newProgress >= (habit.goal_count || 1);

    await upsertCompletion(habit.id, {
      count_progress: newProgress,
      is_completed: isCompleted,
    });
  };

  const handleToggleTimer = (habitId: string) => {
    setTimerStates((prev) => {
      const current = prev[habitId] || { running: false, elapsed: 0 };
      return { ...prev, [habitId]: { ...current, running: !current.running } };
    });
  };

  const handleResetTimer = (habitId: string) => {
    setTimerStates((prev) => ({
      ...prev,
      [habitId]: { running: false, elapsed: 0 },
    }));
  };

  const handleRestDay = async (habitId: string) => {
    await upsertCompletion(habitId, { is_rest_day: true, is_completed: true });
    toast({ title: t("restDay"), description: "Hábito marcado como día de descanso." });
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowHabitForm(true);
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!userId) return;

    // Primero, obtener la información del hábito antes de eliminarlo
    const habitToDelete = habits.find((h) => h.id === habitId);
    
    if (!habitToDelete) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se encontró el hábito",
      });
      return;
    }

    // Obtener la fecha de hoy para comparar
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = format(today, "yyyy-MM-dd");

    // Obtener todos los completions de este hábito
    const { data: habitCompletions, error: fetchError } = await supabase
      .from("habit_completions")
      .select("*")
      .eq("habit_id", habitId)
      .eq("user_id", userId);

    if (fetchError) {
      console.error("Error obteniendo completions:", fetchError);
    }

    if (habitCompletions && habitCompletions.length > 0) {
      // Separar completions del día actual y de días anteriores
      const todayCompletions = habitCompletions.filter(
        (c) => c.completion_date === todayStr
      );
      const pastCompletions = habitCompletions.filter(
        (c) => c.completion_date !== todayStr
      );

      // Eliminar los completions del día actual (no se guardan en el historial)
      if (todayCompletions.length > 0) {
        const { error: deleteTodayError } = await supabase
          .from("habit_completions")
          .delete()
          .eq("habit_id", habitId)
          .eq("user_id", userId)
          .eq("completion_date", todayStr);

        if (deleteTodayError) {
          console.error("Error eliminando completions de hoy:", deleteTodayError);
        }
      }

      // Actualizar solo los completions de días anteriores para guardar la información del hábito eliminado
      if (pastCompletions.length > 0) {
        const { error: updateError } = await supabase
          .from("habit_completions")
          .update({
            deleted_habit_name: habitToDelete.name,
            deleted_habit_icon: habitToDelete.icon,
            deleted_habit_color: habitToDelete.color,
          })
          .eq("habit_id", habitId)
          .eq("user_id", userId)
          .neq("completion_date", todayStr); // Solo actualizar los que NO son de hoy

        if (updateError) {
          console.error("Error actualizando completions:", updateError);
        }
      }
    }

    // Ahora eliminar el hábito (los completions de días anteriores se mantendrán con habit_id = NULL)
    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", habitId)
      .eq("user_id", userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el hábito",
      });
      return;
    }

    // Eliminar solo el hábito de los estados locales
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    
    // Actualizar los completions locales:
    // - Eliminar los del día actual
    // - Actualizar los de días anteriores con la información del hábito eliminado
    setCompletions((prev) => {
      return prev
        .filter((c) => !(c.habit_id === habitId && c.completion_date === todayStr)) // Eliminar del día actual
        .map((c) =>
          c.habit_id === habitId && c.completion_date !== todayStr
            ? {
                ...c,
                habit_id: null,
                deleted_habit_name: habitToDelete.name,
                deleted_habit_icon: habitToDelete.icon,
                deleted_habit_color: habitToDelete.color,
              }
            : c
        );
    });
    
    // Limpiar timer state si existe
    setTimerStates((prev) => {
      const newState = { ...prev };
      delete newState[habitId];
      return newState;
    });

    toast({
      title: t("habitDeleted"),
      description: t("habitDeletedDesc"),
    });
  };

  const handleSaveHabit = async (formData: any) => {
    if (!userId) return;

    const habitData = {
      user_id: userId,
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      habit_type: formData.habitType,
      goal_count: formData.goalCount,
      goal_minutes: formData.goalMinutes,
      time_of_day: formData.timeOfDay,
      repeat_type: formData.repeatType,
      repeat_days: formData.repeatDays,
      repeat_count: formData.repeatCount,
      reminder_enabled: formData.reminderEnabled,
      reminder_time: formData.reminderTime,
      incentive_text: formData.incentiveText,
      end_type: formData.endType,
      end_date: formData.endDate ? format(formData.endDate, "yyyy-MM-dd") : null,
      end_days: formData.endDays,
    };

    if (editingHabit) {
      const { error } = await supabase
        .from("habits")
        .update(habitData)
        .eq("id", editingHabit.id);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }
      setHabits((prev) =>
        prev.map((h) => (h.id === editingHabit.id ? { ...h, ...habitData } : h))
      );
      toast({ title: "Hábito actualizado" });
    } else {
      const { data, error } = await supabase
        .from("habits")
        .insert(habitData)
        .select()
        .single();
      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }
      if (data) setHabits((prev) => [...prev, data]);
      toast({ title: "Hábito creado" });
    }

    setEditingHabit(null);
    setShowHabitForm(false);
  };

  // Función para verificar si un hábito debe aparecer en el día seleccionado
  const shouldShowHabitOnDate = (habit: Habit, date: Date): boolean => {
    // Verificar que la fecha seleccionada sea igual o posterior a la fecha de creación del hábito
    if (habit.created_at) {
      const habitCreatedDate = parseISO(habit.created_at);
      habitCreatedDate.setHours(0, 0, 0, 0);
      // Asegurar que la fecha seleccionada use la zona horaria local
      const selectedDate = parseDateFromSupabase(format(date, "yyyy-MM-dd"));
      selectedDate.setHours(0, 0, 0, 0);
      
      // Si la fecha seleccionada es anterior a la creación del hábito, no mostrar
      if (selectedDate < habitCreatedDate) {
        return false;
      }
    }
    
    // Si no tiene configuración de repetición, mostrar siempre (siempre que sea después de la fecha de creación)
    if (!habit.repeat_type) return true;
    
    // Mapeo de días de la semana: date-fns usa 0=domingo, 1=lunes, etc.
    // Nuestro sistema usa: sun, mon, tue, wed, thu, fri, sat
    const dayOfWeekMap: Record<number, string> = {
      0: "sun", // Domingo
      1: "mon", // Lunes
      2: "tue", // Martes
      3: "wed", // Miércoles
      4: "thu", // Jueves
      5: "fri", // Viernes
      6: "sat", // Sábado
    };
    
    const dayOfWeek = getDay(date);
    const dayCode = dayOfWeekMap[dayOfWeek];
    
    // Si es diario, mostrar siempre
    if (habit.repeat_type === "daily") {
      return true;
    }
    
    // Si son días específicos, verificar si el día está en la lista
    if (habit.repeat_type === "specific_days") {
      if (!habit.repeat_days || habit.repeat_days.length === 0) {
        return true; // Si no hay días configurados, mostrar siempre (fallback)
      }
      return habit.repeat_days.includes(dayCode);
    }
    
    // Para x_per_week: verificar si ya se completaron los días requeridos esta semana
    if (habit.repeat_type === "x_per_week") {
      if (!habit.repeat_count) return true;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const dateStr = format(date, "yyyy-MM-dd");
      const selectedDateParsed = parseISO(dateStr);
      
      // Contar completados esta semana
      const weekCompletions = completions.filter(c => {
        if (c.habit_id !== habit.id || !c.is_completed) return false;
        const completionDate = parseISO(c.completion_date);
        return completionDate >= weekStart && completionDate <= today;
      });
      
      // Si ya se completaron todos los días requeridos
      if (weekCompletions.length >= habit.repeat_count) {
        // Solo mostrar si el día seleccionado tiene un check-in completado (para ver constancia)
        const dayCompletion = completions.find(
          c => c.habit_id === habit.id && c.completion_date === dateStr && c.is_completed
        );
        return !!dayCompletion; // Mostrar solo si hay check-in en ese día
      }
      
      return true;
    }
    
    // Para x_per_month: verificar si ya se completaron los días requeridos este mes
    if (habit.repeat_type === "x_per_month") {
      if (!habit.repeat_count) return true;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStart = startOfMonth(today);
      const dateStr = format(date, "yyyy-MM-dd");
      
      // Contar completados este mes
      const monthCompletions = completions.filter(c => {
        if (c.habit_id !== habit.id || !c.is_completed) return false;
        const completionDate = parseISO(c.completion_date);
        return completionDate >= monthStart && completionDate <= today;
      });
      
      // Si ya se completaron todos los días requeridos
      if (monthCompletions.length >= habit.repeat_count) {
        // Solo mostrar si el día seleccionado tiene un check-in completado (para ver constancia)
        const dayCompletion = completions.find(
          c => c.habit_id === habit.id && c.completion_date === dateStr && c.is_completed
        );
        return !!dayCompletion; // Mostrar solo si hay check-in en ese día
      }
      
      return true;
    }
    
    // Para x_per_year: verificar si ya se completaron los días requeridos este año
    if (habit.repeat_type === "x_per_year") {
      if (!habit.repeat_count) return true;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yearStart = startOfYear(today);
      const dateStr = format(date, "yyyy-MM-dd");
      
      // Contar completados este año
      const yearCompletions = completions.filter(c => {
        if (c.habit_id !== habit.id || !c.is_completed) return false;
        const completionDate = parseISO(c.completion_date);
        return completionDate >= yearStart && completionDate <= today;
      });
      
      // Si ya se completaron todos los días requeridos
      if (yearCompletions.length >= habit.repeat_count) {
        // Solo mostrar si el día seleccionado tiene un check-in completado (para ver constancia)
        const dayCompletion = completions.find(
          c => c.habit_id === habit.id && c.completion_date === dateStr && c.is_completed
        );
        return !!dayCompletion; // Mostrar solo si hay check-in en ese día
      }
      
      return true;
    }
    
    // Por defecto, mostrar siempre
    return true;
  };

  // Función para obtener hábitos completados del período (semana/mes/año)
  const getCompletedPeriodHabits = (): Habit[] => {
    return habits.filter((habit) => {
      if (!habit.repeat_type || !habit.repeat_count) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let periodStart: Date;
      
      if (habit.repeat_type === "x_per_week") {
        periodStart = startOfWeek(today, { weekStartsOn: 1 });
      } else if (habit.repeat_type === "x_per_month") {
        periodStart = startOfMonth(today);
      } else if (habit.repeat_type === "x_per_year") {
        periodStart = startOfYear(today);
      } else {
        return false;
      }
      
      // Contar completados en el período
      const periodCompletions = completions.filter(c => {
        if (c.habit_id !== habit.id || !c.is_completed) return false;
        const completionDate = parseISO(c.completion_date);
        return completionDate >= periodStart && completionDate <= today;
      });
      
      // Retornar solo si ya se completaron todos los días requeridos
      return periodCompletions.length >= habit.repeat_count;
    });
  };

  // Obtener hábitos completados del período
  const completedPeriodHabits = getCompletedPeriodHabits();
  
  // Verificar si el día seleccionado tiene check-in para hábitos completados
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  
  // Filter habits by time of day and repeat days
  const filteredHabits = habits.filter((habit) => {
    // Verificar si el hábito completó su objetivo del período
    const isCompletedPeriod = completedPeriodHabits.some(h => h.id === habit.id);
    
    if (isCompletedPeriod) {
      // Si completó el objetivo, solo mostrar si el día seleccionado tiene check-in
      const dayCompletion = completions.find(
        c => c.habit_id === habit.id && c.completion_date === selectedDateStr && c.is_completed
      );
      if (!dayCompletion) {
        return false; // No mostrar en días sin check-in
      }
    }
    
    // Filtrar por día de la semana configurado
    if (!shouldShowHabitOnDate(habit, selectedDate)) {
      return false;
    }
    
    // Filtrar por hora del día
    if (timeFilter === "all") return true;
    if (habit.time_of_day === "anytime") return true;
    return habit.time_of_day === timeFilter;
  });
  
  // Filtrar hábitos completados que NO tienen check-in en el día seleccionado
  // (estos aparecerán en la sección de "completados")
  const filteredCompletedHabits = completedPeriodHabits.filter((habit) => {
    // Solo mostrar en la sección de completados si el día seleccionado NO tiene check-in
    const dayCompletion = completions.find(
      c => c.habit_id === habit.id && c.completion_date === selectedDateStr && c.is_completed
    );
    if (dayCompletion) {
      return false; // Si tiene check-in, ya aparece en la lista normal
    }
    
    // Filtrar por hora del día
    if (timeFilter === "all") return true;
    if (habit.time_of_day === "anytime") return true;
    return habit.time_of_day === timeFilter;
  });

  // Group habits by time of day
  const groupedHabits = {
    anytime: filteredHabits.filter((h) => h.time_of_day === "anytime"),
    morning: filteredHabits.filter((h) => h.time_of_day === "morning"),
    afternoon: filteredHabits.filter((h) => h.time_of_day === "afternoon"),
    night: filteredHabits.filter((h) => h.time_of_day === "night"),
  };
  
  // Group completed habits by time of day
  const groupedCompletedHabits = {
    anytime: filteredCompletedHabits.filter((h) => h.time_of_day === "anytime"),
    morning: filteredCompletedHabits.filter((h) => h.time_of_day === "morning"),
    afternoon: filteredCompletedHabits.filter((h) => h.time_of_day === "afternoon"),
    night: filteredCompletedHabits.filter((h) => h.time_of_day === "night"),
  };


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{t("checkingSession")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <AppHeader 
        title={t("today")}
        date={selectedDate}
        showAddButton={true}
        onAdd={() => {
              setEditingHabit(null);
              setShowHabitForm(true);
            }}
      />

      <main className="container max-w-5xl mx-auto px-4 py-4">
        {/* Top Section: Calendar and Filters */}
        <div className="mb-6 space-y-4">
        {/* Week Calendar */}
        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          completions={completions}
          habits={habits}
        />

        {/* Time Filter */}
        <TimeFilter selected={timeFilter} onSelect={setTimeFilter} />
        </div>

        {/* Habit Lists by Time of Day */}
        {filteredHabits.length === 0 && filteredCompletedHabits.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">{t("noHabitsYet")}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowHabitForm(true)}
            >
              {t("createNewHabit")}
            </Button>
          </div>
        ) : (
          <>
          <div className="space-y-6">
            {/* Layout mejorado para pantallas horizontales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(groupedHabits).map(([timeOfDay, habitList]) => {
              if (habitList.length === 0) return null;
              const label = timeOfDay === "anytime" ? t("anyMoment") : t(timeOfDay as any);
              
              return (
                <div key={timeOfDay} className="space-y-3">
                  <h2 className="text-xs font-semibold uppercase text-muted-foreground">
                    {label}
                  </h2>
                  {habitList.map((habit) => {
                    const completion = getCompletion(habit.id);
                    const timerState = timerStates[habit.id] || { running: false, elapsed: 0 };
                    const isTodayDate = isToday(selectedDate);
                    const periodProgress = getPeriodProgress(habit);
                    
                    return (
                      <HabitCard
                        key={habit.id}
                        id={habit.id}
                        name={habit.name}
                        icon={habit.icon || "smile"}
                        color={habit.color || "#3B82F6"}
                        habitType={habit.habit_type as "check" | "count" | "timer"}
                        goalCount={habit.goal_count || 1}
                        goalMinutes={habit.goal_minutes || 10}
                        currentProgress={completion?.count_progress || 0}
                        timerSeconds={timerState.elapsed || completion?.timer_seconds || 0}
                        isTimerRunning={timerState.running}
                        isCompleted={completion?.is_completed || false}
                        onToggleComplete={() => handleToggleComplete(habit)}
                        onAddProgress={(amount) => handleAddProgress(habit, amount)}
                        onToggleTimer={() => handleToggleTimer(habit.id)}
                        onResetTimer={() => handleResetTimer(habit.id)}
                        onRestDay={() => handleRestDay(habit.id)}
                        onEdit={() => handleEditHabit(habit)}
                        onDelete={() => handleDeleteHabit(habit.id)}
                        isToday={isTodayDate}
                        periodProgress={periodProgress}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

        {/* Create new habit button at bottom */}
        {habits.length > 0 && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setEditingHabit(null);
              setShowHabitForm(true);
            }}
          >
            {t("createNewHabit")}
          </Button>
        )}
          </div>
          
          {/* Sección de hábitos completados del período */}
          {filteredCompletedHabits.length > 0 && (
            <div className="space-y-6 mt-8 pt-6 border-t">
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 rounded-full bg-green-500" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                  {t("periodCompleted")}
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(groupedCompletedHabits).map(([timeOfDay, habitList]) => {
                  if (habitList.length === 0) return null;
                  const label = timeOfDay === "anytime" ? t("anyMoment") : t(timeOfDay as any);
                  
                  return (
                    <div key={timeOfDay} className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                        {label}
                      </h3>
                      {habitList.map((habit) => {
                        const periodProgress = getPeriodProgress(habit);
                        
                        return (
                          <div
                            key={habit.id}
                            className="rounded-xl p-4 border border-green-200 dark:border-green-800 opacity-75"
                            style={{ backgroundColor: hexToRgba(habit.color || "#3B82F6", 0.2) }}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                                style={{ backgroundColor: habit.color || "#3B82F6" }}
                              >
                                {(() => {
                                  const IconComponent = getHabitIcon(habit.icon);
                                  return <IconComponent className="h-5 w-5" />;
                                })()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate">{habit.name}</h3>
                                {periodProgress && (
                                  <p className="text-sm text-muted-foreground">
                                    {periodProgress.current} / {periodProgress.goal} {periodProgress.periodLabel} ✓
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </>
        )}
      </main>

      <BottomNav />

      <HabitFormDialog
        open={showHabitForm}
        onClose={() => {
          setShowHabitForm(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        initialData={editingHabit ? {
          name: editingHabit.name,
          icon: editingHabit.icon || "smile",
          color: editingHabit.color || "#3B82F6",
          habitType: editingHabit.habit_type as "check" | "count" | "timer",
          goalCount: editingHabit.goal_count || 1,
          goalMinutes: editingHabit.goal_minutes || 10,
          timeOfDay: editingHabit.time_of_day as any,
          repeatType: editingHabit.repeat_type as any,
          repeatDays: editingHabit.repeat_days || [],
          repeatCount: editingHabit.repeat_count || 7,
          reminderEnabled: editingHabit.reminder_enabled || false,
          reminderTime: editingHabit.reminder_time || "22:30",
          incentiveText: editingHabit.incentive_text || "",
          endType: editingHabit.end_type as any,
          endDate: editingHabit.end_date ? new Date(editingHabit.end_date) : undefined,
          endDays: editingHabit.end_days || 30,
        } : undefined}
      />

      <CompletionModal
        open={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          // Asegurar que se guarde la fecha cuando se cierra el modal
          const today = format(selectedDate, "yyyy-MM-dd");
          localStorage.setItem("completionModalLastShown", today);
        }}
      />
    </div>
  );
};

export default Dashboard;