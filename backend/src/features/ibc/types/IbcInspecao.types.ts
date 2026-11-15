import type { ChecklistItemTipo, ChecklistItemRespostaEsperada } from "@prisma/client";
import type { IbcCadastroRecord } from "./IbcCadastro.types";

export type IbcInspecaoResultado = "APROVADA" | "REPROVADA";

export type IbcAptidao = Pick<IbcCadastroRecord, "aptidao" | "motivoInaptidao">;

export type ItemAtivoParaInspecao = {
  checklistItemId: string;
  descricao: string;
  tipo: ChecklistItemTipo;
  critico: boolean;
  respostaEsperada: ChecklistItemRespostaEsperada | null;
  bloqueante: boolean | null;
};

export type IbcChecklistParaInspecao = {
  ativo: boolean;
  notaMinimaCritico: number | null;
  mediaMinima: number | null;
  itensAtivos: ItemAtivoParaInspecao[];
};

export type IbcInspecaoRespostaDto = {
  checklistItemId: string;
  descricao: string;
  tipo: ChecklistItemTipo;
  critico: boolean;
  nota: number | null;
  resposta: ChecklistItemRespostaEsperada | null;
  respostaEsperada: ChecklistItemRespostaEsperada | null;
  bloqueante: boolean | null;
  observacao: string | null;
};

export type IbcInspecaoDto = {
  id: string;
  ibcId: string;
  checklistModeloId: string;
  resultado: IbcInspecaoResultado;
  mediaObtida: number | null;
  notaMinimaCritico: number | null;
  mediaMinima: number | null;
  inspetorId: string;
  inspecionadoEm: string;
  observacao: string | null;
  respostas: IbcInspecaoRespostaDto[];
};

export type IbcInspecaoHistoricoDto = {
  id: string;
  checklistModeloId: string;
  checklistNome: string;
  resultado: IbcInspecaoResultado;
  mediaObtida: number | null;
  notaMinimaCritico: number | null;
  mediaMinima: number | null;
  inspetor: { id: string; nome: string };
  inspecionadoEm: string;
  observacao: string | null;
  respostas: IbcInspecaoRespostaDto[];
};

/** Última inspeção, reprovada, de um checklist ainda vinculado ao IBC (limites e respostas do snapshot). */
export type IbcInspecaoReprovadaVigente = {
  ibcId: string;
  checklistModeloId: string;
  checklistNome: string;
  mediaObtida: number | null;
  notaMinimaCritico: number | null;
  mediaMinima: number | null;
  respostas: IbcInspecaoRespostaDto[];
};

export type IbcAptidaoSnapshot = IbcAptidao & { primeiraInspecaoEm: string | null };

export type IbcAlocacaoAberta = { codCar: number; numPed: string | null };

export type RegistrarIbcInspecaoResult = {
  inspecao: IbcInspecaoDto;
  ibc: IbcAptidaoSnapshot;
  aviso?: { code: "IBC_ALOCADO_INAPTO" } & IbcAlocacaoAberta;
};