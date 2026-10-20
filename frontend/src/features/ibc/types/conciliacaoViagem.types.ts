export type DestinoConciliacao = "FICOU" | "RETORNOU" | "TROCA";
export type ModalidadeConciliacao = "VENDA" | "EMPRESTIMO";
export type PedidoConciliacaoDTO = {
  numPed: string;
  codCli: string | null;
  cliente: string;
  incluso: boolean;
  quantidadeEsperada: number;
  quantidadeApontada: number;
};
export type ConciliacaoViagemItemDTO = {
  alocacaoIbcId: string;
  ibcId: string;
  identificador: string;
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
  retornosSemId?: Array<{
    chaveCliente: string;
    quantidadePapel: number;
    confirmouDivergencia?: boolean;
  }>;
};
export type FecharViagemInput = {
  confirmacoes?: Array<{ numPed: string }>;
};
export type RegistrarTrocaInput = {
  alocacaoIbcId: string;
  produtoId: string;
  dataLimite: string;
};
