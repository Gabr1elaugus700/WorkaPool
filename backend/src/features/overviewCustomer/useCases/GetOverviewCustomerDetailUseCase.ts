import type { OverviewCustomerSyncStore } from "../sync/ports";
import { extractOverviewCustomerCommercialSummarySnapshot } from "../sync/extractOverviewCustomerCommercialSummarySnapshot";
import type {
  OverviewCustomerCommercialSummary,
  OverviewCustomerIdentity,
} from "../models/OverviewCustomerIdentity";
import {
  buildOverviewCustomerOrderCounts,
  type OverviewCustomerOrderCounts,
} from "../utils/buildOverviewCustomerOrderCounts";
import {
  assertOverviewCustomerAccess,
  type AssertOverviewCustomerAccessInput,
} from "../utils/assertOverviewCustomerAccess";

export type { OverviewCustomerOrderCounts };

export type GetOverviewCustomerDetailInput = AssertOverviewCustomerAccessInput;

export type OverviewCustomerDetailResult = {
  customer: OverviewCustomerIdentity;
  commercialSummary: OverviewCustomerCommercialSummary;
  orderCounts: OverviewCustomerOrderCounts;
  sync: {
    lastSuccessfulSyncAt: string | null;
    servedSnapshotId: string;
  };
};

export class GetOverviewCustomerDetailUseCase {
  constructor(private readonly store: OverviewCustomerSyncStore) {}

  async execute(input: GetOverviewCustomerDetailInput): Promise<OverviewCustomerDetailResult> {
    const [access, lastSuccessfulSyncAt] = await Promise.all([
      assertOverviewCustomerAccess(this.store, input),
      this.store.getLastSuccessfulSyncAt(),
    ]);

    const { customer, snapshot } = access;

    const commercialSummarySnapshot = extractOverviewCustomerCommercialSummarySnapshot(
      snapshot.payload,
    );
    const commercialSummary =
      commercialSummarySnapshot?.customers[String(input.customerCode)] ??
      emptyCommercialSummary();

    return {
      customer: {
        ...customer,
        lastLostOrderAt: customer.lastLostOrderAt ?? null,
        lastCommercialMovementAt:
          customer.lastCommercialMovementAt ?? customer.lastInvoicedPurchaseAt ?? null,
        invoicedCountLast12Months: customer.invoicedCountLast12Months,
        lostCountLast12Months: customer.lostCountLast12Months,
      },
      commercialSummary,
      orderCounts: buildOverviewCustomerOrderCounts(customer),
      sync: {
        lastSuccessfulSyncAt: lastSuccessfulSyncAt
          ? lastSuccessfulSyncAt.toISOString()
          : null,
        servedSnapshotId: snapshot.id,
      },
    };
  }
}

function emptyCommercialSummary(): OverviewCustomerCommercialSummary {
  return {
    revenueSinceJan2024: 0,
    revenueLast30Days: 0,
    revenueLast12Months: 0,
    orderCountSinceJan2024: 0,
    orderCountLast12Months: 0,
    averageTicketSinceJan2024: 0,
    averageTicketLast12Months: 0,
    volumeSinceJan2024: 0,
    volumeLast30Days: 0,
    volumeLast12Months: 0,
    marginPercentWeightedByRevenue: null,
    purchaseFrequencyDays: null,
    daysSinceLastPurchase: null,
    maxInvoicedOrderMarginPercent: null,
    minInvoicedOrderMarginPercent: null,
  };
}
