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

/** GET /api/ibc/cargas-expedicao/:codCar — só carga FECHADA com foto de pedidos IBC. */
export type CargaExpedicaoDetalheDTO = CargaExpedicaoResumoDTO & {
  situacao: "FECHADA";
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

export type CargaEmViagemClienteDTO = {
  cliente: string;
  codCli: string | null;
};

/** GET /api/ibc/expedicoes/em-viagem */
export type CargaEmViagemListItemDTO = {
  codCar: number;
  destino: string;
  situacao: string;
  previsaoSaida: string;
  fechadoEm: string;
  quantidadePedidos: number;
  quantidadeIbcs: number;
  quantidadeIbcsEmViagem: number;
  clientes: CargaEmViagemClienteDTO[];
};

export type ListCargasEmViagemResponseDTO = {
  cargas: CargaEmViagemListItemDTO[];
};

/** GET /api/ibc/expedicoes/:codCar/relatorio-viagem — um bloco por pedido. */
export type RelatorioViagemBlocoDTO = {
  codCli: string | null;
  cliente: string;
  numPed: string;
  quantidadeEsperada: number;
  incluso: boolean;
  checklist: { identificador: string }[];
};

export type RelatorioViagemDTO = {
  codCar: number;
  fechadoEm: string;
  destino: string;
  placa: string | null;
  totalIbcs: number;
  totalClientes: number;
  blocos: RelatorioViagemBlocoDTO[];
};

export type IbcRealtimeNotification = {
  event: "CARGA_FECHADA";
  cargaId: string;
  codCar: number;
};
