import { Calendar, BookOpen, BarChart3, Shield, TrendingUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

export const TopNav = () => {
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

  const isActive = (href: string) => {
    return location.pathname === href || (href === "/app" && location.pathname === "/");
  };

  return (
    <nav className="hidden md:flex items-center gap-1">
      {/* Grupo Admin - si es admin */}
      {isAdmin && adminItems.length > 0 && (
        <>
          {adminItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </>
      )}

      {/* Grupo Principal */}
      {mainNavItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            isActive(item.href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

