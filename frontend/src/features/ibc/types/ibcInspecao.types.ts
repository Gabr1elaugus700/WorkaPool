import type { IbcCadastroDTO } from "./ibcCadastro.types";

export type IbcInspecaoResultado = "APROVADA" | "REPROVADA";

export type RegistrarIbcInspecaoInput = {
  checklistModeloId: string;
  respostas: Array<{ checklistItemId: string; nota: number }>;
  observacao?: string;
};

export type IbcInspecaoDTO = {
  id: string;
  resultado: IbcInspecaoResultado;
  mediaObtida: number | null;
};

export type IbcInspecaoAvisoDTO = {
  code: "IBC_ALOCADO_INAPTO";
  codCar: number;
  numPed: string;
};

export type RegistrarIbcInspecaoResultDTO = {
  inspecao: IbcInspecaoDTO;
  ibc: Pick<IbcCadastroDTO, "aptidao" | "motivoInaptidao" | "primeiraInspecaoEm">;
  aviso?: IbcInspecaoAvisoDTO;
};
