export type OverviewCustomerMonthlyEvolutionRow = {
  month: string;
  revenue: number;
  volume: number;
  orderCount: number;
  marginPercent: number | null;
};

export type OverviewCustomerMonthlyEvolutionResponse = {
  customerCode: number;
  monthly: OverviewCustomerMonthlyEvolutionRow[];
};
