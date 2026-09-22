import React from "react";
import type { OverviewCustomerGroupQuoteProductOption } from "../../types/overviewCustomerGroupQuotes.types";

type OverviewCustomerGroupQuoteProductSelectorProps = {
  products: OverviewCustomerGroupQuoteProductOption[];
  selectedProductCode: string | null;
  onProductChange: (productCode: string) => void;
  disabled?: boolean;
};

export function OverviewCustomerGroupQuoteProductSelector({
  products,
  selectedProductCode,
  onProductChange,
  disabled = false,
}: OverviewCustomerGroupQuoteProductSelectorProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Produto
      </span>
      <select
        className="h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        value={selectedProductCode ?? ""}
        disabled={disabled}
        onChange={(event) => {
          onProductChange(event.target.value);
        }}
        aria-label="Selecionar produto do grupo"
      >
        {products.map((product) => (
          <option key={product.productCode} value={product.productCode}>
            {product.productCode}
            {product.productName ? ` — ${product.productName}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
