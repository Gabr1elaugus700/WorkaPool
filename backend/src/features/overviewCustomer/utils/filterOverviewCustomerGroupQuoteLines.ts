import type { OverviewCustomerGroupQuoteSeniorLine } from "../sync/OverviewCustomerGroupQuotesSeniorQuery";

export function filterOverviewCustomerGroupQuoteLines(
  lines: OverviewCustomerGroupQuoteSeniorLine[],
  customerCode: number,
  productCode: string,
): OverviewCustomerGroupQuoteSeniorLine[] {
  return lines.filter(
    (line) => line.codcli === customerCode && line.codpro === productCode,
  );
}
