import type { OverviewCustomerGroupQuoteSeniorLine } from "../sync/OverviewCustomerGroupQuotesSeniorQuery";

export type OverviewCustomerGroupQuoteProductOption = {
  productCode: string;
  productName: string | null;
};

export function selectOverviewCustomerGroupQuoteProducts(
  lines: OverviewCustomerGroupQuoteSeniorLine[],
  customerCode: number,
): OverviewCustomerGroupQuoteProductOption[] {
  const byCode = new Map<string, OverviewCustomerGroupQuoteProductOption>();

  for (const line of lines) {
    if (line.codcli !== customerCode) {
      continue;
    }
    if (byCode.has(line.codpro)) {
      continue;
    }
    byCode.set(line.codpro, {
      productCode: line.codpro,
      productName: line.productName,
    });
  }

  return [...byCode.values()].sort((left, right) =>
    left.productCode.localeCompare(right.productCode),
  );
}
