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
  branchIndicator: BranchIndicator;
  orderCountLast12Months?: number;
  revenueLast12Months?: number;
  daysSinceLastPurchase?: number | null;
};

export type OverviewCustomerCommercialSummary = {
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
};

export type OverviewCustomerIdentitySnapshot = {
  customers: Record<string, OverviewCustomerIdentity>;
};

export type OverviewCustomerCommercialSummarySnapshot = {
  customers: Record<string, OverviewCustomerCommercialSummary>;
};
