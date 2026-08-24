/** Situações listáveis na expedição IBC (#61). */
export type CargaExpedicaoSituacao = "ABERTA" | "FECHADA" | string;

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

/**
 * Item de lista / resumo compartilhado com o detalhe
 * (espelha CargaExpedicaoListItem do backend).
 */
export type CargaExpedicaoListItemDTO = {
  id: string;
  codCar: number;
  destino: string;
  situacao: CargaExpedicaoSituacao;
  previsaoSaida: string;
  quantidadeAlocada: number;
  quantidadeEsperadaTotal: number;
  semIbc: boolean;
  temExpedicao: boolean;
  podeFecharExpedicao: boolean;
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
export type CargaExpedicaoDetalheDTO = CargaExpedicaoListItemDTO & {
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
