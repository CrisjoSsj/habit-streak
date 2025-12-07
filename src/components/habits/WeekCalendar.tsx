import { useMemo } from "react";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeekCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const WeekCalendar = ({ selectedDate, onSelectDate }: WeekCalendarProps) => {
  const { language } = useLanguage();
  const locale = language === "es" ? es : enUS;

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  return (
    <div className="flex items-center justify-between gap-1 py-4">
      {weekDays.map((day) => {
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);

        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors min-w-[40px]",
              isSelected
                ? "bg-primary text-primary-foreground"
                : isTodayDate
                ? "bg-muted"
                : "hover:bg-muted/50"
            )}
          >
            <span className="text-[10px] font-medium uppercase">
              {format(day, "EEE", { locale }).slice(0, 3)}
            </span>
            <span className={cn("text-lg font-semibold", isSelected && "text-primary-foreground")}>
              {format(day, "d")}
            </span>
            {isSelected && (
              <div className="h-0.5 w-4 rounded-full bg-primary-foreground" />
            )}
          </button>
        );
      })}
    </div>
  );
};
