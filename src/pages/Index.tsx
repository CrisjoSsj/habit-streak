import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Flame, Droplets, BookOpen, Brain, Trophy, Bell, Timer, Shield, CheckCircle, BarChart3, Target } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useEffect, useMemo, useState } from "react";

type HabitType = "check" | "count" | "timer";

type Habit = {
  id: string;
  name: string;
  description: string;
  icon: typeof Flame;
  target: string;
  category: string;
  type: HabitType;
  goal?: number;
};

const habits: Habit[] = [
  {
    id: "exercise",
    name: "Ejercicio",
    description: "30 min de actividad física",
    icon: Flame,
    target: "30 min",
    category: "Movimiento",
    type: "check",
  },
  {
    id: "water",
    name: "Agua",
    description: "8 vasos de agua",
    icon: Droplets,
    target: "8 vasos",
    category: "Hidratación",
    type: "count",
    goal: 8,
  },
  {
    id: "reading",
    name: "Lectura",
    description: "20 min de lectura",
    icon: BookOpen,
    target: "20 min",
    category: "Crecimiento",
    type: "check",
  },
  {
    id: "meditation",
    name: "Meditación",
    description: "10 min de respiración consciente",
    icon: Brain,
    target: "10 min",
    category: "Bienestar mental",
    type: "timer",
    goal: 10,
  },
];

const weeklyData = [
  { day: "L", completions: 3 },
  { day: "M", completions: 4 },
  { day: "X", completions: 2 },
  { day: "J", completions: 4 },
  { day: "V", completions: 3 },
  { day: "S", completions: 5 },
  { day: "D", completions: 4 },
];

const monthlyData = [
  { week: "Semana 1", completions: 18 },
  { week: "Semana 2", completions: 20 },
  { week: "Semana 3", completions: 22 },
  { week: "Semana 4", completions: 25 },
];

const achievements = [
  {
    id: 1,
    title: "Racha de fuego",
    description: "7 días seguidos cumpliendo tus hábitos.",
  },
  {
    id: 2,
    title: "Hidratación ejemplar",
    description: "30 días cumpliendo tu objetivo de agua.",
  },
  {
    id: 3,
    title: "Lectura constante",
    description: "15 días leyendo sin faltar.",
  },
];

const Index = () => {
  const { t } = useLanguage();
  const [todayCompletion, setTodayCompletion] = useState<Record<string, boolean>>({});
  const [countProgress, setCountProgress] = useState<Record<string, number>>({});
  const [timerState, setTimerState] = useState<Record<string, { running: boolean; elapsed: number }>>({});
  const [reminders, setReminders] = useState<{
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  }>({
    morning: true,
    afternoon: false,
    evening: false,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerState((prev) => {
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

  const isHabitCompleted = (habit: Habit) => {
    if (habit.type === "count") {
      const current = countProgress[habit.id] ?? 0;
      const goal = habit.goal ?? 0;
      return goal > 0 && current >= goal;
    }
    return !!todayCompletion[habit.id];
  };

  const completedCount = useMemo(
    () => habits.filter((h) => isHabitCompleted(h)).length,
    [countProgress, todayCompletion],
  );

  const completionPercent = useMemo(
    () => (habits.length ? Math.round((completedCount / habits.length) * 100) : 0),
    [completedCount],
  );

  const handleToggleHabit = (habit: Habit) => {
    if (habit.type === "count") {
      const goal = habit.goal ?? 0;
      setCountProgress((prev) => {
        const current = prev[habit.id] ?? 0;
        if (!goal) {
          return { ...prev, [habit.id]: current + 1 };
        }
        const next = Math.min(current + 1, goal);
        return { ...prev, [habit.id]: next };
      });
      return;
    }

    setTodayCompletion((prev) => ({ ...prev, [habit.id]: !prev[habit.id] }));
  };

  const handleStartPauseTimer = (habitId: string) => {
    setTimerState((prev) => {
      const current = prev[habitId] ?? { running: false, elapsed: 0 };
      return {
        ...prev,
        [habitId]: { ...current, running: !current.running },
      };
    });
  };

  const handleResetCount = (habitId: string) => {
    setCountProgress((prev) => ({ ...prev, [habitId]: 0 }));
  };

  const handleReminderToggle = (key: "morning" | "afternoon" | "evening") => {
    setReminders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-accent/10">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide text-primary">{t("brand")}</span>
              <span className="text-xs text-muted-foreground">{t("tagline")}</span>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Button size="sm" variant="outline" asChild>
              <a href="/auth">{t("login")}</a>
            </Button>
            <LanguageToggle />
            <ModeToggle />
          </nav>
        </div>
      </header>

      <main className="container flex-1 py-8">
        {/* Hero Section */}
        <section className="mb-10 grid gap-8 lg:grid-cols-[2fr,3fr]" aria-labelledby="hero-heading">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                ISO 9001:2015
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {t("features")}
              </Badge>
            </div>
            <h1
              id="hero-heading"
              className="text-balance font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              {t("heroTitle")}
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base leading-relaxed">
              {t("heroSubtitle")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <a href="/auth">{t("getStarted")}</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#how-it-works-heading">{t("learnMore")}</a>
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>{t("todayHabits")}</CardDescription>
                  <CardTitle className="text-2xl">{completedCount}/{habits.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={completionPercent} aria-label="Progreso de hábitos de hoy" />
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>{t("bestStreak")}</CardDescription>
                  <CardTitle className="text-2xl">21 {t("days")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{t("achievementsDesc")}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                  <div>
                    <CardDescription>{t("reminders")}</CardDescription>
                    <CardTitle className="text-2xl">3 {t("active")}</CardTitle>
                  </div>
                  <Bell className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{t("reminderDesc")}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Habits Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                {t("yourHabitsToday")}
                <Badge variant="outline" className="text-[0.7rem] font-normal">
                  {t("viewExample")}
                </Badge>
              </CardTitle>
              <CardDescription>{t("markCheckIns")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {habits.map((habit) => {
                  const Icon = habit.icon;
                  const isDone = isHabitCompleted(habit);
                  const count = countProgress[habit.id] ?? 0;
                  const timer = timerState[habit.id];
                  const goal = habit.goal ?? 0;

                  return (
                    <li
                      key={habit.id}
                      className="flex items-center justify-between rounded-lg border bg-card/70 px-3 py-2.5 text-sm shadow-xs"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{habit.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{habit.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {habit.type === "check" && (
                          <>
                            <span className="text-[0.7rem] text-muted-foreground">{t("goal")}: {habit.target}</span>
                            <Button
                              size="sm"
                              variant={isDone ? "default" : "outline"}
                              className="h-8 px-3 text-xs"
                              onClick={() => handleToggleHabit(habit)}
                            >
                              {isDone ? t("completed") : t("checkIn")}
                            </Button>
                          </>
                        )}

                        {habit.type === "count" && (
                          <>
                            <span className="text-[0.7rem] text-muted-foreground">
                              {t("progress")}: {count}/{goal || "?"}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={count >= goal && goal ? "default" : "outline"}
                                className="h-8 px-3 text-xs"
                                disabled={goal ? count >= goal : false}
                                onClick={() => handleToggleHabit(habit)}
                              >
                                {goal && count >= goal ? t("completed") : t("register")}
                              </Button>
                              {count > 0 && (
                                <button
                                  type="button"
                                  className="text-[0.65rem] text-muted-foreground underline-offset-2 hover:underline"
                                  onClick={() => handleResetCount(habit.id)}
                                >
                                  {t("reset")}
                                </button>
                              )}
                            </div>
                          </>
                        )}

                        {habit.type === "timer" && (
                          <>
                            <span className="text-[0.7rem] text-muted-foreground">{t("goal")}: {habit.target}</span>
                            <div className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
                              <Timer className="h-3 w-3 text-primary" />
                              <span>{formatTimer(timer?.elapsed ?? 0)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs"
                                onClick={() => handleStartPauseTimer(habit.id)}
                              >
                                {timer?.running ? t("pause") : t("start")}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={isDone ? "default" : "outline"}
                                className="h-8 px-3 text-xs"
                                onClick={() => handleToggleHabit(habit)}
                              >
                                {isDone ? t("completed") : t("checkIn")}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Progress & Achievements */}
        <section className="grid gap-6 lg:grid-cols-3" aria-labelledby="progress-heading">
          <div className="space-y-6 lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle id="progress-heading" className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  {t("progressCharts")}
                </CardTitle>
                <CardDescription>{t("progressChartsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="week" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="week">{t("week")}</TabsTrigger>
                    <TabsTrigger value="month">{t("month")}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="week" className="mt-2">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData} margin={{ left: -24, right: 0 }}>
                          <XAxis dataKey="day" tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 8,
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                          <Bar dataKey="completions" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  <TabsContent value="month" className="mt-2">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ left: -24, right: 0 }}>
                          <XAxis dataKey="week" tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 8,
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                          <Bar dataKey="completions" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm" aria-labelledby="achievements-heading">
              <CardHeader className="pb-3">
                <CardTitle id="achievements-heading" className="flex items-center gap-2 text-base sm:text-lg">
                  <Trophy className="h-5 w-5 text-primary" />
                  {t("achievements")}
                </CardTitle>
                <CardDescription>{t("achievementsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="rounded-lg border bg-card/70 px-3 py-2 text-xs shadow-xs"
                  >
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-[0.7rem] text-muted-foreground">{achievement.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm" aria-labelledby="reminders-heading">
              <CardHeader className="pb-3">
                <CardTitle id="reminders-heading" className="flex items-center gap-2 text-base sm:text-lg">
                  <Bell className="h-5 w-5 text-primary" />
                  {t("reminderConfig")}
                </CardTitle>
                <CardDescription>{t("reminderDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={reminders.morning ? "default" : "outline"}
                    className="h-7 px-3 text-[0.7rem]"
                    onClick={() => handleReminderToggle("morning")}
                  >
                    {t("morning")} · 8:00
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={reminders.afternoon ? "default" : "outline"}
                    className="h-7 px-3 text-[0.7rem]"
                    onClick={() => handleReminderToggle("afternoon")}
                  >
                    {t("afternoon")} · 14:00
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={reminders.evening ? "default" : "outline"}
                    className="h-7 px-3 text-[0.7rem]"
                    onClick={() => handleReminderToggle("evening")}
                  >
                    {t("evening")} · 21:00
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <section
          className="mt-10 grid gap-6 border-t border-border/60 pt-8 md:grid-cols-3"
          aria-labelledby="how-it-works-heading"
          id="features"
        >
          <article className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 id="how-it-works-heading" className="text-sm font-semibold uppercase tracking-wide text-primary">
                {t("howItWorks")}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">{t("howItWorksDesc")}</p>
          </article>
          <article className="space-y-3 rounded-lg border bg-card/50 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">{t("step1Title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t("step1Desc")}</p>
          </article>
          <article className="space-y-3 rounded-lg border bg-card/50 p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">{t("step2Title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t("step2Desc")}</p>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
