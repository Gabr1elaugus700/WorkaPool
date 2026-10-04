import { cn } from "@/lib/utils";

type OverviewCustomerGroupQuoteRevealToggleProps = {
  otherCustomerCount: number;
  reveal: boolean;
  onRevealChange: (reveal: boolean) => void;
};

const OPTIONS = [
  { value: true, label: "Visíveis" },
  { value: false, label: "Ocultos" },
];

export function OverviewCustomerGroupQuoteRevealToggle({
  otherCustomerCount,
  reveal,
  onRevealChange,
}: OverviewCustomerGroupQuoteRevealToggleProps) {
  return (
    <div className="inline-flex items-center gap-2 text-xs">
      <span className="font-medium text-muted-foreground">
        Outros Vendedores (<span className="tabular-nums">{otherCustomerCount}</span>):
      </span>
      <div
        role="group"
        aria-label="Exibir cotações de outros vendedores"
        className="inline-flex rounded-md border border-border p-0.5"
      >
        {OPTIONS.map((option) => {
          const isActive = option.value === reveal;
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={isActive}
              className={cn(
                "rounded px-2.5 py-1 font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => {
                if (!isActive) {
                  onRevealChange(option.value);
                }
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
