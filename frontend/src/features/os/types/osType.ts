export type StatusOS = "ABERTO" | "FECHADO" | "PENDENTE";

export interface CreateOSDTO {
  descricao: string;
  status: StatusOS;
  prioridade: "BAIXA" | "MEDIA" | "ALTA";
  email_solicitante?: string;
}
