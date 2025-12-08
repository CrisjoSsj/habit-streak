import { Calendar, BookOpen, BarChart3, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export const BottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { href: "/app", icon: Calendar, label: t("navToday") },
    { href: "/journey", icon: BookOpen, label: t("navJourney") },
    { href: "/history", icon: BarChart3, label: t("navHistory") },
    { href: "/profile", icon: User, label: t("navProfile") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href} className={cn("flex flex-col items-center gap-1 px-3 py-2 text-xs", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn("font-medium", isActive && "text-primary")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};