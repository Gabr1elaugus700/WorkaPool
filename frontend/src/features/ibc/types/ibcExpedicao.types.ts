/**
 * Alocação ativa (espelha AlocacaoIbcRecord serializado em JSON).
 */
export type AlocacaoIbcDTO = {
  id: string;
  ibcId: string;
  cargaId: string;
  numPed: string;
  alocadoPorId: string;
  alocadoEm: string;
  expedicaoIbcId: string | null;
  identificador: string;
};

/** Resumo compartilhado entre lista e detalhe (espelha CargaExpedicaoListItem do backend). */
type CargaExpedicaoResumoDTO = {
  id: string;
  codCar: number;
  destino: string;
  previsaoSaida: string;
  quantidadeAlocada: number;
  quantidadeEsperadaTotal: number;
  temExpedicao: boolean;
  podeFecharExpedicao: boolean;
};

/** Item da lista: só cargas FECHADA com pedidos IBC aguardando expedição. */
export type CargaExpedicaoListItemDTO = CargaExpedicaoResumoDTO & {
  situacao: "FECHADA";
};

/**
 * Pedido no detalhe de preparação (só IBC elegíveis + inválidos com alerta).
 */
export type PedidoIbcPreparacaoDTO = {
  numPed: string;
  cliente: string;
  quantidadeAlocada: number;
  quantidadeEsperadaTotal: number;
  quantidadeEsperadaVenda: number;
  quantidadeEsperadaEmprestimo: number;
  ibcInvalido: boolean;
  alocacoes: AlocacaoIbcDTO[];
};

/** GET /api/ibc/cargas-expedicao/:codCar */
export type CargaExpedicaoDetalheDTO = CargaExpedicaoResumoDTO & {
  situacao: string;
  pedidos: PedidoIbcPreparacaoDTO[];
};

/** Envelope opcional de GET /cargas-expedicao */
export type ListCargasExpedicaoResponseDTO = {
  cargas: CargaExpedicaoListItemDTO[];
};

export type CreateAlocacaoIbcInput = {
  codCar: number;
  numPed: string;
  identificador: string;
};

export type CreateAlocacaoIbcResultDTO = {
  alocacao: AlocacaoIbcDTO;
  quantidadeAlocada: number;
  quantidadeEsperadaTotal: number;
};

export type FecharExpedicaoIbcInput = {
  codCar: number;
};

export type FecharExpedicaoIbcResultDTO = {
  id: string;
  cargaId?: string;
  fechadoPorId?: string;
  fechadoEm?: string;
  ibcsEmViagem?: number;
};

export type IbcRealtimeNotification = {
  event: "CARGA_FECHADA";
  cargaId: string;
  codCar: number;
};
