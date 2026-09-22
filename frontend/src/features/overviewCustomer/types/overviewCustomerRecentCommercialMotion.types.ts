export type OverviewCustomerRecentInvoicedOrderItem = {
  productCode: string;
  productName: string;
  quantity: number;
  volume: number;
  revenue: number;
  unitPrice: number;
  marginPercent: number | null;
};

export type OverviewCustomerRecentInvoicedOrder = {
  orderNumber: number;
  occurredAt: string;
  codRep: number | null;
  branchCode: number | null;
  revenue: number;
  volume: number;
  marginPercent: number | null;
  items: OverviewCustomerRecentInvoicedOrderItem[];
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
