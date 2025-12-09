import { useState } from "react";
import { Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, showTagline = false, size = "md" }: LogoProps) => {
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <Link to="/app" className={cn("flex items-center gap-2 group", className)}>
      <div className={cn("flex items-center justify-center rounded-lg overflow-hidden group-hover:opacity-90 transition-opacity", sizeClasses[size])}>
        {!imageError ? (
          <img 
            src="/Egghead-removebg-preview.png" 
            alt="HabitTrack Logo" 
            className={cn("object-contain", sizeClasses[size])}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center rounded-lg bg-primary p-1.5 group-hover:bg-primary/90 transition-colors">
            <Target className={cn(iconSizeClasses[size], "text-primary-foreground")} />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <span className={cn("font-bold tracking-tight text-primary group-hover:text-primary/90 transition-colors", textSizeClasses[size])}>
          {t("brand")}
        </span>
        {showTagline && (
          <span className="text-[10px] text-muted-foreground leading-tight">
            {t("tagline")}
          </span>
        )}
      </div>
    </Link>
  );
};

