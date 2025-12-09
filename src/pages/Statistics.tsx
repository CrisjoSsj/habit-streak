import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfWeek, addDays, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { BarChart3, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type Habit = Tables<"habits">;
type HabitCompletion = Tables<"habit_completions">;

const Statistics = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const locale = language === "es" ? es : enUS;

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);

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
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      setHabits(habitsData || []);

      // Fetch all completions
      const { data: completionsData } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", userId)
        .order("completion_date", { ascending: false });
      setCompletions(completionsData || []);
    };

    fetchData();
  }, [userId]);

  // Datos para gráfico de completados por día (últimos 7 días)
  const weeklyCompletionsData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayCompletions = completions.filter(
        c => c.completion_date === dateStr && c.is_completed && c.habit_id !== null
      );
      const uniqueHabits = new Set(dayCompletions.map(c => c.habit_id)).size;
      
      data.push({
        day: format(date, "EEE", { locale }),
        date: format(date, "d/M", { locale }),
        completions: uniqueHabits,
      });
    }
    
    return data;
  }, [completions, locale]);

  // Datos para gráfico de progreso por hábito
  const habitProgressData = useMemo(() => {
    const activeHabits = habits.filter(h => !h.is_archived);
    return activeHabits.map(habit => {
      const habitCompletions = completions.filter(
        c => c.habit_id === habit.id && c.is_completed
      ).length;
      
      // Calcular días desde creación
      const createdDate = parseISO(habit.created_at);
      const today = new Date();
      const daysSinceCreation = Math.max(
        Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)),
        1
      );
      
      const completionRate = daysSinceCreation > 0 
        ? Math.round((habitCompletions / daysSinceCreation) * 100) 
        : 0;
      
      return {
        name: habit.name.length > 15 ? habit.name.substring(0, 15) + "..." : habit.name,
        completions: habitCompletions,
        rate: completionRate,
        color: habit.color || "#3B82F6",
      };
    }).slice(0, 5); // Top 5 hábitos
  }, [habits, completions]);

  // Datos para gráfico de tendencia semanal (últimas 4 semanas)
  const weeklyTrendData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const data = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(today, i * 7), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      
      const weekCompletions = completions.filter(c => {
        const completionDate = parseISO(c.completion_date);
        return completionDate >= weekStart && completionDate <= weekEnd && c.is_completed && c.habit_id !== null;
      });
      
      const uniqueHabits = new Set(weekCompletions.map(c => c.habit_id)).size;
      const totalCompletions = weekCompletions.length;
      
      data.push({
        week: `Sem ${i + 1}`,
        label: format(weekStart, "d/M", { locale }) + " - " + format(weekEnd, "d/M", { locale }),
        completions: totalCompletions,
        habits: uniqueHabits,
      });
    }
    
    return data;
  }, [completions, locale]);

  // Datos para gráfico de distribución por hábito
  const habitDistributionData = useMemo(() => {
    const activeHabits = habits.filter(h => !h.is_archived);
    const COLORS = ["#FF6B35", "#F7931E", "#FFD23F", "#06FFA5", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
    
    return activeHabits.map((habit, index) => {
      const habitCompletions = completions.filter(
        c => c.habit_id === habit.id && c.is_completed
      ).length;
      
      return {
        name: habit.name.length > 12 ? habit.name.substring(0, 12) + "..." : habit.name,
        value: habitCompletions,
        color: COLORS[index % COLORS.length],
      };
    }).filter(item => item.value > 0).slice(0, 8); // Top 8 hábitos con completados
  }, [habits, completions]);

  // Datos para gráfico de completados por mes (últimos 6 meses)
  const monthlyCompletionsData = useMemo(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    
    const months = eachMonthOfInterval({
      start: startOfMonth(sixMonthsAgo),
      end: endOfMonth(today),
    });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthCompletions = completions.filter(c => {
        const completionDate = parseISO(c.completion_date);
        return completionDate >= monthStart && completionDate <= monthEnd && c.is_completed && c.habit_id !== null;
      });
      
      const uniqueHabits = new Set(monthCompletions.map(c => c.habit_id)).size;
      const totalCompletions = monthCompletions.length;
      
      return {
        month: format(month, "MMM", { locale }),
        completions: totalCompletions,
        habits: uniqueHabits,
      };
    });
  }, [completions, locale]);

  // Datos para gráfico de progreso diario (últimos 30 días)
  const dailyProgressData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const data = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const activeHabits = habits.filter(h => !h.is_archived);
      const dayCompletions = completions.filter(
        c => c.completion_date === dateStr && c.is_completed && c.habit_id !== null
      );
      const completedHabitsCount = new Set(dayCompletions.map(c => c.habit_id)).size;
      const completionRate = activeHabits.length > 0 
        ? Math.round((completedHabitsCount / activeHabits.length) * 100)
        : 0;
      
      data.push({
        day: format(date, "d/M", { locale }),
        completions: completedHabitsCount,
        rate: completionRate,
      });
    }
    
    return data;
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
      <AppHeader title={t("navStatistics")} />

      <main className="container max-w-5xl mx-auto px-4 py-4 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t("navStatistics")}</h1>
          <p className="text-sm text-muted-foreground">
            Visualiza tu progreso y tendencias de hábitos
          </p>
        </div>

        {/* Gráficos Estadísticos */}
        {habits.length > 0 ? (
          <div className="space-y-6">
            {/* Primera fila: Completados últimos 7 días y Progreso por hábito */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfico de completados por día */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5" />
                    Completados últimos 7 días
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Hábitos completados por día
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyCompletionsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                      />
                      <Bar 
                        dataKey="completions" 
                        fill="hsl(var(--primary))" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico de progreso por hábito */}
              {habitProgressData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-5 w-5" />
                      Progreso por hábito
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Top 5 hábitos más completados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={habitProgressData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          type="number"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis 
                          type="category"
                          dataKey="name"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          width={80}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px"
                          }}
                        />
                        <Bar 
                          dataKey="completions" 
                          radius={[0, 8, 8, 0]}
                        >
                          {habitProgressData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Segunda fila: Tendencia Semanal y Distribución por Hábito */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfico de tendencia semanal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5" />
                    Tendencia Semanal
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Últimas 4 semanas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weeklyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="week" 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="completions" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Completados"
                        dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="habits" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Hábitos únicos"
                        dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico de distribución por hábito */}
              {habitDistributionData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-5 w-5" />
                      Distribución por Hábito
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Completados totales por hábito
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={habitDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {habitDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tercera fila: Completados por Mes y Progreso Diario */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfico de completados por mes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5" />
                    Completados por Mes
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Últimos 6 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyCompletionsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                      />
                      <Bar 
                        dataKey="completions" 
                        fill="hsl(var(--primary))" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico de progreso diario */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5" />
                    Progreso Diario
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Últimos 30 días
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={dailyProgressData}>
                      <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1}
                        fill="url(#colorRate)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                No hay datos suficientes para mostrar estadísticas.
                <br />
                Crea algunos hábitos y completa check-ins para ver tus estadísticas.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Statistics;

