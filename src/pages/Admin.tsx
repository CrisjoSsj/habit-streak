import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/layout/Logo";
import { TopNav } from "@/components/layout/TopNav";
import { QuickNav } from "@/components/layout/QuickNav";
import { UserMenu } from "@/components/layout/UserMenu";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ModeToggle } from "@/components/mode-toggle";
import { 
  Activity, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Calendar,
  Search,
  Filter,
  Download,
  Edit,
  Shield,
  UserX,
  UserCheck,
  Home,
  FileText,
  Settings,
  LogOut,
  RefreshCw,
  Mail,
  Phone,
  Clock
} from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell, Legend } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

type UserWithRole = {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  role: "admin" | "moderator" | "user" | null;
  profile: {
    full_name: string | null;
    age: number | null;
    avatar_url: string | null;
  } | null;
  habits_count: number;
  completions_count: number;
  last_activity: string | null;
};

type Stats = {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  avgHabitsPerUser: number;
  totalHabits: number;
  totalCompletions: number;
  completionRate: number;
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, role, signOut, loading: authLoading, refreshRole } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeToday: 0,
    activeThisWeek: 0,
    avgHabitsPerUser: 0,
    totalHabits: 0,
    totalCompletions: 0,
    completionRate: 0,
  });
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [habitsData, setHabitsData] = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [editingRole, setEditingRole] = useState<string>("");

  // Verificar autenticación y rol
  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }
      
      setCheckingAccess(true);
      
      // Verificar rol directamente desde la base de datos (fuente de verdad)
      let userRole: string | null = null;
      let roleError: any = null;
      let roleData: any[] | null = null;
      
      // Método 1: Consulta directa (método más confiable)
      // Comentamos las funciones RPC temporalmente para evitar errores de tipo
      
      // Método 2: Consulta directa - obtener todos los roles del usuario
      if (!userRole) {
        const { data: rolesFromDB, error: directError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        roleData = rolesFromDB || null;
        
        console.log("🔐 Consulta de roles:", {
          userId: user.id,
          email: user.email,
          roleData,
          error: directError,
          roleDataLength: roleData?.length
        });
        
        if (directError) {
          console.error("❌ Error al consultar roles:", directError);
          roleError = directError;
          
          // Si el error es de permisos, intentar usar la función has_role
          if (directError.message?.includes("permission") || directError.message?.includes("RLS")) {
            console.log("⚠️ Error de permisos detectado, intentando función has_role...");
            try {
              const { data: hasAdminRole, error: hasRoleError } = await supabase
                .rpc("has_role", {
                  _user_id: user.id,
                  _role: "admin"
                });
              
              console.log("has_role resultado:", hasAdminRole, "error:", hasRoleError);
              
              if (!hasRoleError && hasAdminRole === true) {
                userRole = "admin";
                console.log("✅ Rol admin confirmado mediante has_role");
              }
            } catch (e: any) {
              // Silenciar error de tipo si ocurre
              console.log("⚠️ Error en has_role (ignorado):", e?.message);
            }
          }
        } else if (roleData && roleData.length > 0) {
          // Si hay múltiples roles, buscar el de admin primero
          const adminRole = roleData.find(r => r.role === "admin");
          userRole = adminRole?.role || roleData[0]?.role || null;
          console.log("✅ Rol encontrado:", userRole, "de", roleData.length, "roles");
        } else {
          console.warn("⚠️ No se encontraron roles para el usuario");
        }
      }
      
      console.log("🔐 Verificación de acceso admin - RESUMEN:", {
        userId: user.id,
        email: user.email,
        roleFromDB: userRole,
        roleData: roleData,
        roleFromHook: role,
        isAdminFromHook: isAdmin,
        hasRoleError: !!roleError,
        roleErrorDetails: roleError
      });
      
      // Si hay error al consultar, intentar refrescar el rol del hook
      if (roleError && !userRole) {
        console.warn("⚠️ Error al consultar rol desde DB:", roleError);
        // Refrescar el rol del hook como respaldo
        await refreshRole();
        // Esperar un momento para que se actualice
        await new Promise(resolve => setTimeout(resolve, 500));
        // Verificar el hook actualizado (se actualizará en el siguiente render)
        if (isAdmin || role === "admin") {
          console.log("⚠️ Error en DB pero hook confirma admin, permitiendo acceso");
          setCheckingAccess(false);
          loadData();
          return;
        }
      }
      
      // Si no hay rol en la base de datos, esperar un poco y reintentar
      if (!userRole && !roleError) {
        console.log("⏳ Rol no encontrado en DB, esperando...");
        // Esperar un poco y reintentar (máximo 3 intentos)
        const retryCount = (window as any).__adminRetryCount || 0;
        if (retryCount < 3) {
          (window as any).__adminRetryCount = retryCount + 1;
          setTimeout(() => {
            checkAccess();
          }, 1000);
          return;
        }
      }
      
      // Limpiar contador de reintentos
      (window as any).__adminRetryCount = 0;
      
      // Verificar si es admin (priorizar DB, luego hook como respaldo)
      if (userRole === "admin" || (!userRole && (isAdmin || role === "admin"))) {
        console.log("✅ Acceso concedido - Usuario es admin");
        // Si el hook no está actualizado, refrescarlo
        if (userRole === "admin" && role !== "admin") {
          await refreshRole();
        }
        setCheckingAccess(false);
        loadData();
        return;
      }
      
      // Si no es admin, denegar acceso
      console.log("❌ Acceso denegado - Rol:", userRole || role || "sin asignar");
      console.log("📊 Detalles completos:", {
        userRole,
        roleFromHook: role,
        isAdminFromHook: isAdmin,
        roleError,
        roleData
      });
      toast({
        title: "Acceso denegado",
        description: `Tu rol actual es: ${userRole || role || "sin asignar"}. Se requieren permisos de administrador.`,
        variant: "destructive",
      });
      setCheckingAccess(false);
      navigate("/app", { replace: true });
    };
    
    checkAccess();
  }, [user, role, isAdmin, authLoading, navigate, toast]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadChartsData(),
      ]);
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Total usuarios
      const { count: totalUsers } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true });

      // Usuarios activos hoy
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();
      
      const { data: todayCompletions } = await supabase
        .from("habit_completions")
        .select("user_id")
        .gte("created_at", todayStart)
        .lte("created_at", todayEnd);

      const activeToday = new Set(todayCompletions?.map(c => c.user_id) || []).size;

      // Usuarios activos esta semana
      const weekStart = startOfDay(subDays(today, 7)).toISOString();
      const { data: weekCompletions } = await supabase
        .from("habit_completions")
        .select("user_id")
        .gte("created_at", weekStart);

      const activeThisWeek = new Set(weekCompletions?.map(c => c.user_id) || []).size;

      // Total hábitos
      const { count: totalHabits } = await supabase
        .from("habits")
        .select("*", { count: "exact", head: true });

      // Total completados
      const { count: totalCompletions } = await supabase
        .from("habit_completions")
        .select("*", { count: "exact", head: true });

      // Promedio de hábitos por usuario
      const avgHabitsPerUser = totalUsers && totalUsers > 0 ? (totalHabits || 0) / totalUsers : 0;

      // Tasa de completación (completados / posibles completados)
      const completionRate = totalHabits && totalHabits > 0 
        ? ((totalCompletions || 0) / (totalHabits * 30)) * 100 
        : 0;

      setStats({
        totalUsers: totalUsers || 0,
        activeToday,
        activeThisWeek,
        avgHabitsPerUser: Number(avgHabitsPerUser.toFixed(1)),
        totalHabits: totalHabits || 0,
        totalCompletions: totalCompletions || 0,
        completionRate: Number(completionRate.toFixed(1)),
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadUsers = async () => {
    try {
      // Usar función RPC para obtener usuarios (solo disponible para admins)
      const { data: usersData, error: rpcError } = await supabase.rpc('admin_get_users');

      if (rpcError) {
        console.error("Error obteniendo usuarios:", rpcError);
        throw rpcError;
      }

      if (!usersData || usersData.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      // Transformar datos al formato esperado
      const usersWithData: UserWithRole[] = usersData.map((u: any) => ({
        id: u.id,
        email: u.email || "",
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at,
        role: u.role || null,
        profile: u.full_name || u.age || u.avatar_url ? {
          full_name: u.full_name,
          age: u.age,
          avatar_url: u.avatar_url,
        } : null,
        habits_count: Number(u.habits_count) || 0,
        completions_count: Number(u.completions_count) || 0,
        last_activity: u.last_activity || null,
      }));

      setUsers(usersWithData);
      setFilteredUsers(usersWithData);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los usuarios. Verifica que tengas permisos de administrador.",
        variant: "destructive",
      });
    }
  };

  const loadChartsData = async () => {
    try {
      // Datos de engagement últimos 7 días
      const engagementDays = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStart = startOfDay(date).toISOString();
        const dateEnd = endOfDay(date).toISOString();

        const { data: completions } = await supabase
          .from("habit_completions")
          .select("user_id")
          .gte("created_at", dateStart)
          .lte("created_at", dateEnd);

        const uniqueUsers = new Set(completions?.map(c => c.user_id) || []).size;

        engagementDays.push({
          day: format(date, "EEE", { locale: es }).charAt(0).toUpperCase(),
          active: uniqueUsers,
          date: format(date, "dd/MM"),
        });
      }
      setEngagementData(engagementDays);

      // Distribución de tipos de hábitos
      const { data: habits } = await supabase
        .from("habits")
        .select("habit_type");

      const habitsByType: Record<string, number> = {};
      habits?.forEach(h => {
        habitsByType[h.habit_type] = (habitsByType[h.habit_type] || 0) + 1;
      });

      setHabitsData(Object.entries(habitsByType).map(([name, value]) => ({
        name: name === "check" ? "Check-in" : name === "count" ? "Contador" : "Temporizador",
        value,
      })));

      // Distribución de roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role");

      const rolesByType: Record<string, number> = {};
      roles?.forEach(r => {
        rolesByType[r.role] = (rolesByType[r.role] || 0) + 1;
      });

      setRoleDistribution(Object.entries(rolesByType).map(([name, value]) => ({
        name: name === "admin" ? "Administrador" : name === "moderator" ? "Moderador" : "Usuario",
        value,
      })));
    } catch (error) {
      console.error("Error loading charts data:", error);
    }
  };

  // Filtrar usuarios
  useEffect(() => {
    let filtered = users;

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por rol
    if (roleFilter !== "all") {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const handleRoleChange = async (userId: string, newRole: "admin" | "moderator" | "user") => {
    try {
      // Primero eliminar todos los roles existentes del usuario
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Error eliminando roles anteriores:", deleteError);
        // Continuar de todas formas, puede que no haya roles previos
      }

      // Luego insertar el nuevo rol
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: newRole,
        });

      if (insertError) throw insertError;

      // Si el usuario actual cambió su propio rol, refrescar el rol en el hook
      if (userId === user?.id) {
        await refreshRole();
        // Si se cambió a admin, recargar la página para aplicar los cambios
        if (newRole === "admin") {
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      }

      toast({
        title: "Rol actualizado",
        description: `El rol del usuario ha sido cambiado a ${newRole}`,
      });

      await loadUsers();
      setSelectedUser(null);
    } catch (error: any) {
      console.error("Error completo al cambiar rol:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el rol",
        variant: "destructive",
      });
    }
  };

  const handleUserDeactivate = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: "876000h", // 100 años (efectivamente ban permanente)
      });

      if (error) throw error;

      toast({
        title: "Usuario desactivado",
        description: "El usuario ha sido desactivado correctamente",
      });

      await loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo desactivar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleUserActivate = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: "0",
      });

      if (error) throw error;

      toast({
        title: "Usuario activado",
        description: "El usuario ha sido activado correctamente",
      });

      await loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo activar el usuario",
        variant: "destructive",
      });
    }
  };

  const exportReport = async (format: "csv" | "json") => {
    try {
      let content = "";
      let filename = "";

      if (format === "csv") {
        const headers = ["Email", "Nombre", "Rol", "Hábitos", "Completados", "Última Actividad", "Fecha Registro"];
        const rows = filteredUsers.map(u => [
          u.email,
          u.profile?.full_name || "N/A",
          u.role || "N/A",
          u.habits_count.toString(),
          u.completions_count.toString(),
          u.last_activity ? format(new Date(u.last_activity), "dd/MM/yyyy") : "N/A",
          format(new Date(u.created_at), "dd/MM/yyyy"),
        ]);

        content = [headers, ...rows].map(row => row.join(",")).join("\n");
        filename = `reporte_usuarios_${format(new Date(), "yyyy-MM-dd")}.csv`;
      } else {
        content = JSON.stringify(filteredUsers, null, 2);
        filename = `reporte_usuarios_${format(new Date(), "yyyy-MM-dd")}.json`;
      }

      const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Reporte exportado",
        description: `El reporte se ha descargado como ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte",
        variant: "destructive",
      });
    }
  };

  if (authLoading || checkingAccess || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            {checkingAccess ? "Verificando permisos..." : "Cargando panel de administración..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar igual al principal */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
        {/* Top Navigation Bar - Desktop */}
        <div className="container border-b hidden md:block">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-6">
              <Logo size="sm" />
              <TopNav />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Badge>
              <LanguageToggle />
              <ModeToggle />
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="container border-b md:hidden">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <QuickNav />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Badge>
              <LanguageToggle />
              <ModeToggle />
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Panel Administrador</h1>
              <p className="text-sm text-muted-foreground">Gestión de usuarios y estadísticas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                // Debug: verificar rol actual (sin mostrar errores al usuario)
                try {
                  console.log("🔍 === DEBUG ROL ===");
                  console.log("User ID:", user?.id);
                  const { data: debugRole, error: debugError } = await supabase
                    .from("user_roles")
                    .select("role, user_id")
                    .eq("user_id", user?.id || "");
                  console.log("Roles desde DB:", debugRole, "Error:", debugError);
                  
                  try {
                    const { data: currentRole, error: currentRoleError } = await supabase.rpc("get_current_user_role", {});
                    console.log("get_current_user_role():", currentRole, "Error:", currentRoleError);
                  } catch (e: any) {
                    console.log("Error en get_current_user_role (ignorado):", e?.message);
                  }
                  
                  try {
                    const { data: hasAdmin, error: hasAdminError } = await supabase.rpc("has_role", {
                      _user_id: user?.id || "",
                      _role: "admin"
                    });
                    console.log("has_role('admin'):", hasAdmin, "Error:", hasAdminError);
                  } catch (e: any) {
                    console.log("Error en has_role (ignorado):", e?.message);
                  }
                  
                  console.log("Rol del hook:", role);
                  console.log("isAdmin del hook:", isAdmin);
                  await refreshRole();
                  console.log("🔍 === FIN DEBUG ===");
                } catch (e: any) {
                  console.error("Error en debug (ignorado):", e?.message);
                }
                loadData();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="mr-2 h-4 w-4" />
              Reportes
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Métricas principales */}
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Registrados en la plataforma
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Activos Hoy</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeToday}</div>
                  <p className="text-xs text-muted-foreground">
                    Con actividad hoy
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Activos Semana</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeThisWeek}</div>
                  <p className="text-xs text-muted-foreground">
                    Últimos 7 días
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Promedio Hábitos</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgHabitsPerUser}</div>
                  <p className="text-xs text-muted-foreground">
                    Por usuario
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Gráficos */}
            <section className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Actividad Diaria</CardTitle>
                  <CardDescription>Usuarios activos por día (últimos 7 días)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engagementData}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="active" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Hábitos</CardTitle>
                  <CardDescription>Distribución de tipos de hábitos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={habitsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {habitsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </section>

            {/* Estadísticas adicionales */}
            <section className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Hábitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalHabits}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Completados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCompletions}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Completación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.completionRate}%</div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          {/* Gestión de Usuarios Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestión de Usuarios</CardTitle>
                    <CardDescription>
                      Administra usuarios, roles y permisos del sistema
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportReport("csv")}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportReport("json")}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por email o nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="null">Sin rol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabla de usuarios */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="text-right">Hábitos</TableHead>
                        <TableHead className="text-right">Completados</TableHead>
                        <TableHead>Última Actividad</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No se encontraron usuarios
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => {
                          const getInitials = () => {
                            if (user.profile?.full_name) {
                              const parts = user.profile.full_name.trim().split(/\s+/);
                              if (parts.length >= 2) {
                                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                              }
                              return user.profile.full_name.charAt(0).toUpperCase();
                            }
                            return user.email.charAt(0).toUpperCase();
                          };

                          return (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.profile?.avatar_url || undefined} alt={user.profile?.full_name || user.email} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                      {getInitials()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{user.email}</span>
                                    {user.profile?.full_name && (
                                      <span className="text-xs text-muted-foreground">
                                        {user.profile.full_name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            <TableCell>
                              <Badge variant={user.role === "admin" ? "default" : user.role === "moderator" ? "secondary" : "outline"}>
                                {user.role || "Sin rol"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{user.habits_count}</TableCell>
                            <TableCell className="text-right">{user.completions_count}</TableCell>
                            <TableCell>
                              {user.last_activity ? (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(user.last_activity), "dd/MM/yyyy HH:mm")}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Nunca</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setEditingRole(user.role || "user");
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Editar Usuario</DialogTitle>
                                      <DialogDescription>
                                        Cambiar rol y permisos de {user.email}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div>
                                        <label className="text-sm font-medium">Rol</label>
                                        <Select value={editingRole} onValueChange={setEditingRole}>
                                          <SelectTrigger className="mt-2">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="moderator">Moderador</SelectItem>
                                            <SelectItem value="user">Usuario</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          className="flex-1"
                                          onClick={() => handleRoleChange(user.id, editingRole as any)}
                                        >
                                          Guardar Cambios
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                {user.email_confirmed_at ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <UserX className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Desactivar usuario?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          El usuario {user.email} será desactivado y no podrá acceder al sistema.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleUserDeactivate(user.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Desactivar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUserActivate(user.id)}
                                  >
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="text-xs text-muted-foreground">
                  Mostrando {filteredUsers.length} de {users.length} usuarios
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reportes Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reportes y Análisis</CardTitle>
                <CardDescription>
                  Genera reportes detallados y análisis de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Reporte de Usuarios</CardTitle>
                      <CardDescription>Exporta lista completa de usuarios</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => exportReport("csv")} className="flex-1">
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button variant="outline" onClick={() => exportReport("json")} className="flex-1">
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Distribución de Roles</CardTitle>
                      <CardDescription>Visualiza la distribución de roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={roleDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {roleDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Estadísticas Generales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Usuarios</p>
                        <p className="text-2xl font-bold">{stats.totalUsers}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Hábitos</p>
                        <p className="text-2xl font-bold">{stats.totalHabits}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Completados</p>
                        <p className="text-2xl font-bold">{stats.totalCompletions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tasa Completación</p>
                        <p className="text-2xl font-bold">{stats.completionRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuración Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
                <CardDescription>
                  Ajustes y configuración de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Información del Sistema</h3>
                  <div className="rounded-md border p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Versión:</span>
                        <span className="font-medium">1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Usuarios registrados:</span>
                        <span className="font-medium">{stats.totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hábitos activos:</span>
                        <span className="font-medium">{stats.totalHabits}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Acciones Rápidas</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={loadData}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Actualizar Datos
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/app")}>
                      <Home className="mr-2 h-4 w-4" />
                      Ir al Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
