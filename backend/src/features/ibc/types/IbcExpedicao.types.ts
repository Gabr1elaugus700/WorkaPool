export type IbcAptidaoValue = "APTO" | "INAPTO";

export type IbcCustodiaValue = "PATIO" | "EM_VIAGEM" | "ENTRADA" | "CLIENTE";

export type IbcRecord = {
  id: string;
  identificador: string;
  aptidao: IbcAptidaoValue;
  custodia: IbcCustodiaValue;
  dataLimite: Date | null;
  createdAt: Date;
  /** Preenchido quando este IBC já foi origem de conversão ou mudança de produto. */
  convertedToContainerId: string | null;
  /** Container universal: atende qualquer grupo da carga. */
  universal: boolean;
  /** Grupo da configuração. Nulo no universal e no legado sem produto. */
  grupoCodigo: string | null;
};

/** Produto do container já em viagem, para a compatibilidade na volta. */
export type IbcParaCompatibilidade = {
  id: string;
  identificador: string;
  universal: boolean;
  grupoCodigo: string | null;
};

/** Container com a placa do produto, para a paleta de Preparação. */
export type IbcPlacaRecord = {
  id: string;
  identificador: string;
  prefixo: string | null;
  dataLimite: Date | null;
  universal: boolean;
  /** Nulo no universal e no legado sem produto. */
  grupoCodigo: string | null;
  sigla: string | null;
  corHex: string | null;
};

export type AlocacaoIbcRecord = {
  id: string;
  ibcId: string;
  cargaId: string;
  numPed: string | null;
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
  /** Ordem de entrega na Carga (Sapiens `usu_poscar`); null quando o Sapiens não tem posição (nulo ou 0) e em fotos gravadas antes da coluna existir. */
  posCar: number | null;
  /** Grupos de produto do pedido, sem a linha de embalagem 251001. */
  gruposCodigo: string[];
};

/** Carga FECHADA com foto de pedidos IBC e sem ExpedicaoIbc, com alocações já carregadas. */
export type CargaExpedicaoPendente = CargaExpedicaoRef & {
  pedidosIbc: CargaPedidoIbcSnapshot[];
  alocacoes: AlocacaoIbcRecord[];
};

export type CreateAlocacaoIbcData = {
  ibcId: string;
  cargaId: string;
  numPed: string | null;
  alocadoPorId: string;
};

export type FecharExpedicaoIbcData = {
  cargaId: string;
  fechadoPorId: string;
  alocacaoIds: string[];
  ibcIds: string[];
};

export type AlocacaoIbcEmViagemRecord = AlocacaoIbcRecord & {
  custodia: IbcCustodiaValue;
};

/** Carga com ExpedicaoIbc e ao menos um IBC ainda em EM_VIAGEM. */
export type CargaEmViagem = CargaExpedicaoRef & {
  pedidosIbc: CargaPedidoIbcSnapshot[];
  alocacoes: AlocacaoIbcEmViagemRecord[];
  expedicao: ExpedicaoIbcRecord;
};
