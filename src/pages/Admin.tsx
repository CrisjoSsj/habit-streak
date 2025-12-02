import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, BarChart3, Users } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const summary = {
  totalUsers: 1280,
  activeToday: 436,
  avgHabitsPerUser: 4.2,
};

const engagementData = [
  { day: "L", active: 380 },
  { day: "M", active: 420 },
  { day: "X", active: 410 },
  { day: "J", active: 450 },
  { day: "V", active: 500 },
  { day: "S", active: 620 },
  { day: "D", active: 540 },
];

const topUsers = [
  { name: "Ana López", role: "admin", habits: 8, bestStreak: 45 },
  { name: "Carlos Pérez", role: "normal", habits: 5, bestStreak: 32 },
  { name: "María García", role: "normal", habits: 6, bestStreak: 28 },
  { name: "Juan Torres", role: "normal", habits: 4, bestStreak: 25 },
];

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium tracking-wide text-primary">Panel administrador</p>
            <h1 className="text-lg font-semibold sm:text-xl">HabitTrack · Visión general de la aplicación</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Rol: administrador
            </Badge>
            <Button size="sm" variant="outline">
              Volver al panel de usuario
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-8">
        <section className="grid gap-4 md:grid-cols-3" aria-label="Resumen de métricas">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardDescription>Usuarios totales</CardDescription>
                <CardTitle className="text-2xl">{summary.totalUsers.toLocaleString("es-ES")}</CardTitle>
              </div>
              <Users className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Usuarios registrados en la plataforma. Estos datos vendrán del backend.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardDescription>Activos hoy</CardDescription>
                <CardTitle className="text-2xl">{summary.activeToday}</CardTitle>
              </div>
              <Activity className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Usuarios que han hecho al menos un check-in hoy.</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardDescription>Hábitos por usuario</CardDescription>
                <CardTitle className="text-2xl">{summary.avgHabitsPerUser.toFixed(1)}</CardTitle>
              </div>
              <BarChart3 className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Media de hábitos activos por usuario.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[3fr,2fr]" aria-labelledby="engagement-heading">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle id="engagement-heading" className="text-base sm:text-lg">
                Actividad diaria global
              </CardTitle>
              <CardDescription>
                Usuarios que realizaron al menos un check-in por día (datos de ejemplo).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData} margin={{ left: -24, right: 0 }}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Bar dataKey="active" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm" aria-labelledby="users-heading">
            <CardHeader className="pb-3">
              <CardTitle id="users-heading" className="text-base sm:text-lg">
                Usuarios destacados
              </CardTitle>
              <CardDescription>
                Vista previa de gestión de usuarios y sus rachas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border bg-card/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead className="text-right">Rol</TableHead>
                      <TableHead className="text-right">Hábitos</TableHead>
                      <TableHead className="text-right">Mejor racha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topUsers.map((user) => (
                      <TableRow key={user.name}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-right text-xs">
                          <Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs">{user.habits}</TableCell>
                        <TableCell className="text-right text-xs">{user.bestStreak} días</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-[0.7rem] text-muted-foreground">
                Más adelante conectaremos esta tabla con el backend para permitir búsqueda, filtros, cambio de roles y
                desactivación de cuentas.
              </p>
              <div className="flex justify-end">
                <Button size="sm" variant="outline">
                  Ir a gestión de usuarios
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Admin;
