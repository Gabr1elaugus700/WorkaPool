import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useOverviewCustomerGroupQuotes } from "../../hooks/useOverviewCustomerGroupQuotes";
import { isOverviewCustomerForbiddenMessage } from "../../utils/overviewCustomerForbidden.utils";
import { isOverviewCustomerGroupQuotesRevealRole } from "../../utils/overviewCustomerGroupQuoteBadge.utils";
import { summarizeOverviewCustomerGroupQuoteBenchmark } from "../../utils/overviewCustomerGroupQuotesBenchmark.utils";
import {
  applyOverviewCustomerGroupQuoteFilters,
  OVERVIEW_CUSTOMER_GROUP_QUOTE_DEFAULT_FILTERS,
  summarizeOverviewCustomerGroupQuoteStatusCounts,
} from "../../utils/overviewCustomerGroupQuotesFilter.utils";
import {
  countOverviewCustomerGroupQuoteOtherCustomerRows,
  selectVisibleOverviewCustomerGroupQuoteRows,
} from "../../utils/overviewCustomerGroupQuotesReveal.utils";
import { OverviewCustomerAccessDeniedState } from "../OverviewCustomerAccessDeniedState";
import { OverviewCustomerGroupQuoteColumn } from "./OverviewCustomerGroupQuoteColumn";
import { OverviewCustomerGroupQuoteFiltersToolbar } from "./OverviewCustomerGroupQuoteFiltersToolbar";

export type OverviewCustomerGroupQuotesPanelProps = {
  customerCode: number;
  grupoCodigo: string | null;
  enabled?: boolean;
};

export function OverviewCustomerGroupQuotesPanel({
  customerCode,
  grupoCodigo,
  enabled = true,
}: OverviewCustomerGroupQuotesPanelProps) {
  const { user } = useAuth();
  const revealAvailable = isOverviewCustomerGroupQuotesRevealRole(user?.role);
  const [selectedProductCode, setSelectedProductCode] = useState<string | null>(
    null,
  );
  const [revealVisible, setRevealVisible] = useState(false);
  const [filters, setFilters] = useState(
    OVERVIEW_CUSTOMER_GROUP_QUOTE_DEFAULT_FILTERS,
  );

  useEffect(() => {
    setSelectedProductCode(null);
    setRevealVisible(false);
    setFilters(OVERVIEW_CUSTOMER_GROUP_QUOTE_DEFAULT_FILTERS);
  }, [customerCode, grupoCodigo]);

  const query = useOverviewCustomerGroupQuotes(customerCode, grupoCodigo, {
    productCode: selectedProductCode,
    includeOtherCustomers: revealAvailable,
    enabled: enabled && grupoCodigo != null,
  });

  useEffect(() => {
    const apiSelected = query.data?.selectedProductCode ?? null;
    if (apiSelected != null && selectedProductCode == null) {
      setSelectedProductCode(apiSelected);
    }
  }, [query.data?.selectedProductCode, selectedProductCode]);

  const allRows = query.data?.rows;
  const visibleRows = useMemo(
    () =>
      selectVisibleOverviewCustomerGroupQuoteRows(allRows ?? [], {
        revealAvailable,
        revealVisible,
      }),
    [allRows, revealAvailable, revealVisible],
  );
  const summaryCounts = useMemo(
    () => summarizeOverviewCustomerGroupQuoteStatusCounts(visibleRows),
    [visibleRows],
  );
  const otherCustomerCount = useMemo(
    () => countOverviewCustomerGroupQuoteOtherCustomerRows(allRows ?? []),
    [allRows],
  );

  const outrosEnabled = revealAvailable && revealVisible;
  const filtered = useMemo(
    () =>
      applyOverviewCustomerGroupQuoteFilters(visibleRows, filters, {
        outrosEnabled,
      }),
    [visibleRows, filters, outrosEnabled],
  );
  const benchmark = useMemo(
    () => summarizeOverviewCustomerGroupQuoteBenchmark(filtered.rows),
    [filtered.rows],
  );

  const errorMessage =
    query.error instanceof Error ? query.error.message : "";

  if (query.isError && isOverviewCustomerForbiddenMessage(errorMessage)) {
    return <OverviewCustomerAccessDeniedState />;
  }

  const products = query.data?.products ?? [];
  const resolvedSelected =
    selectedProductCode ?? query.data?.selectedProductCode ?? null;
  const isInitialLoading =
    query.isLoading && query.data == null && !query.isPlaceholderData;

  return (
    <OverviewCustomerGroupQuoteColumn
      products={products}
      selectedProductCode={resolvedSelected}
      rows={filtered.rows}
      benchmark={benchmark}
      summaryCounts={summaryCounts}
      otherCustomerCount={otherCustomerCount}
      hasUnfilteredRows={visibleRows.length > 0}
      filtersToolbar={
        <OverviewCustomerGroupQuoteFiltersToolbar
          filters={filtered.filters}
          sellerOptions={filtered.sellerOptions}
          counts={filtered.counts}
          outrosEnabled={outrosEnabled}
          onFiltersChange={(patch) => {
            setFilters((current) => ({ ...current, ...patch }));
          }}
        />
      }
      isLoading={isInitialLoading}
      isError={query.isError && query.data == null}
      revealAvailable={revealAvailable}
      reveal={revealVisible}
      onProductChange={(productCode) => {
        setSelectedProductCode(productCode);
        setFilters(OVERVIEW_CUSTOMER_GROUP_QUOTE_DEFAULT_FILTERS);
      }}
      onRevealChange={(nextReveal) => {
        setRevealVisible(nextReveal);
        if (!nextReveal) {
          setFilters((current) =>
            current.status === "outros" ? { ...current, status: "todas" } : current,
          );
        }
      }}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
