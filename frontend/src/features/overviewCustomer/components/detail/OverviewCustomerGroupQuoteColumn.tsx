import { Button } from "@/components/ui/button";
import type {
  OverviewCustomerGroupQuoteProductOption,
  OverviewCustomerGroupQuoteRow,
} from "../../types/overviewCustomerGroupQuotes.types";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerGroupQuoteProductSelector } from "./OverviewCustomerGroupQuoteProductSelector";
import { OverviewCustomerGroupQuoteRowView } from "./OverviewCustomerGroupQuoteRow";
import { OverviewCustomerSectionCardSkeleton } from "./OverviewCustomerSectionCardSkeleton";

export const OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_PRODUCTS =
  "Nenhum produto deste grupo para este cliente.";
export const OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_ROWS =
  "Nenhuma cotação deste produto nos últimos 12 dias.";
export const OVERVIEW_CUSTOMER_GROUP_QUOTES_ERROR =
  "Não foi possível carregar as cotações deste grupo.";
export const OVERVIEW_CUSTOMER_GROUP_QUOTES_REVEAL_ON =
  "Revelar cotações de outros vendedores";
export const OVERVIEW_CUSTOMER_GROUP_QUOTES_REVEAL_OFF =
  "Ocultar cotações de outros vendedores";

export type OverviewCustomerGroupQuoteColumnProps = {
  products: OverviewCustomerGroupQuoteProductOption[];
  selectedProductCode: string | null;
  selectedProductName: string | null;
  rows: OverviewCustomerGroupQuoteRow[];
  isLoading: boolean;
  isError: boolean;
  revealAvailable: boolean;
  reveal: boolean;
  onProductChange: (productCode: string) => void;
  onRevealChange: (reveal: boolean) => void;
  onRetry: () => void;
};

export function OverviewCustomerGroupQuoteColumn({
  products,
  selectedProductCode,
  selectedProductName,
  rows,
  isLoading,
  isError,
  revealAvailable,
  reveal,
  onProductChange,
  onRevealChange,
  onRetry,
}: OverviewCustomerGroupQuoteColumnProps) {
  if (isLoading) {
    return (
      <OverviewCustomerSectionCardSkeleton
        title="Cotações do produto"
        description="Carregando cotações do grupo selecionado."
        skeletonClassName="h-40"
        loadingLabel="Carregando cotações do grupo."
      />
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-card p-4">
        <OverviewCustomerStateMessage
          message={OVERVIEW_CUSTOMER_GROUP_QUOTES_ERROR}
          tone="destructive"
        />
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <OverviewCustomerStateMessage
        message={OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_PRODUCTS}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <OverviewCustomerGroupQuoteProductSelector
          products={products}
          selectedProductCode={selectedProductCode}
          onProductChange={onProductChange}
        />
        {revealAvailable ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onRevealChange(!reveal);
            }}
          >
            {reveal
              ? OVERVIEW_CUSTOMER_GROUP_QUOTES_REVEAL_OFF
              : OVERVIEW_CUSTOMER_GROUP_QUOTES_REVEAL_ON}
          </Button>
        ) : null}
      </div>

      {selectedProductCode ? (
        <header className="space-y-0.5 border-b border-border/60 pb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Produto selecionado
          </p>
          <h3 className="text-base font-semibold tracking-wide text-foreground">
            <span className="tabular-nums text-primary">{selectedProductCode}</span>
            {selectedProductName ? (
              <span className="text-foreground"> — {selectedProductName}</span>
            ) : null}
          </h3>
        </header>
      ) : null}

      {rows.length === 0 ? (
        <OverviewCustomerStateMessage
          message={OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_ROWS}
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => (
            <OverviewCustomerGroupQuoteRowView
              key={`${row.orderNumber}-${row.productCode}-${row.issuedAt}-${index}`}
              row={row}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
