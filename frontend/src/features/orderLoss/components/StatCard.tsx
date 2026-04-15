import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  iconBgColor: "blue" | "yellow" | "red";
  title: string;
  value: string | number;
  subtitle: string;
}

const iconBgClasses = {
  blue: "bg-blue-50 border-blue-300 text-blue-700",
  yellow: "bg-yellow-50 border-yellow-300 text-yellow-700",
  red: "bg-destructive/10 text-destructive",
};

export function StatCard({
  icon: Icon,
  iconBgColor,
  title,
  value,
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-card rounded-xl p-5 card-shadow-lg border border-border/50 flex items-center gap-4 hover:border-border transition-colors">
      <div
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center",
          iconBgClasses[iconBgColor]
        )}
      >
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
