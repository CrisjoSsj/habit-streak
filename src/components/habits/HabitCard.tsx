import { useState } from "react";
import { Check, MoreHorizontal, Coffee, Pause, Play, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { getHabitIcon } from "@/lib/habitIcons";
import { hexToRgba } from "@/lib/utils";

interface HabitCardProps {
  id: string;
  name: string;
  icon: string;
  color: string;
  habitType: "check" | "count" | "timer";
  goalCount?: number;
  goalMinutes?: number;
  currentProgress: number;
  timerSeconds: number;
  isTimerRunning: boolean;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onAddProgress: (amount: number) => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onRestDay: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isToday?: boolean;
  periodProgress?: { current: number; goal: number; periodLabel: string } | null;
}

export const HabitCard = ({
  name,
  icon,
  color,
  habitType,
  goalCount = 1,
  goalMinutes = 10,
  currentProgress,
  timerSeconds,
  isTimerRunning,
  isCompleted,
  onToggleComplete,
  onAddProgress,
  onToggleTimer,
  onResetTimer,
  onRestDay,
  onEdit,
  onDelete,
  isToday = true,
  periodProgress,
}: HabitCardProps) => {
  const { t } = useLanguage();
  const [showCountPicker, setShowCountPicker] = useState(false);
  const HabitIcon = getHabitIcon(icon);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressText = () => {
    // Mostrar progreso del período si existe
    if (periodProgress) {
      return `${periodProgress.current} / ${periodProgress.goal} ${periodProgress.periodLabel}`;
    }
    
    if (habitType === "timer") {
      return `${Math.floor(timerSeconds / 60)} / ${goalMinutes} ${t("min")}`;
    }
    if (habitType === "count") {
      return `${currentProgress} / ${goalCount} ${t("reps")}`;
    }
    return isCompleted ? t("completed") : "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <button
          onClick={isToday ? onToggleComplete : undefined}
          disabled={!isToday}
          className={cn(
            "mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30 hover:border-primary",
            !isToday && "opacity-50 cursor-not-allowed"
          )}
        >
          {isCompleted && <Check className="h-3.5 w-3.5" />}
        </button>

        <div 
          className={cn(
            "flex-1 rounded-xl p-4 transition-opacity",
            isCompleted && "opacity-60"
          )}
          style={{ backgroundColor: hexToRgba(color || "#3B82F6", 0.2) }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div 
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: color || "#3B82F6" }}
              >
                <HabitIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{name}</h3>
                <p className="text-sm text-muted-foreground">
                  {isCompleted ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" /> {t("completed")}
                    </span>
                  ) : progressText()}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-foreground/80 hover:text-foreground hover:bg-foreground/10 shrink-0 transition-all"
                >
                  <MoreHorizontal className="h-5 w-5 stroke-[2]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={isToday ? onRestDay : undefined}
                  disabled={!isToday}
                  className={!isToday ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <Coffee className="mr-2 h-4 w-4" />
                  {t("restDay")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Check className="mr-2 h-4 w-4" />
                  {t("edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("delete")}
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("deleteHabit")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("deleteHabitDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {!isCompleted && isToday && (
        <div className="ml-9 flex flex-wrap gap-2">
          {habitType === "timer" && (
            <>
              <Button variant="secondary" className="flex-1 gap-2" onClick={onToggleTimer}>
                {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {formatTimer(timerSeconds)}
              </Button>
              <Button variant="secondary" size="icon" onClick={onResetTimer}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={onToggleComplete}>
                <Check className="h-4 w-4" />
                {t("finish")}
              </Button>
            </>
          )}

          {habitType === "count" && (
            <>
              <Button variant="secondary" className="min-w-[100px]" onClick={() => setShowCountPicker(!showCountPicker)}>
                {currentProgress} / {goalCount}
              </Button>
              <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={() => onAddProgress(1)}>
                {t("finish")} +1
              </Button>
              <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={() => onAddProgress(goalCount - currentProgress)}>
                <Check className="h-4 w-4" />
                {t("finishAll")}
              </Button>
            </>
          )}

          {habitType === "check" && (
            <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={onToggleComplete}>
              <Check className="h-4 w-4" />
              {t("finish")}
            </Button>
          )}
        </div>
      )}
      
      {!isToday && (
        <div className="ml-9 mt-2 text-sm text-muted-foreground">
          {t("onlyTodayCheckIn")}
        </div>
      )}
    </div>
  );
};