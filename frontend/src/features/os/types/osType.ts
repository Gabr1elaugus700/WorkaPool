
export type StatusType = "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
export type PrioridadeType = "baixa" | "media" | "alta";

export interface OsViewModel {
  id: string | number;
  titulo: string;
  status: StatusType;
  prioridade: PrioridadeType;
  solicitante: string;
  data_criacao?: string;
}