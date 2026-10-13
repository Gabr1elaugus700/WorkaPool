export type DestinoConciliacao = "FICOU" | "RETORNOU" | "TROCA";
export type ModalidadeConciliacao = "VENDA" | "EMPRESTIMO";
export type ConciliacaoViagemItemDTO = {
  alocacaoIbcId: string;
  ibcId: string;
  identificador: string;
  numPed: string;
  codCli: string | null;
  cliente: string;
  destino: DestinoConciliacao | null;
  modalidade: ModalidadeConciliacao | null;
  modalidadeSugerida: ModalidadeConciliacao | null;
  ibcEntradaId: string | null;
};
export type ConciliacaoViagemDTO = {
  codCar: number;
  expedicaoIbcId: string;
  viagemFechadaEm: string | null;
  itens: ConciliacaoViagemItemDTO[];
};
export type SalvarConciliacaoInput = {
  itens: Array<{
    alocacaoIbcId: string;
    destino: DestinoConciliacao;
    modalidade?: ModalidadeConciliacao | null;
  }>;
};
