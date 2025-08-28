
export type StatusType = "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
export type PrioridadeType = "BAIXA" | "MEDIA" | "ALTA";

export interface OsViewModel {
  id: string | number;
  titulo: string;
  status: StatusType;
  prioridade: PrioridadeType;
  solicitante: string;
  criadoEm: string;
}