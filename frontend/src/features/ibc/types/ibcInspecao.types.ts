import type { IbcCadastroDTO } from "./ibcCadastro.types";

export type IbcInspecaoResultado = "APROVADA" | "REPROVADA";

export type RegistrarIbcInspecaoInput = {
  checklistModeloId: string;
  respostas: Array<{ checklistItemId: string; nota: number }>;
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
  critico: boolean;
  nota: number;
};

export type IbcInspecaoLimitesDTO = {
  notaMinimaCritico: number;
  mediaMinima: number;
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
