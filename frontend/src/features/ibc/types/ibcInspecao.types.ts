import type { IbcCadastroDTO } from "./ibcCadastro.types";
import type { IbcChecklistItemRespostaEsperada, IbcChecklistItemTipo } from "./ibcChecklist.types";

export type IbcInspecaoResultado = "APROVADA" | "REPROVADA";

export type RegistrarIbcInspecaoRespostaInput = {
  checklistItemId: string;
  nota?: number;
  resposta?: IbcChecklistItemRespostaEsperada;
  observacao?: string;
};

export type RegistrarIbcInspecaoInput = {
  checklistModeloId: string;
  respostas: RegistrarIbcInspecaoRespostaInput[];
  observacao?: string;
};

export type IbcInspecaoDTO = {
  resultado: IbcInspecaoResultado;
  mediaObtida: number | null;
};

export type IbcInspecaoAvisoDTO = {
  code: "IBC_ALOCADO_INAPTO";
  codCar: number;
  numPed: string;
};

export type IbcInspecaoRespostaDTO = {
  checklistItemId: string;
  descricao: string;
  tipo: IbcChecklistItemTipo;
  critico: boolean;
  nota: number | null;
  resposta: IbcChecklistItemRespostaEsperada | null;
  respostaEsperada: IbcChecklistItemRespostaEsperada | null;
  bloqueante: boolean | null;
  observacao: string | null;
};

export type IbcInspecaoLimitesDTO = {
  notaMinimaCritico: number | null;
  mediaMinima: number | null;
};

export type IbcInspecaoHistoricoDTO = IbcInspecaoLimitesDTO & {
  id: string;
  checklistModeloId: string;
  checklistNome: string;
  resultado: IbcInspecaoResultado;
  mediaObtida: number | null;
  inspetor: { id: string; nome: string };
  inspecionadoEm: string;
  observacao: string | null;
  respostas: IbcInspecaoRespostaDTO[];
};

export type RegistrarIbcInspecaoResultDTO = {
  inspecao: IbcInspecaoDTO;
  ibc: Pick<IbcCadastroDTO, "aptidao" | "motivoInaptidao" | "primeiraInspecaoEm">;
  aviso?: IbcInspecaoAvisoDTO;
};
