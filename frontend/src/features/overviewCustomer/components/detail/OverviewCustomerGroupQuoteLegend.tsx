const ITEMS = [
  { label: "Ganha", swatch: "border-primary/40 bg-primary/15" },
  { label: "Perdida", swatch: "border-destructive/40 bg-destructive/15" },
  { label: "Outro vendedor", swatch: "border-border/60 bg-muted/40" },
];

export function OverviewCustomerGroupQuoteLegend() {
  return (
    <ul
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
      aria-label="Legenda de cores"
    >
      {ITEMS.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-sm border ${item.swatch}`} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
