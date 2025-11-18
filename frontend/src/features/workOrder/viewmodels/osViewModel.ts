import { OrdemServico } from "../models/workOrder.model";

export const mapToOsViewModel = (os: OrdemServico) => ({
  id: os.id,
  descricao: `${os.descricao}`,
  problema: `${os.problema}`,
  status: `${os.status}`,
  prioridade: os.prioridade.toUpperCase(),
  solicitante: os.email_solicitante ?? "Desconhecido",
  data_criacao: new Date(os.data_criacao).toLocaleDateString()
});