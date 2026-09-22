export type OverviewCustomerGroupGanho = {
  numnfv: number;
  numped: number;
  datemi: string;
  vlrfinal: number;
  qtdped: number;
  preuni: number;
  margem: number | null;
};

export type OverviewCustomerGroupPerdido = {
  numped: number;
  datemi: string;
  vlrfinal: number;
  qtdped: number;
  preuni: number;
  margem: number | null;
  motivo: string;
};

export type OverviewCustomerGroupAnaliseResponse = {
  customerCode: number;
  grupoCodigo: string;
  ganhos: OverviewCustomerGroupGanho[];
  perdidos: OverviewCustomerGroupPerdido[] | null;
  perdidosFailed: boolean;
};
