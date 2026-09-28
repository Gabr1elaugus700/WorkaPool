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

export type OverviewCustomerGroupQuoteSearchAndSellerFilter = {
  search: string;
  codRep: number | null;
};

function normalizeOrderSearch(search: string): string {
  return search.replace(/[#\s]/g, "");
}

export function filterOverviewCustomerGroupQuoteRowsBySearchAndSeller(
  rows: OverviewCustomerGroupQuoteRow[],
  filter: OverviewCustomerGroupQuoteSearchAndSellerFilter,
): OverviewCustomerGroupQuoteRow[] {
  const search = normalizeOrderSearch(filter.search);

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
  return {
    todas: rows.length,
    ganhas: rows.filter((row) => matchesStatus(row, "ganhas")).length,
    perdidas: rows.filter((row) => matchesStatus(row, "perdidas")).length,
    outros: rows.filter((row) => matchesStatus(row, "outros")).length,
  };
}

function formatSellerLabel(row: OverviewCustomerGroupQuoteRow): string {
  const sellerName = row.sellerName?.trim() ?? "";
  if (sellerName.length > 0) {
    return sellerName;
  }

  const repShortName = row.repShortName?.trim() ?? "";
  if (repShortName.length > 0) {
    return repShortName;
  }

  return String(row.codRep);
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
