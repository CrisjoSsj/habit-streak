import { useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";
import { useToast } from "@/hooks/use-toast";
import { Flame, Droplets, BookOpen, Brain, Timer, Bell } from "lucide-react";

 type HabitType = "check" | "count" | "timer";

 type Habit = {
   id: string;
   name: string;
   type: HabitType;
   goalCount?: number;
   goalMinutes?: number;
 };

 type TimerState = {
   running: boolean;
   elapsed: number;
 };

 type Reminder = {
   id: string;
   label: string;
   time: string; // HH:MM
 };

 const Dashboard = () => {
   const navigate = useNavigate();
   const { toast } = useToast();

   const [session, setSession] = useState<Session | null>(null);
   const [user, setUser] = useState<User | null>(null);
   const [authLoading, setAuthLoading] = useState(true);

   const [habits, setHabits] = useState<Habit[]>([]);
   const [newHabitName, setNewHabitName] = useState("");
   const [newHabitType, setNewHabitType] = useState<HabitType>("check");
   const [newHabitGoalCount, setNewHabitGoalCount] = useState(8);
   const [newHabitGoalMinutes, setNewHabitGoalMinutes] = useState(10);

   const [checkCompletion, setCheckCompletion] = useState<Record<string, boolean>>({});
   const [countProgress, setCountProgress] = useState<Record<string, number>>({});
   const [timerState, setTimerState] = useState<Record<string, TimerState>>({});

   const [reminders, setReminders] = useState<Reminder[]>([]);
   const [newReminderLabel, setNewReminderLabel] = useState("Recordatorio diario");
   const [newReminderTime, setNewReminderTime] = useState("08:00");

   useEffect(() => {
     document.title = "Panel de hábitos · HabitTrack";
   }, []);

   useEffect(() => {
     const {
       data: { subscription },
     } = supabase.auth.onAuthStateChange((_event, nextSession) => {
       setSession(nextSession);
       setUser(nextSession?.user ?? null);

       if (!nextSession) {
         navigate("/auth", { replace: true });
       }
     });

     supabase.auth
       .getSession()
       .then(({ data: { session } }) => {
         setSession(session);
         setUser(session?.user ?? null);

         if (!session) {
           navigate("/auth", { replace: true });
         }
       })
       .finally(() => setAuthLoading(false));

     return () => {
       subscription.unsubscribe();
     };
   }, [navigate]);

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

   const handleSignOut = async () => {
     const { error } = await supabase.auth.signOut();

     if (error) {
       toast({
         variant: "destructive",
         title: "Error al cerrar sesión",
         description: error.message || "Inténtalo de nuevo más tarde.",
       });
       return;
     }

     toast({ title: "Sesión cerrada", description: "Has salido de HabitTrack correctamente." });
     navigate("/", { replace: true });
   };

   const handleAddHabit = () => {
     const name = newHabitName.trim();

     if (!name) {
       toast({
         variant: "destructive",
         title: "Nombre requerido",
         description: "Añade un nombre para tu hábito.",
       });
       return;
     }

     if (newHabitType === "count" && (!Number.isFinite(newHabitGoalCount) || newHabitGoalCount <= 0)) {
       toast({
         variant: "destructive",
         title: "Meta inválida",
         description: "La meta de repeticiones debe ser un número mayor que 0.",
       });
       return;
     }

     if (newHabitType === "timer" && (!Number.isFinite(newHabitGoalMinutes) || newHabitGoalMinutes <= 0)) {
       toast({
         variant: "destructive",
         title: "Meta inválida",
         description: "La meta de minutos debe ser un número mayor que 0.",
       });
       return;
     }

     const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `habit-${Date.now()}`;

     const habit: Habit = {
       id,
       name,
       type: newHabitType,
       goalCount: newHabitType === "count" ? newHabitGoalCount : undefined,
       goalMinutes: newHabitType === "timer" ? newHabitGoalMinutes : undefined,
     };

     setHabits((prev) => [...prev, habit]);
     setNewHabitName("");
     setNewHabitGoalCount(8);
     setNewHabitGoalMinutes(10);

     toast({ title: "Hábito creado", description: "Ya puedes registrar tus check-ins de este hábito." });
   };

   const handleToggleCheckHabit = (habitId: string, habitType?: HabitType) => {
     setCheckCompletion((prev) => {
       const nextValue = !prev[habitId];
       return { ...prev, [habitId]: nextValue };
     });
 
     if (habitType === "timer") {
       setTimerState((prev) => {
         const current = prev[habitId] ?? { running: false, elapsed: 0 };
         return {
           ...prev,
           [habitId]: { ...current, running: false },
         };
       });
     }
   };

   const handleAddCountProgress = (habitId: string, goal: number | undefined, amount: number) => {
     if (!amount || amount <= 0) return;

     setCountProgress((prev) => {
       const current = prev[habitId] ?? 0;
       if (!goal) {
         return { ...prev, [habitId]: current + amount };
       }

       const next = Math.min(current + amount, goal);
       return { ...prev, [habitId]: next };
     });
   };

   const handleResetCount = (habitId: string) => {
     setCountProgress((prev) => ({ ...prev, [habitId]: 0 }));
   };

   const handleToggleTimer = (habitId: string) => {
     setTimerState((prev) => {
       const current = prev[habitId] ?? { running: false, elapsed: 0 };
       return {
         ...prev,
         [habitId]: { ...current, running: !current.running },
       };
     });
   };
 
   const handleResetTimer = (habitId: string) => {
     setTimerState((prev) => {
       const current = prev[habitId] ?? { running: false, elapsed: 0 };
       return {
         ...prev,
         [habitId]: { ...current, running: false, elapsed: 0 },
       };
     });
   };

   const handleReminderAdd = () => {
     const label = newReminderLabel.trim() || "Recordatorio";

     if (!newReminderTime) {
       toast({
         variant: "destructive",
         title: "Hora requerida",
         description: "Selecciona una hora para el recordatorio.",
       });
       return;
     }

     const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `reminder-${Date.now()}`;

     setReminders((prev) => [...prev, { id, label, time: newReminderTime }]);
     toast({ title: "Recordatorio añadido", description: `Se activará cada día a las ${newReminderTime}.` });
   };

   const handleReminderRemove = (id: string) => {
     setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
   };

   const isHabitCompleted = (habit: Habit) => {
     if (habit.type === "count") {
       const goal = habit.goalCount ?? 0;
       const current = countProgress[habit.id] ?? 0;
       return goal > 0 && current >= goal;
     }

     return !!checkCompletion[habit.id];
   };

   const totalHabits = habits.length;
   const completedHabits = useMemo(
     () => habits.filter((habit) => isHabitCompleted(habit)).length,
     [habits, countProgress, checkCompletion],
   );
   const completionPercent = totalHabits ? Math.round((completedHabits / totalHabits) * 100) : 0;

   const formatTimer = (seconds: number) => {
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
   };

   if (authLoading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <p className="text-sm text-muted-foreground">Comprobando tu sesión...</p>
       </div>
     );
   }

   return (
     <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/20">
       <header className="border-b bg-background/80 backdrop-blur">
         <div className="container flex items-center justify-between py-4">
           <div className="flex flex-col gap-1">
             <span className="text-xs font-semibold tracking-wide text-primary">HABITTRACK · Panel</span>
             <span className="text-xs text-muted-foreground">
               Hola, {user?.email ?? "usuario"}. Gestiona aquí tus hábitos y recordatorios.
             </span>
           </div>
           <nav className="flex items-center gap-3 text-sm">
             <Button variant="outline" size="sm" asChild>
               <a href="/">Ir a la landing</a>
             </Button>
             <ModeToggle />
             <Button variant="outline" size="sm" onClick={handleSignOut}>
               Cerrar sesión
             </Button>
           </nav>
         </div>
       </header>

       <main className="container space-y-6 py-8">
         <section className="grid gap-4 md:grid-cols-3" aria-label="Resumen de hábitos">
           <Card className="shadow-sm">
             <CardHeader className="pb-2">
               <CardDescription>Hábitos de hoy</CardDescription>
               <CardTitle className="text-2xl">{completedHabits + "/" + totalHabits}</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground">
                 Marca tus check-ins diarios y mantén vivas tus rachas.
               </p>
             </CardContent>
           </Card>

           <Card className="shadow-sm">
             <CardHeader className="pb-2">
               <CardDescription>Porcentaje completado</CardDescription>
               <CardTitle className="text-2xl">{completionPercent}%</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground">Cuando guardemos en el backend, verás tus estadísticas aquí.</p>
             </CardContent>
           </Card>

           <Card className="shadow-sm">
             <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
               <div>
                 <CardDescription>Recordatorios activos</CardDescription>
                 <CardTitle className="text-2xl">{reminders.length}</CardTitle>
               </div>
               <Bell className="h-5 w-5 text-primary" />
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground">Configura avisos diarios a la hora exacta que prefieras.</p>
             </CardContent>
           </Card>
         </section>

         <section aria-label="Gestión de hábitos y recordatorios">
           <Tabs defaultValue="habits" className="space-y-4">
             <TabsList>
               <TabsTrigger value="habits">Mis hábitos</TabsTrigger>
               <TabsTrigger value="reminders">Recordatorios</TabsTrigger>
             </TabsList>

             <TabsContent value="habits" className="space-y-4">
               <Card className="shadow-sm">
                 <CardHeader>
                   <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                     Crear nuevos hábitos
                     <Badge variant="outline" className="text-[0.7rem]">
                       Solo tú los ves
                     </Badge>
                   </CardTitle>
                   <CardDescription>Define el tipo de hábito y su meta diaria.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="grid gap-3 md:grid-cols-[2fr,1fr,1fr,auto]">
                     <div>
                       <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="habit-name">
                         Nombre del hábito
                       </label>
                       <Input
                         id="habit-name"
                         placeholder="Ej. 8 vasos de agua"
                         value={newHabitName}
                         onChange={(e) => setNewHabitName(e.target.value)}
                       />
                     </div>
                     <div>
                       <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="habit-type">
                         Tipo de hábito
                       </label>
                       <select
                         id="habit-type"
                         className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                         value={newHabitType}
                         onChange={(e) => setNewHabitType(e.target.value as HabitType)}
                       >
                         <option value="check">Check-in simple</option>
                         <option value="count">Contador (0/n)</option>
                         <option value="timer">Minutos (temporizador)</option>
                       </select>
                     </div>
                     {newHabitType === "count" && (
                       <div>
                         <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="habit-goal-count">
                           Meta diaria
                         </label>
                         <Input
                           id="habit-goal-count"
                           type="number"
                           min={1}
                           value={newHabitGoalCount}
                           onChange={(e) => setNewHabitGoalCount(Number(e.target.value) || 0)}
                         />
                       </div>
                     )}
                     {newHabitType === "timer" && (
                       <div>
                         <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="habit-goal-minutes">
                           Minutos objetivo
                         </label>
                         <Input
                           id="habit-goal-minutes"
                           type="number"
                           min={1}
                           value={newHabitGoalMinutes}
                           onChange={(e) => setNewHabitGoalMinutes(Number(e.target.value) || 0)}
                         />
                       </div>
                     )}
                     <div className="flex items-end">
                       <Button type="button" className="w-full" onClick={handleAddHabit}>
                         Añadir hábito
                       </Button>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               <Card className="shadow-sm">
                 <CardHeader>
                   <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                     Hábitos de hoy
                     <Badge variant="outline" className="text-[0.7rem]">
                       Interfaz de usuario
                     </Badge>
                   </CardTitle>
                   <CardDescription>
                     Marca tus check-ins diarios. Más adelante guardaremos estos datos en el backend.
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-3">
                   {habits.length === 0 ? (
                     <p className="text-xs text-muted-foreground">
                       Todavía no has creado ningún hábito. Empieza añadiendo uno arriba.
                     </p>
                   ) : (
                     <ul className="space-y-3">
                       {habits.map((habit) => {
                         const isDone = isHabitCompleted(habit);
                         const count = countProgress[habit.id] ?? 0;
                         const timer = timerState[habit.id];

                         const Icon =
                           habit.type === "check" ? Flame : habit.type === "count" ? Droplets : habit.type === "timer" ? Brain : BookOpen;

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
                                 <p className="truncate text-[0.7rem] text-muted-foreground">
                                   {habit.type === "check" && "Marcar una vez al día."}
                                   {habit.type === "count" &&
                                     `Objetivo: ${habit.goalCount ?? "?"} repeticiones. Puedes registrar varias de golpe.`}
                                   {habit.type === "timer" &&
                                     `Objetivo: ${habit.goalMinutes ?? "?"} min. Usa el temporizador o haz check-in manual.`}
                                 </p>
                               </div>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                               {habit.type === "check" && (
                                 <Button
                                   type="button"
                                   size="sm"
                                   variant={isDone ? "default" : "outline"}
                                   className="h-8 px-3 text-xs"
                                   onClick={() => handleToggleCheckHabit(habit.id)}
                                 >
                                   {isDone ? "Completado" : "Hacer check-in"}
                                 </Button>
                               )}

                               {habit.type === "count" && (
                                 <>
                                   <span className="text-[0.7rem] text-muted-foreground">
                                     Progreso: {count}/{habit.goalCount ?? "?"}
                                   </span>
                                   <div className="flex items-center gap-2">
                                     <Button
                                       type="button"
                                       size="sm"
                                       variant={isDone ? "default" : "outline"}
                                       className="h-8 px-3 text-xs"
                                       disabled={isDone}
                                       onClick={() => handleAddCountProgress(habit.id, habit.goalCount, 1)}
                                     >
                                       +1
                                     </Button>
                                     <Button
                                       type="button"
                                       size="sm"
                                       variant="outline"
                                       className="h-8 px-3 text-xs"
                                       disabled={isDone || !habit.goalCount}
                                       onClick={() =>
                                         handleAddCountProgress(
                                           habit.id,
                                           habit.goalCount,
                                           habit.goalCount ? habit.goalCount - count : 0,
                                         )
                                       }
                                     >
                                       Todo
                                     </Button>
                                     {count > 0 && (
                                       <button
                                         type="button"
                                         className="text-[0.65rem] text-muted-foreground underline-offset-2 hover:underline"
                                         onClick={() => handleResetCount(habit.id)}
                                       >
                                         Reiniciar
                                       </button>
                                     )}
                                   </div>
                                 </>
                               )}

                               {habit.type === "timer" && (
                                 <>
                                   <span className="text-[0.7rem] text-muted-foreground">
                                     Objetivo: {habit.goalMinutes ?? "?"} min
                                   </span>
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
                                        onClick={() => handleToggleTimer(habit.id)}
                                      >
                                        {timer?.running ? "Pausar" : "Comenzar"}
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3 text-xs"
                                        disabled={!timer || timer.elapsed === 0}
                                        onClick={() => handleResetTimer(habit.id)}
                                      >
                                        Reiniciar
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={isDone ? "default" : "outline"}
                                        className="h-8 px-3 text-xs"
                                        onClick={() => handleToggleCheckHabit(habit.id, "timer")}
                                      >
                                        {isDone ? "Completado" : "Check-in manual"}
                                      </Button>
                                    </div>
                                 </>
                               )}
                             </div>
                           </li>
                         );
                       })}
                     </ul>
                   )}
                 </CardContent>
               </Card>
             </TabsContent>

             <TabsContent value="reminders" className="space-y-4">
               <Card className="shadow-sm">
                 <CardHeader>
                   <CardTitle className="text-base sm:text-lg">Recordatorios personalizados</CardTitle>
                   <CardDescription>
                     Define recordatorios a la hora exacta que prefieras. Más adelante podremos conectarlos con
                     notificaciones reales.
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
                     <div>
                       <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="reminder-label">
                         Nombre del recordatorio
                       </label>
                       <Input
                         id="reminder-label"
                         placeholder="Ej. Recordatorio de agua"
                         value={newReminderLabel}
                         onChange={(e) => setNewReminderLabel(e.target.value)}
                       />
                     </div>
                     <div>
                       <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="reminder-time">
                         Hora
                       </label>
                       <Input
                         id="reminder-time"
                         type="time"
                         value={newReminderTime}
                         onChange={(e) => setNewReminderTime(e.target.value)}
                       />
                     </div>
                     <div className="flex items-end">
                       <Button type="button" className="w-full" onClick={handleReminderAdd}>
                         Añadir recordatorio
                       </Button>
                     </div>
                   </div>

                   {reminders.length === 0 ? (
                     <p className="text-xs text-muted-foreground">
                       Aún no tienes recordatorios configurados. Empieza creando uno arriba.
                     </p>
                   ) : (
                     <ul className="space-y-2">
                       {reminders.map((reminder) => (
                         <li
                           key={reminder.id}
                           className="flex items-center justify-between rounded-md border bg-card/70 px-3 py-2 text-sm"
                         >
                           <div>
                             <p className="font-medium">{reminder.label}</p>
                             <p className="text-[0.7rem] text-muted-foreground">
                               Todos los días a las {reminder.time}
                             </p>
                           </div>
                           <Button
                             variant="outline"
                             size="sm"
                             className="h-8 px-3 text-xs"
                             onClick={() => handleReminderRemove(reminder.id)}
                           >
                             Eliminar
                           </Button>
                         </li>
                       ))}
                     </ul>
                   )}
                 </CardContent>
               </Card>
             </TabsContent>
           </Tabs>
         </section>
       </main>
     </div>
   );
 };

 export default Dashboard;
