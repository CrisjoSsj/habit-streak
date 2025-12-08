import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { WeekCalendar } from "@/components/habits/WeekCalendar";
import { TimeFilter } from "@/components/habits/TimeFilter";
import { HabitCard } from "@/components/habits/HabitCard";
import { HabitFormDialog } from "@/components/habits/HabitFormDialog";
import { CompletionModal } from "@/components/habits/CompletionModal";
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
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  // Fetch completions for selected date
  useEffect(() => {
    if (!userId) return;
    const fetchCompletions = async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", userId)
        .eq("completion_date", dateStr);

      if (error) {
        console.error("Error fetching completions:", error);
        return;
      }
      setCompletions(data || []);
    };
    fetchCompletions();
  }, [userId, selectedDate]);

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

  // Check if all habits completed
  useEffect(() => {
    if (habits.length === 0) return;
    const allCompleted = habits.every((habit) => {
      const completion = completions.find((c) => c.habit_id === habit.id);
      return completion?.is_completed;
    });
    if (allCompleted && habits.length > 0) {
      setShowCompletionModal(true);
    }
  }, [completions, habits]);

  const getCompletion = (habitId: string): HabitCompletion | undefined => {
    return completions.find((c) => c.habit_id === habitId);
  };

  const upsertCompletion = async (
    habitId: string,
    updates: Partial<HabitCompletion>
  ) => {
    if (!userId) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const existing = getCompletion(habitId);

    if (existing) {
      const { error } = await supabase
        .from("habit_completions")
        .update(updates)
        .eq("id", existing.id);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }
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
      if (data) setCompletions((prev) => [...prev, data]);
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

  // Filter habits by time of day
  const filteredHabits = habits.filter((habit) => {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{t("checkingSession")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <AppHeader />

      <main className="container max-w-2xl space-y-4 px-4 py-4">
        {/* Header with date and add button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("today")}</h1>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, "d MMM", { locale })}
            </p>
          </div>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={() => {
              setEditingHabit(null);
              setShowHabitForm(true);
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* Week Calendar */}
        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          completions={completions}
          habits={habits}
        />

        {/* Time Filter */}
        <TimeFilter selected={timeFilter} onSelect={setTimeFilter} />

        {/* Habit Lists by Time of Day */}
        {filteredHabits.length === 0 ? (
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
          <div className="space-y-6">
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
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

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
        onClose={() => setShowCompletionModal(false)}
      />
    </div>
  );
};

export default Dashboard;