import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Plus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const locale = language === "es" ? es : enUS;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex items-center justify-between py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {date && (
            <p className="text-sm text-muted-foreground">
              {format(date, "d MMM", { locale })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ModeToggle />
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
