import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

export const UserMenu = () => {
  const { user, role, signOut, fullName: authFullName } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
          setFullName(authFullName || user.email?.split("@")[0] || "Usuario");
          return;
        }

        if (data?.full_name) {
          setFullName(data.full_name);
        } else if (authFullName) {
          setFullName(authFullName);
        } else {
          // Si no hay nombre completo, usar el email
          setFullName(user.email?.split("@")[0] || "Usuario");
        }

        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setFullName(authFullName || user.email?.split("@")[0] || "Usuario");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authFullName]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getDisplayName = () => {
    if (fullName) {
      // Truncar si es muy largo
      if (fullName.length > 20) {
        return fullName.substring(0, 17) + "...";
      }
      return fullName;
    }
    return user?.email?.split("@")[0] || "Usuario";
  };

  if (loading || !user) {
    return null;
  }

  const getInitials = () => {
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return fullName.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-all hover:bg-background hover:text-foreground text-foreground">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} alt={fullName || "Usuario"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{getDisplayName()}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {role === "admin" && (
          <>
            <DropdownMenuItem onClick={() => navigate("/admin")}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Panel Administrativo</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

