import { Sun, Sunset, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type TimeOfDay = "all" | "morning" | "afternoon" | "night";

interface TimeFilterProps {
  selected: TimeOfDay;
  onSelect: (time: TimeOfDay) => void;
}

export const TimeFilter = ({ selected, onSelect }: TimeFilterProps) => {
  const { t } = useLanguage();

  const filters: { id: TimeOfDay; label: string; icon?: React.ReactNode }[] = [
    { id: "all", label: t("all") },
    { id: "morning", label: t("morning"), icon: <Sun className="h-3.5 w-3.5" /> },
    { id: "afternoon", label: t("afternoon"), icon: <Sunset className="h-3.5 w-3.5" /> },
    { id: "night", label: t("night"), icon: <Moon className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onSelect(filter.id)}
          className={cn(
            "flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
            selected === filter.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          {filter.icon}
          {filter.label}
        </button>
      ))}
    </div>
  );
};