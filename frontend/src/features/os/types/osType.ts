export type StatusType = "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
export type PrioridadeType = "BAIXA" | "MEDIA" | "ALTA";

export interface OsViewModel {
  id: string;
  descricao: string;
  problema: string;
  status: StatusType;
  prioridade: PrioridadeType;
  solicitante: string;
  data_criacao?: string;
}