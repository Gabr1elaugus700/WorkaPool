export type DestinoConciliacao = "FICOU" | "RETORNOU" | "TROCA";
export type ModalidadeConciliacao = "VENDA" | "EMPRESTIMO";
export type PedidoConciliacaoDTO = {
  numPed: string;
  codCli: string | null;
  cliente: string;
  incluso: boolean;
  quantidadeEsperada: number;
  quantidadeApontada: number;
  posCar: number | null;
  gruposCodigo: string[];
  vendedor: string | null;
};
export type ConciliacaoViagemItemDTO = {
  alocacaoIbcId: string;
  ibcId: string;
  identificador: string;
  corHex: string | null;
  grupoCodigo: string | null;
  universal: boolean;
  homologado: boolean;
  numPed: string | null;
  codCli: string | null;
  cliente: string;
  destino: DestinoConciliacao | null;
  modalidade: ModalidadeConciliacao | null;
  modalidadeSugerida: ModalidadeConciliacao | null;
  ibcEntradaId: string | null;
};
export type ConciliacaoViagemClienteDTO = {
  chaveCliente: string;
  codCli: string | null;
  cliente: string;
  quantidadePapel: number | null;
  confirmouDivergencia: boolean;
};
export type ConciliacaoViagemDTO = {
  codCar: number;
  expedicaoIbcId: string;
  viagemFechadaEm: string | null;
  chegaramAMais: number;
  itens: ConciliacaoViagemItemDTO[];
  pedidos: PedidoConciliacaoDTO[];
  clientes: ConciliacaoViagemClienteDTO[];
};
export type SalvarConciliacaoInput = {
  itens: Array<{
    alocacaoIbcId: string;
    destino: DestinoConciliacao;
    numPed?: string;
  }>;
  chegaramAMais?: number;
};
export type FecharViagemInput = {
  confirmacoes?: Array<{ numPed: string }>;
};
