export interface OrdemServico {
  id: string;
  descricao: string;
  status: "ABERTO" | "FECHADO" | "PENDENTE";
  prioridade: "BAIXA" | "MEDIA" | "ALTA";
  data_criacao: string;
  data_conclusao?: string | null;
  email_solicitante?: string | null;
  id_solicitante?: string | null;
  id_vistoria?: string | null;
}
