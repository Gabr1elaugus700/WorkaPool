export type BranchIndicator = "MGA" | "CTB" | "BOTH";

export type OverviewCustomerIdentity = {
  customerCode: number;
  tradeName: string;
  document: string;
  city: string;
  state: string;
  segment: string | null;
  registrationDate: string | null;
  primaryCodRep: number | null;
  firstInvoicedPurchaseAt: string | null;
  lastInvoicedPurchaseAt: string | null;
  lastLostOrderAt: string | null;
  lastCommercialMovementAt: string | null;
  invoicedCountLast12Months?: number;
  lostCountLast12Months?: number;
  branchIndicator: BranchIndicator;
};

export type OverviewCustomerOrderCounts = {
  invoicedSinceJan2024: number;
  lostSinceJan2024: number;
  totalSinceJan2024: number;
  invoicedLast60Days: number;
  lostLast60Days: number;
  totalLast60Days: number;
};

export type OverviewCustomerDetailResponse = {
  customer: OverviewCustomerIdentity;
  commercialSummary: {
    revenueSinceJan2024: number;
    revenueLast12Months: number;
    orderCountSinceJan2024: number;
    orderCountLast12Months: number;
    averageTicketSinceJan2024: number;
    averageTicketLast12Months: number;
    volumeSinceJan2024: number;
    volumeLast12Months: number;
    marginPercentWeightedByRevenue: number | null;
    purchaseFrequencyDays: number | null;
    daysSinceLastPurchase: number | null;
    maxInvoicedOrderMarginPercent: number | null;
    minInvoicedOrderMarginPercent: number | null;
  };
  orderCounts?: OverviewCustomerOrderCounts;
  sync: {
    lastSuccessfulSyncAt: string | null;
    servedSnapshotId: string;
  };
};
