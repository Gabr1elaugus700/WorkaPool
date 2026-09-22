import type { OverviewCustomerGroupQuoteSeniorLine } from "../sync/OverviewCustomerGroupQuotesSeniorQuery";

export function sortOverviewCustomerGroupQuoteLines(
  lines: OverviewCustomerGroupQuoteSeniorLine[],
): OverviewCustomerGroupQuoteSeniorLine[] {
  return [...lines].sort(compareLines);
}

function compareLines(
  left: OverviewCustomerGroupQuoteSeniorLine,
  right: OverviewCustomerGroupQuoteSeniorLine,
): number {
  if (left.datemi !== right.datemi) {
    return right.datemi.localeCompare(left.datemi);
  }
  if (left.numped !== right.numped) {
    return right.numped - left.numped;
  }
  return left.codpro.localeCompare(right.codpro);
}
