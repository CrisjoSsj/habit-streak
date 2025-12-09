import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Plus, Share2, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { TopNav } from "@/components/layout/TopNav";
import { QuickNav } from "@/components/layout/QuickNav";
import { Logo } from "@/components/layout/Logo";
import { UserMenu } from "@/components/layout/UserMenu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  title: string;
  date?: Date;
  showAddButton?: boolean;
  showShareButton?: boolean;
  onAdd?: () => void;
  onShare?: () => void;
}

export const AppHeader = ({
  title,
  date,
  showAddButton,
  showShareButton,
  onAdd,
  onShare,
}: AppHeaderProps) => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const locale = language === "es" ? es : enUS;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      {/* Top Navigation Bar - Desktop */}
      <div className="container border-b hidden md:block">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-6">
            <Logo size="sm" />
            <TopNav />
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Badge variant="default" className="text-xs">
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Badge>
            )}
            <LanguageToggle />
            <ModeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Mobile: Logo y Quick Navigation */}
          <div className="md:hidden flex items-center gap-2">
            <Logo size="sm" />
            <QuickNav />
          </div>
          
          {/* Desktop: Título de página */}
          <div className="hidden md:flex items-center gap-3 flex-1">
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Admin</span>
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h1>
              {date && (
                <p className="text-sm text-muted-foreground">
                  {format(date, "d MMM", { locale })}
                </p>
              )}
            </div>
          </div>

          {/* Mobile: Título de página */}
          <div className="md:hidden flex-1 ml-2">
            <h1 className="text-lg font-bold tracking-tight">{title}</h1>
            {date && (
              <p className="text-xs text-muted-foreground">
                {format(date, "d MMM", { locale })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showShareButton && (
            <Button variant="ghost" size="icon" onClick={onShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          )}
          {showAddButton && (
            <Button
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={onAdd}
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
