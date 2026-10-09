import type { IbcCadastroRecord } from "./IbcCadastro.types";

export type IbcInspecaoResultado = "APROVADA" | "REPROVADA";

export type IbcAptidao = Pick<IbcCadastroRecord, "aptidao" | "motivoInaptidao">;

export type IbcChecklistParaInspecao = {
  ativo: boolean;
  notaMinimaCritico: number;
  mediaMinima: number;
  itensAtivos: Array<{ checklistItemId: string; descricao: string; critico: boolean }>;
};

export type IbcInspecaoRespostaDto = {
  checklistItemId: string;
  descricao: string;
  critico: boolean;
  nota: number;
};

export type IbcInspecaoDto = {
  id: string;
  ibcId: string;
  checklistModeloId: string;
  resultado: IbcInspecaoResultado;
  mediaObtida: number | null;
  notaMinimaCritico: number;
  mediaMinima: number;
  inspetorId: string;
  inspecionadoEm: string;
  observacao: string | null;
  respostas: IbcInspecaoRespostaDto[];
};

export type IbcAptidaoSnapshot = IbcAptidao & { primeiraInspecaoEm: string | null };

export type IbcAlocacaoAberta = { codCar: number; numPed: string };

export type RegistrarIbcInspecaoResult = {
  inspecao: IbcInspecaoDto;
  ibc: IbcAptidaoSnapshot;
  aviso?: { code: "IBC_ALOCADO_INAPTO" } & IbcAlocacaoAberta;
};
