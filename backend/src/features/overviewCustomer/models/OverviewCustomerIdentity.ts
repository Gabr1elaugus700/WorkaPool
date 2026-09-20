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
  lastLostOrderAt?: string | null;
  lastCommercialMovementAt?: string | null;
  invoicedCountLast12Months?: number;
  lostCountLast12Months?: number;
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
  maxInvoicedOrderMarginPercent: number | null;
  minInvoicedOrderMarginPercent: number | null;
};

export type OverviewCustomerIdentitySnapshot = {
  customers: Record<string, OverviewCustomerIdentity>;
};

export type OverviewCustomerCommercialSummarySnapshot = {
  customers: Record<string, OverviewCustomerCommercialSummary>;
};

export type OverviewCustomerMonthlyEvolutionRow = {
  month: string;
  revenue: number;
  volume: number;
  orderCount: number;
  marginPercent: number | null;
};

export type OverviewCustomerMonthlyEvolutionSnapshot = {
  customers: Record<string, OverviewCustomerMonthlyEvolutionRow[]>;
};

export type OverviewCustomerPurchasedProduct = {
  productCode: string;
  productName: string;
  quantity: number;
  volume: number;
  revenue: number;
  averagePrice: number;
  marginPercentWeightedByRevenue: number | null;
  firstPurchaseAt: string;
  lastPurchaseAt: string;
  frequencyDays: number | null;
  revenueShare: number;
};

export type OverviewCustomerPurchasedProductsSnapshot = {
  customers: Record<string, OverviewCustomerPurchasedProduct[]>;
};

export type OverviewCustomerRecentInvoicedOrder = {
  orderNumber: number;
  occurredAt: string;
  codRep: number | null;
  branchCode: number | null;
};

export type OverviewCustomerRecentLostOrder = {
  orderNumber: number;
  occurredAt: string;
  codRep: number | null;
  sitped: number;
};

export type OverviewCustomerRecentCommercialMotion = {
  lastInvoicedPurchaseAt: string | null;
  lastLostOrderAt: string | null;
  lastCommercialMovementAt: string | null;
  invoicedCountLast12Months: number;
  lostCountLast12Months: number;
  recentInvoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  recentLostOrders: OverviewCustomerRecentLostOrder[];
};

export type OverviewCustomerRecentCommercialMotionSnapshot = {
  customers: Record<string, OverviewCustomerRecentCommercialMotion>;
};
