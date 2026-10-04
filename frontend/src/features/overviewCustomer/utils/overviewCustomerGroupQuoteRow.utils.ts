import type {
  OverviewCustomerGroupQuoteOutcome,
  OverviewCustomerGroupQuoteRow,
} from "../types/overviewCustomerGroupQuotes.types";

export type OverviewCustomerGroupQuoteRowTone = "ganha" | "perdida" | "outro";

export function resolveOverviewCustomerGroupQuoteSellerName(
  row: Pick<OverviewCustomerGroupQuoteRow, "codRep" | "sellerName" | "repShortName">,
): string {
  const name = [row.sellerName, row.repShortName]
    .map((value) => value?.trim() ?? "")
    .find((value) => value.length > 0);
  return name ?? String(row.codRep);
}

export function getOverviewCustomerGroupQuoteRowTone(
  row: Pick<OverviewCustomerGroupQuoteRow, "outcome" | "otherCustomer">,
): OverviewCustomerGroupQuoteRowTone {
  if (row.otherCustomer) {
    return "outro";
  }
  return row.outcome;
}

export function formatOverviewCustomerGroupQuoteSituation(
  outcome: OverviewCustomerGroupQuoteOutcome,
): string {
  return outcome === "ganha" ? "Faturado" : "Sem fechamento";
}
