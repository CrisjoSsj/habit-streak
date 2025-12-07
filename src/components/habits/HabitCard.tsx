import { useState } from "react";
import { Check, MoreHorizontal, Coffee, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

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
}

export const HabitCard = ({
  name,
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
}: HabitCardProps) => {
  const { translations } = useLanguage();
  const [showCountPicker, setShowCountPicker] = useState(false);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressText = () => {
    if (habitType === "timer") {
      return `${Math.floor(timerSeconds / 60)} / ${goalMinutes} ${translations.common.min}`;
    }
    if (habitType === "count") {
      return `${currentProgress} / ${goalCount} ${translations.common.reps}`;
    }
    return isCompleted ? translations.dashboard.completed : "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <button
          onClick={onToggleComplete}
          className={cn(
            "mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30 hover:border-primary"
          )}
        >
          {isCompleted && <Check className="h-3.5 w-3.5" />}
        </button>

        <div className={cn("flex-1 rounded-xl p-4 transition-opacity bg-primary", isCompleted && "opacity-60")}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                <span className="text-xl">😊</span>
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">{name}</h3>
                <p className="text-sm text-primary-foreground/80">
                  {isCompleted ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" /> {translations.dashboard.completed}
                    </span>
                  ) : progressText()}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onRestDay}>
                  <Coffee className="mr-2 h-4 w-4" />
                  {translations.dashboard.restDay}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Check className="mr-2 h-4 w-4" />
                  {translations.dashboard.edit}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {!isCompleted && (
        <div className="ml-9 flex gap-2">
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
                {translations.dashboard.finish}
              </Button>
            </>
          )}

          {habitType === "count" && (
            <>
              <Button variant="secondary" className="min-w-[100px]" onClick={() => setShowCountPicker(!showCountPicker)}>
                {currentProgress} / {goalCount}
              </Button>
              <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={() => onAddProgress(1)}>
                {translations.dashboard.finish} 1
              </Button>
              <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={() => onAddProgress(goalCount - currentProgress)}>
                <Check className="h-4 w-4" />
                {translations.dashboard.finishAll}
              </Button>
            </>
          )}

          {habitType === "check" && (
            <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={onToggleComplete}>
              <Check className="h-4 w-4" />
              {translations.dashboard.finish}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
