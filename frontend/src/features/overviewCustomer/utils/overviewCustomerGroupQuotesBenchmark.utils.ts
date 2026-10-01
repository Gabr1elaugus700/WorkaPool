import type {
  OverviewCustomerGroupQuoteOutcome,
  OverviewCustomerGroupQuoteRow,
} from "../types/overviewCustomerGroupQuotes.types";

export type OverviewCustomerGroupQuoteBenchmark = {
  wonAveragePrice: number | null;
  lostAveragePrice: number | null;
  spreadAmount: number | null;
  spreadPercent: number | null;
};

function weightedAveragePrice(
  rows: Pick<OverviewCustomerGroupQuoteRow, "outcome" | "quantity" | "lineAmount">[],
  outcome: OverviewCustomerGroupQuoteOutcome,
): number | null {
  let amount = 0;
  let quantity = 0;
  for (const row of rows) {
    if (row.outcome === outcome) {
      amount += row.lineAmount;
      quantity += row.quantity;
    }
  }
  return quantity > 0 ? amount / quantity : null;
}

export function summarizeOverviewCustomerGroupQuoteBenchmark(
  rows: Pick<OverviewCustomerGroupQuoteRow, "outcome" | "quantity" | "lineAmount">[],
): OverviewCustomerGroupQuoteBenchmark {
  const wonAveragePrice = weightedAveragePrice(rows, "ganha");
  const lostAveragePrice = weightedAveragePrice(rows, "perdida");
  const spreadAmount =
    wonAveragePrice != null && lostAveragePrice != null
      ? lostAveragePrice - wonAveragePrice
      : null;
  const spreadPercent =
    spreadAmount != null && wonAveragePrice != null && wonAveragePrice !== 0
      ? (spreadAmount / wonAveragePrice) * 100
      : null;

  return { wonAveragePrice, lostAveragePrice, spreadAmount, spreadPercent };
}
