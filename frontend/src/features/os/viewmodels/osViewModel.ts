import { OrdemServico } from "../models/osModel";

export const mapToOsViewModel = (os: OrdemServico) => ({
  id: os.id,
  titulo: `${os.descricao} (${os.status})`,
  prioridade: os.prioridade.toLowerCase(),
  criadoEm: new Date(os.data_criacao).toLocaleDateString(),
});