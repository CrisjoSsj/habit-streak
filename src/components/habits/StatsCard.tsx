import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "blue" | "red" | "yellow" | "green";
  className?: string;
}

const variantStyles = {
  blue: "bg-blue-500 text-white",
  red: "bg-red-500 text-white",
  yellow: "bg-yellow-500 text-white",
  green: "bg-green-500 text-white",
};

export const StatsCard = ({
  title,
  value,
  subtitle,
  variant = "blue",
  className,
}: StatsCardProps) => {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl p-4 min-w-[140px]",
        variantStyles[variant],
        className
      )}
    >
      <span className="text-xs font-semibold uppercase opacity-90">{title}</span>
      <span className="text-3xl font-bold">{value}</span>
      {subtitle && <span className="text-xs opacity-80">{subtitle}</span>}
    </div>
  );
};
