import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  level: number;
  description: string;
  isUnlocked: boolean;
}

export const AchievementBadge = ({ level, description, isUnlocked }: AchievementBadgeProps) => {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className={cn(
          "relative flex h-20 w-20 items-center justify-center rounded-full",
          isUnlocked
            ? "bg-gradient-to-br from-yellow-400 to-orange-500"
            : "bg-muted"
        )}
      >
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full",
            isUnlocked ? "bg-white/20" : "bg-muted-foreground/10"
          )}
        >
          <Target
            className={cn(
              "h-8 w-8",
              isUnlocked ? "text-white" : "text-muted-foreground/50"
            )}
          />
          <span
            className={cn(
              "absolute bottom-2 text-lg font-bold",
              isUnlocked ? "text-white" : "text-muted-foreground/50"
            )}
          >
            {level}
          </span>
        </div>
        {isUnlocked && (
          <div className="absolute -top-1 -right-1">
            <span className="text-xl">🎯</span>
          </div>
        )}
      </div>
      <p
        className={cn(
          "text-xs font-medium max-w-[100px]",
          isUnlocked ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {description}
      </p>
    </div>
  );
};
