import type { OverviewCustomerGroupQuoteRow } from "../types/overviewCustomerGroupQuotes.types";

export type OverviewCustomerGroupQuoteStatusFilter =
  | "todas"
  | "ganhas"
  | "perdidas"
  | "outros";

export type OverviewCustomerGroupQuoteStatusCounts = Record<
  OverviewCustomerGroupQuoteStatusFilter,
  number
>;

export type OverviewCustomerGroupQuoteSellerOption = {
  codRep: number;
  label: string;
};

export type OverviewCustomerGroupQuoteFilters = {
  search: string;
  codRep: number | null;
  status: OverviewCustomerGroupQuoteStatusFilter;
};

export const OVERVIEW_CUSTOMER_GROUP_QUOTE_DEFAULT_FILTERS: OverviewCustomerGroupQuoteFilters =
  { search: "", codRep: null, status: "todas" };

export function filterOverviewCustomerGroupQuoteRowsBySearchAndSeller(
  rows: OverviewCustomerGroupQuoteRow[],
  filter: Pick<OverviewCustomerGroupQuoteFilters, "search" | "codRep">,
): OverviewCustomerGroupQuoteRow[] {
  const search = filter.search.replace(/[#\s]/g, "");

  return rows.filter((row) => {
    if (filter.codRep != null && row.codRep !== filter.codRep) {
      return false;
    }
    return search.length === 0 || String(row.orderNumber).includes(search);
  });
}

function matchesStatus(
  row: OverviewCustomerGroupQuoteRow,
  status: OverviewCustomerGroupQuoteStatusFilter,
): boolean {
  switch (status) {
    case "todas":
      return true;
    case "ganhas":
      return row.outcome === "ganha" && !row.otherCustomer;
    case "perdidas":
      return row.outcome === "perdida" && !row.otherCustomer;
    case "outros":
      return row.otherCustomer;
  }
}

export function filterOverviewCustomerGroupQuoteRowsByStatus(
  rows: OverviewCustomerGroupQuoteRow[],
  status: OverviewCustomerGroupQuoteStatusFilter,
): OverviewCustomerGroupQuoteRow[] {
  return rows.filter((row) => matchesStatus(row, status));
}

export function summarizeOverviewCustomerGroupQuoteStatusCounts(
  rows: OverviewCustomerGroupQuoteRow[],
): OverviewCustomerGroupQuoteStatusCounts {
  const count = (status: OverviewCustomerGroupQuoteStatusFilter) =>
    rows.filter((row) => matchesStatus(row, status)).length;
  return { todas: rows.length, ganhas: count("ganhas"), perdidas: count("perdidas"), outros: count("outros") };
}

function formatSellerLabel(row: OverviewCustomerGroupQuoteRow): string {
  const name = [row.sellerName, row.repShortName]
    .map((value) => value?.trim() ?? "")
    .find((value) => value.length > 0);
  return name ?? String(row.codRep);
}

export function listOverviewCustomerGroupQuoteSellerOptions(
  rows: OverviewCustomerGroupQuoteRow[],
): OverviewCustomerGroupQuoteSellerOption[] {
  const byCodRep = new Map<number, string>();
  for (const row of rows) {
    if (!byCodRep.has(row.codRep)) {
      byCodRep.set(row.codRep, formatSellerLabel(row));
    }
  }

  return Array.from(byCodRep, ([codRep, label]) => ({ codRep, label })).sort(
    (a, b) => a.label.localeCompare(b.label, "pt-BR"),
  );
}

export function applyOverviewCustomerGroupQuoteFilters(
  rows: OverviewCustomerGroupQuoteRow[],
  filters: OverviewCustomerGroupQuoteFilters,
  options: { outrosEnabled: boolean },
) {
  const sellerOptions = listOverviewCustomerGroupQuoteSellerOptions(rows);
  const codRep = sellerOptions.some((option) => option.codRep === filters.codRep)
    ? filters.codRep
    : null;
  const status =
    filters.status === "outros" && !options.outrosEnabled ? "todas" : filters.status;
  const searched = filterOverviewCustomerGroupQuoteRowsBySearchAndSeller(rows, {
    search: filters.search,
    codRep,
  });

  return {
    sellerOptions,
    filters: { search: filters.search, codRep, status },
    counts: summarizeOverviewCustomerGroupQuoteStatusCounts(searched),
    rows: filterOverviewCustomerGroupQuoteRowsByStatus(searched, status),
  };
}
