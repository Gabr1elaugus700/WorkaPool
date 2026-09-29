import type { OverviewCustomerGroupQuoteRow } from "../types/overviewCustomerGroupQuotes.types";

export function selectVisibleOverviewCustomerGroupQuoteRows(
  rows: OverviewCustomerGroupQuoteRow[],
  options: { revealAvailable: boolean; revealVisible: boolean },
): OverviewCustomerGroupQuoteRow[] {
  if (options.revealAvailable && options.revealVisible) {
    return rows;
  }

  return rows.filter((row) => !row.otherCustomer);
}

export function countOverviewCustomerGroupQuoteOtherCustomerRows(
  rows: OverviewCustomerGroupQuoteRow[],
): number {
  return rows.filter((row) => row.otherCustomer).length;
}
