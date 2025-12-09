import { Calendar, BookOpen, BarChart3, User, Shield, Menu, TrendingUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const QuickNav = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  // Separar opciones en grupos
  const adminItems = isAdmin
    ? [{ href: "/admin", icon: Shield, label: "Admin" }]
    : [];

  const mainNavItems = [
    { href: "/app", icon: Calendar, label: t("navToday") },
    { href: "/journey", icon: BookOpen, label: t("navJourney") },
    { href: "/history", icon: BarChart3, label: t("navHistory") },
    { href: "/statistics", icon: TrendingUp, label: t("navStatistics") },
  ];

  const profileItem = { href: "/profile", icon: User, label: t("navProfile") };

  const isActive = (href: string) => {
    return location.pathname === href || (href === "/app" && location.pathname === "/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Menu className="h-4 w-4" />
          <span className="hidden sm:inline">Menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Admin Section */}
        {isAdmin && adminItems.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Administración
            </div>
            {adminItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 w-full",
                    isActive(item.href) && "bg-primary text-primary-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Main Navigation */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Navegación
        </div>
        {mainNavItems.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link
              to={item.href}
              className={cn(
                "flex items-center gap-2 w-full",
                isActive(item.href) && "bg-primary text-primary-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Profile */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Cuenta
        </div>
        <DropdownMenuItem asChild>
          <Link
            to={profileItem.href}
            className={cn(
              "flex items-center gap-2 w-full",
              isActive(profileItem.href) && "bg-primary text-primary-foreground"
            )}
          >
            <profileItem.icon className="h-4 w-4" />
            <span>{profileItem.label}</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

