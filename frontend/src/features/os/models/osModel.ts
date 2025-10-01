export interface OrdemServico {
  id?: string;
  descricao: string;
  problema: string;
  status: "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
  prioridade: "BAIXA" | "MEDIA" | "ALTA";
  data_criacao: string;
  data_conclusao?: string | null;
  email_solicitante?: string | null;
  id_solicitante?: string | null;
  id_vistoria?: string | null;
  id_departamento?: string | null;
  localizacao?: string | null;
  imagens?: File[];
}

