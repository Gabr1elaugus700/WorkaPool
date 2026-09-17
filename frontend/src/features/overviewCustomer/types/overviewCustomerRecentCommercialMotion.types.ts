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

export type OverviewCustomerRecentCommercialMotionResponse = {
  customerCode: number;
  lastInvoicedPurchaseAt: string | null;
  lastLostOrderAt: string | null;
  lastCommercialMovementAt: string | null;
  invoicedCountLast12Months: number;
  lostCountLast12Months: number;
  recentInvoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  recentLostOrders: OverviewCustomerRecentLostOrder[];
};
