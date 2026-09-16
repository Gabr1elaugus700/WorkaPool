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

export type OverviewCustomerPurchasedProductsResponse = {
  customerCode: number;
  products: OverviewCustomerPurchasedProduct[];
};
