export type IbcAptidaoValue = "APTO" | "INAPTO";

export type IbcCustodiaValue = "PATIO" | "EM_VIAGEM";

export type IbcRecord = {
  id: string;
  identificador: string;
  aptidao: IbcAptidaoValue;
  custodia: IbcCustodiaValue;
  dataLimite: Date | null;
  createdAt: Date;
};

export type AlocacaoIbcRecord = {
  id: string;
  ibcId: string;
  cargaId: string;
  numPed: string;
  alocadoPorId: string;
  alocadoEm: Date;
  expedicaoIbcId: string | null;
  identificador: string;
};

export type ExpedicaoIbcRecord = {
  id: string;
  cargaId: string;
  fechadoPorId: string;
  fechadoEm: Date;
};

export type CargaExpedicaoRef = {
  id: string;
  codCar: number;
  destino: string;
  situacao: string;
  previsaoSaida: Date;
};

/** Foto de pedidos IBC: um registro por Pedido com sinal 251001, gravado no Fechar Carga. */
export type CargaPedidoIbcSnapshot = {
  numPed: string;
  codCli: string | null;
  cliente: string;
  quantidadeEsperadaTotal: number;
  quantidadeEsperadaVenda: number;
  quantidadeEsperadaEmprestimo: number;
  ibcInvalido: boolean;
};

/** Carga FECHADA com foto de pedidos IBC e sem ExpedicaoIbc, com alocações já carregadas. */
export type CargaExpedicaoPendente = CargaExpedicaoRef & {
  pedidosIbc: CargaPedidoIbcSnapshot[];
  alocacoes: AlocacaoIbcRecord[];
};

export type CreateAlocacaoIbcData = {
  ibcId: string;
  cargaId: string;
  numPed: string;
  alocadoPorId: string;
};

export type FecharExpedicaoIbcData = {
  cargaId: string;
  fechadoPorId: string;
  alocacaoIds: string[];
  ibcIds: string[];
};
