interface CapacityBarProps {
  usedKg: number;
  capacityKg: number;
}

export function CapacityBar({ usedKg, capacityKg }: CapacityBarProps) {
  const rawPct = (usedKg / capacityKg) * 100;
  const pct = Math.min(rawPct, 100);
  const overload = usedKg > capacityKg;
  const availableKg = Math.max(capacityKg - usedKg, 0);
  const exceededKg = Math.max(usedKg - capacityKg, 0);

  const barColor = overload
    ? "bg-progress-bar-danger"
    : pct > 80
    ? "bg-progress-bar-warning"
    : "bg-progress-bar";

  return (
    <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Ocupacao da carga
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            overload
              ? "bg-destructive/15 text-destructive"
              : pct > 80
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {rawPct.toFixed(1)}%
        </span>
      </div>

      <div className="h-3.5 w-full overflow-hidden rounded-full bg-progress-bar-bg">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {usedKg.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} /{" "}
          {capacityKg.toLocaleString("pt-BR")} kg
        </span>
        {overload ? (
          <span className="font-semibold text-destructive">
            Excedido: {exceededKg.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} kg
          </span>
        ) : (
          <span className="font-medium text-muted-foreground">
            Disponivel: {availableKg.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} kg
          </span>
        )}
      </div>
    </div>
  );
}
