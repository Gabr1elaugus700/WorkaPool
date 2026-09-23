import type { OverviewCustomerIdentity } from "../models/OverviewCustomerIdentity";

export type OverviewCustomerOrderCounts = {
  invoicedSinceJan2024: number;
  lostSinceJan2024: number;
  totalSinceJan2024: number;
  invoicedLast60Days: number;
  lostLast60Days: number;
  totalLast60Days: number;
};

export function buildOverviewCustomerOrderCounts(
  customer: Pick<
    OverviewCustomerIdentity,
    | "invoicedCountSinceJan2024"
    | "lostCountSinceJan2024"
    | "invoicedCountLast60Days"
    | "lostCountLast60Days"
  >,
): OverviewCustomerOrderCounts {
  const invoicedSinceJan2024 = customer.invoicedCountSinceJan2024 ?? 0;
  const lostSinceJan2024 = customer.lostCountSinceJan2024 ?? 0;
  const invoicedLast60Days = customer.invoicedCountLast60Days ?? 0;
  const lostLast60Days = customer.lostCountLast60Days ?? 0;

  return {
    invoicedSinceJan2024,
    lostSinceJan2024,
    totalSinceJan2024: invoicedSinceJan2024 + lostSinceJan2024,
    invoicedLast60Days,
    lostLast60Days,
    totalLast60Days: invoicedLast60Days + lostLast60Days,
  };
}
