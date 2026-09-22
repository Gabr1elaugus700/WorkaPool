import type { OverviewCustomerGroupQuoteSeniorLine } from "../sync/OverviewCustomerGroupQuotesSeniorQuery";

export type FilterOverviewCustomerGroupQuoteLinesOptions = {
  revealOtherCustomers?: boolean;
};

export function filterOverviewCustomerGroupQuoteLines(
  lines: OverviewCustomerGroupQuoteSeniorLine[],
  customerCode: number,
  productCode: string,
  options: FilterOverviewCustomerGroupQuoteLinesOptions = {},
): OverviewCustomerGroupQuoteSeniorLine[] {
  const revealOtherCustomers = options.revealOtherCustomers === true;

  return lines.filter((line) => {
    if (line.codpro !== productCode) {
      return false;
    }
    if (revealOtherCustomers) {
      return true;
    }
    return line.codcli === customerCode;
  });
}
