import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Share2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { AchievementBadge } from "@/components/habits/AchievementBadge";
import type { Tables } from "@/integrations/supabase/types";

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
  const [stats, setStats] = useState({
    currentStreak: 0,
    habitsCompletedThisWeek: 0,
    completionRate: 0,
    totalHabits: 0,
  });

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
        .eq("user_id", userId);
      setHabits(habitsData || []);

      // Fetch all completions
      const { data: completionsData } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", userId);
      setCompletions(completionsData || []);

      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId);
      setAchievements(achievementsData || []);

      // Calculate stats
      const totalHabits = habitsData?.length || 0;
      const completedCount = completionsData?.filter((c) => c.is_completed).length || 0;
      const totalPossible = totalHabits * 7; // This week
      const completionRate = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0;

      setStats({
        currentStreak: 0, // TODO: Calculate actual streak
        habitsCompletedThisWeek: completedCount,
        completionRate,
        totalHabits,
      });
    };

    fetchData();
  }, [userId]);

  const achievementTypes = [
    { type: "habit_1", level: 1, label: t("finishHabitOnce"), unlocked: achievements.some((a) => a.achievement_type === "habit_1") },
    { type: "habit_10", level: 10, label: t("finishHabit10"), unlocked: achievements.some((a) => a.achievement_type === "habit_10") },
    { type: "habit_20", level: 20, label: t("finishHabit20"), unlocked: achievements.some((a) => a.achievement_type === "habit_20") },
    { type: "habit_50", level: 50, label: t("finishHabit50"), unlocked: achievements.some((a) => a.achievement_type === "habit_50") },
    { type: "habit_100", level: 100, label: t("finishHabit100"), unlocked: achievements.some((a) => a.achievement_type === "habit_100") },
    { type: "habit_300", level: 300, label: t("finishHabit300"), unlocked: achievements.some((a) => a.achievement_type === "habit_300") },
  ];

  const perfectDayTypes = [
    { type: "perfect_3", level: 3, label: t("perfectDay3"), unlocked: achievements.some((a) => a.achievement_type === "perfect_3") },
    { type: "perfect_10", level: 10, label: t("perfectDay10"), unlocked: achievements.some((a) => a.achievement_type === "perfect_10") },
    { type: "perfect_20", level: 20, label: t("perfectDay20"), unlocked: achievements.some((a) => a.achievement_type === "perfect_20") },
  ];

  const unlockedCount = achievements.length;
  const totalAchievements = achievementTypes.length + perfectDayTypes.length;
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
      <AppHeader />

      <main className="container max-w-2xl space-y-4 px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("history")}</h1>
          <Button variant="ghost" size="icon">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="calendar" className="flex-1">{t("calendar")}</TabsTrigger>
            <TabsTrigger value="habits" className="flex-1">{t("allHabits")}</TabsTrigger>
            <TabsTrigger value="achievements" className="flex-1">{t("achievements")}</TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="bg-primary text-primary-foreground">
                <CardHeader className="p-3 pb-1">
                  <p className="text-xs font-medium opacity-90">{t("currentStreak")}</p>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-3xl font-bold">{stats.currentStreak}</p>
                  <p className="text-xs opacity-75">{t("bestStreak")}: 0</p>
                </CardContent>
              </Card>

              <Card className="bg-destructive text-destructive-foreground">
                <CardHeader className="p-3 pb-1">
                  <p className="text-xs font-medium opacity-90">{t("habitCompleted")}</p>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-3xl font-bold">{stats.habitsCompletedThisWeek}</p>
                  <p className="text-xs opacity-75">{t("thisWeek")}: 0</p>
                </CardContent>
              </Card>

              <Card className="bg-yellow-500 text-yellow-950">
                <CardHeader className="p-3 pb-1">
                  <p className="text-xs font-medium opacity-90">{t("completionRate")}</p>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-3xl font-bold">{stats.completionRate}%</p>
                  <p className="text-xs opacity-75">0/{stats.totalHabits} {t("habits")}</p>
                </CardContent>
              </Card>
            </div>

            {/* Calendar */}
            <Card>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={locale}
                  className="rounded-md"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Habits Tab */}
          <TabsContent value="habits" className="space-y-4">
            {habits.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">{t("noHabitsYet")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => {
                  const completionCount = completions.filter(
                    (c) => c.habit_id === habit.id && c.is_completed
                  ).length;
                  
                  return (
                    <Card key={habit.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full"
                            style={{ backgroundColor: habit.color || "#3B82F6" }}
                          >
                            <span className="text-lg">😊</span>
                          </div>
                          <div>
                            <p className="font-medium">{habit.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {completionCount} {t("completed").toLowerCase()}
                            </p>
                          </div>
                        </div>
                        {habit.is_archived && (
                          <span className="text-xs text-muted-foreground">{t("archived")}</span>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            {/* Summary Card */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{t("myAchievements")}</p>
                  <p className="text-sm opacity-80">
                    {t("youHaveEarned")} {achievementPercent}% {t("ofAllAchievements")}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary-foreground">
                  <span className="text-lg font-bold">{unlockedCount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Finished Habits Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("finishedHabits")}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {achievements.filter((a) => a.achievement_type.startsWith("habit_")).length}/6 {t("archived")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {achievementTypes.map((achievement) => (
                    <AchievementBadge
                      key={achievement.type}
                      level={achievement.level}
                      label={achievement.label}
                      unlocked={achievement.unlocked}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Perfect Days Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("perfectDays")}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {achievements.filter((a) => a.achievement_type.startsWith("perfect_")).length}/6 {t("archived")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {perfectDayTypes.map((achievement) => (
                    <AchievementBadge
                      key={achievement.type}
                      level={achievement.level}
                      label={achievement.label}
                      unlocked={achievement.unlocked}
                      isPerfectDay
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default History;