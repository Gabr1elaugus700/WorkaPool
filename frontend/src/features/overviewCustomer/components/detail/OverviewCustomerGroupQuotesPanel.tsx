import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useOverviewCustomerGroupQuotes } from "../../hooks/useOverviewCustomerGroupQuotes";
import { isOverviewCustomerForbiddenMessage } from "../../utils/overviewCustomerForbidden.utils";
import { isOverviewCustomerGroupQuotesRevealRole } from "../../utils/overviewCustomerGroupQuoteBadge.utils";
import {
  filterOverviewCustomerGroupQuoteRowsBySearchAndSeller,
  filterOverviewCustomerGroupQuoteRowsByStatus,
  listOverviewCustomerGroupQuoteSellerOptions,
  summarizeOverviewCustomerGroupQuoteStatusCounts,
  type OverviewCustomerGroupQuoteStatusFilter,
} from "../../utils/overviewCustomerGroupQuotesFilter.utils";
import { selectVisibleOverviewCustomerGroupQuoteRows } from "../../utils/overviewCustomerGroupQuotesReveal.utils";
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
  const [search, setSearch] = useState("");
  const [codRep, setCodRep] = useState<number | null>(null);
  const [status, setStatus] =
    useState<OverviewCustomerGroupQuoteStatusFilter>("todas");

  useEffect(() => {
    setSelectedProductCode(null);
    setRevealVisible(false);
    setSearch("");
    setCodRep(null);
    setStatus("todas");
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

  const outrosEnabled = revealAvailable && revealVisible;
  const sellerOptions = useMemo(
    () => listOverviewCustomerGroupQuoteSellerOptions(visibleRows),
    [visibleRows],
  );
  const effectiveCodRep = sellerOptions.some((option) => option.codRep === codRep)
    ? codRep
    : null;
  const effectiveStatus =
    status === "outros" && !outrosEnabled ? "todas" : status;

  const searchedRows = useMemo(
    () =>
      filterOverviewCustomerGroupQuoteRowsBySearchAndSeller(visibleRows, {
        search,
        codRep: effectiveCodRep,
      }),
    [visibleRows, search, effectiveCodRep],
  );
  const statusCounts = useMemo(
    () => summarizeOverviewCustomerGroupQuoteStatusCounts(searchedRows),
    [searchedRows],
  );
  const rows = useMemo(
    () => filterOverviewCustomerGroupQuoteRowsByStatus(searchedRows, effectiveStatus),
    [searchedRows, effectiveStatus],
  );

  const errorMessage =
    query.error instanceof Error ? query.error.message : "";

  if (query.isError && isOverviewCustomerForbiddenMessage(errorMessage)) {
    return <OverviewCustomerAccessDeniedState />;
  }

  const products = query.data?.products ?? [];
  const resolvedSelected =
    selectedProductCode ?? query.data?.selectedProductCode ?? null;
  const selectedProduct =
    products.find((product) => product.productCode === resolvedSelected) ??
    null;
  const isInitialLoading =
    query.isLoading && query.data == null && !query.isPlaceholderData;

  return (
    <OverviewCustomerGroupQuoteColumn
      products={products}
      selectedProductCode={resolvedSelected}
      selectedProductName={selectedProduct?.productName ?? null}
      rows={rows}
      hasUnfilteredRows={visibleRows.length > 0}
      filtersToolbar={
        <OverviewCustomerGroupQuoteFiltersToolbar
          search={search}
          codRep={effectiveCodRep}
          status={effectiveStatus}
          sellerOptions={sellerOptions}
          counts={statusCounts}
          outrosEnabled={outrosEnabled}
          onSearchChange={setSearch}
          onSellerChange={setCodRep}
          onStatusChange={setStatus}
        />
      }
      isLoading={isInitialLoading}
      isError={query.isError && query.data == null}
      revealAvailable={revealAvailable}
      reveal={revealVisible}
      onProductChange={(productCode) => {
        setSelectedProductCode(productCode);
        setSearch("");
        setCodRep(null);
        setStatus("todas");
      }}
      onRevealChange={(nextReveal) => {
        setRevealVisible(nextReveal);
        if (!nextReveal) {
          setStatus((current) => (current === "outros" ? "todas" : current));
        }
      }}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
