import type { OverviewCustomerOrderCounts } from "../types/overviewCustomerDetail.types";

const EMPTY_ORDER_COUNTS: OverviewCustomerOrderCounts = {
  invoicedSinceJan2024: 0,
  lostSinceJan2024: 0,
  totalSinceJan2024: 0,
  invoicedLast60Days: 0,
  lostLast60Days: 0,
  totalLast60Days: 0,
};

export function resolveOverviewCustomerOrderCounts(
  orderCounts: OverviewCustomerOrderCounts | null | undefined,
): OverviewCustomerOrderCounts {
  if (!orderCounts) {
    return EMPTY_ORDER_COUNTS;
  }

  return {
    invoicedSinceJan2024: orderCounts.invoicedSinceJan2024,
    lostSinceJan2024: orderCounts.lostSinceJan2024,
    totalSinceJan2024: orderCounts.totalSinceJan2024,
    invoicedLast60Days: orderCounts.invoicedLast60Days,
    lostLast60Days: orderCounts.lostLast60Days,
    totalLast60Days: orderCounts.totalLast60Days,
  };
}
