import { Calendar, BookOpen, BarChart3, User, Shield, TrendingUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

export const BottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  // Si es admin, mostrar Admin primero
  const navItems = isAdmin
    ? [
        { href: "/admin", icon: Shield, label: "Admin" },
        { href: "/app", icon: Calendar, label: t("navToday") },
        { href: "/journey", icon: BookOpen, label: t("navJourney") },
        { href: "/history", icon: BarChart3, label: t("navHistory") },
        { href: "/statistics", icon: TrendingUp, label: t("navStatistics") },
        { href: "/profile", icon: User, label: t("navProfile") },
      ]
    : [
        { href: "/app", icon: Calendar, label: t("navToday") },
        { href: "/journey", icon: BookOpen, label: t("navJourney") },
        { href: "/history", icon: BarChart3, label: t("navHistory") },
        { href: "/statistics", icon: TrendingUp, label: t("navStatistics") },
        { href: "/profile", icon: User, label: t("navProfile") },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur shadow-lg md:hidden">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href === "/app" && location.pathname === "/");
          return (
            <Link 
              key={item.href} 
              to={item.href} 
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all min-w-[60px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-md transition-colors",
                isActive ? "bg-primary/20" : ""
              )}>
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              </div>
              <span className={cn("font-medium text-[10px] leading-tight", isActive && "text-primary font-semibold")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};