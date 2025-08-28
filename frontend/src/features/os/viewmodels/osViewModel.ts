import { OrdemServico } from "../models/osModel";

export const mapToOsViewModel = (os: OrdemServico) => ({
  id: os.id,
  titulo: `${os.descricao}`,
  status: `${os.status}`,
  prioridade: os.prioridade.toLowerCase(),
  solicitante: os.email_solicitante ?? "Desconhecido",
  criadoEm: new Date(os.data_criacao).toLocaleDateString()
});