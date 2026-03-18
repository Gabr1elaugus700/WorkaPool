interface CapacityBarProps {
  usedKg: number;
  capacityKg: number;
}

export function CapacityBar({ usedKg, capacityKg }: CapacityBarProps) {
  const pct = Math.min((usedKg / capacityKg) * 100, 100);
  const overload = usedKg > capacityKg;

  const barColor = overload
    ? "bg-progress-bar-danger"
    : pct > 80
    ? "bg-progress-bar-warning"
    : "bg-progress-bar";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {usedKg.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} /{" "}
          {capacityKg.toLocaleString("pt-BR")} kg
        </span>
        <span className={`font-bold ${overload ? "text-destructive" : "text-foreground"}`}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-progress-bar-bg overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
