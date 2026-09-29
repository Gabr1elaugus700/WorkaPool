import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type {
  OverviewCustomerGroupQuoteProductOption,
  OverviewCustomerGroupQuoteRow,
} from "../../types/overviewCustomerGroupQuotes.types";
import type { OverviewCustomerGroupQuoteStatusCounts } from "../../utils/overviewCustomerGroupQuotesFilter.utils";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerGroupQuoteLegend } from "./OverviewCustomerGroupQuoteLegend";
import { OverviewCustomerGroupQuoteProductChips } from "./OverviewCustomerGroupQuoteProductChips";
import {
  OVERVIEW_CUSTOMER_GROUP_QUOTES_TITLE,
  OverviewCustomerGroupQuotesHeader,
} from "./OverviewCustomerGroupQuotesHeader";
import { OverviewCustomerGroupQuotesTable } from "./OverviewCustomerGroupQuotesTable";
import { OverviewCustomerSectionCardSkeleton } from "./OverviewCustomerSectionCardSkeleton";

export const OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_PRODUCTS =
  "Nenhum produto deste grupo para este cliente.";
export const OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_ROWS =
  "Nenhuma cotação deste produto nos últimos 12 dias.";
export const OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_FILTERED =
  "Nenhuma cotação corresponde aos filtros.";
export const OVERVIEW_CUSTOMER_GROUP_QUOTES_ERROR =
  "Não foi possível carregar as cotações deste grupo.";

export type OverviewCustomerGroupQuoteColumnProps = {
  products: OverviewCustomerGroupQuoteProductOption[];
  selectedProductCode: string | null;
  rows: OverviewCustomerGroupQuoteRow[];
  summaryCounts: OverviewCustomerGroupQuoteStatusCounts;
  otherCustomerCount: number;
  hasUnfilteredRows?: boolean;
  filtersToolbar?: ReactNode;
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
  rows,
  summaryCounts,
  otherCustomerCount,
  hasUnfilteredRows = rows.length > 0,
  filtersToolbar = null,
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
        title={OVERVIEW_CUSTOMER_GROUP_QUOTES_TITLE}
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
      <OverviewCustomerGroupQuotesHeader
        summaryCounts={summaryCounts}
        otherCustomerCount={otherCustomerCount}
        revealAvailable={revealAvailable}
        reveal={reveal}
        onRevealChange={onRevealChange}
      />

      <OverviewCustomerGroupQuoteProductChips
        products={products}
        selectedProductCode={selectedProductCode}
        onProductChange={onProductChange}
      />

      <OverviewCustomerGroupQuoteLegend />

      {hasUnfilteredRows ? filtersToolbar : null}

      {rows.length === 0 ? (
        <OverviewCustomerStateMessage
          message={
            hasUnfilteredRows
              ? OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_FILTERED
              : OVERVIEW_CUSTOMER_GROUP_QUOTES_EMPTY_ROWS
          }
        />
      ) : (
        <OverviewCustomerGroupQuotesTable rows={rows} />
      )}
    </div>
  );
}
