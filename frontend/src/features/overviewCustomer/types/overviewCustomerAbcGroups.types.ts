export type OverviewCustomerAbcGroup = {
  grupoCodigo: string;
  grupoDescricao: string;
  revenueShare: number;
};

export type OverviewCustomerAbcGroupsResponse = {
  customerCode: number;
  grupos: OverviewCustomerAbcGroup[];
};
