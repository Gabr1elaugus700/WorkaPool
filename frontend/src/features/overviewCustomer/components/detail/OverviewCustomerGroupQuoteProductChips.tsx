import { cn } from "@/lib/utils";
import type { OverviewCustomerGroupQuoteProductOption } from "../../types/overviewCustomerGroupQuotes.types";

type OverviewCustomerGroupQuoteProductChipsProps = {
  products: OverviewCustomerGroupQuoteProductOption[];
  selectedProductCode: string | null;
  onProductChange: (productCode: string) => void;
};

export function OverviewCustomerGroupQuoteProductChips({
  products,
  selectedProductCode,
  onProductChange,
}: OverviewCustomerGroupQuoteProductChipsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Insumo
      </span>
      <div
        role="tablist"
        aria-label="Produtos do grupo"
        className="flex flex-wrap gap-2"
      >
        {products.map((product) => {
          const isSelected = product.productCode === selectedProductCode;

          return (
            <button
              key={product.productCode}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
              onClick={() => onProductChange(product.productCode)}
            >
              <span className="tabular-nums font-semibold">{product.productCode}</span>
              {product.productName ? <span>{product.productName}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
