import { ChecklistTipo } from "@prisma/client";

export type ChecklistItemTipo = "NUMERICO" | "SIM_NAO";
export type ChecklistItemRespostaEsperada = "SIM" | "NAO";

export type IbcChecklistItemRecord = {
  id: string;
  descricao: string;
  tipo: ChecklistItemTipo;
  critico: boolean;
  respostaEsperada: ChecklistItemRespostaEsperada | null;
  bloqueante: boolean | null;
  ativo: boolean;
};

export type IbcChecklistItemNoChecklist = {
  itemId: string;
  descricao: string;
  tipo: ChecklistItemTipo;
  critico: boolean;
  respostaEsperada: ChecklistItemRespostaEsperada | null;
  bloqueante: boolean | null;
  ativo: boolean;
  ordem: number;
};

export type IbcChecklistSummary = {
  id: string;
  nome: string;
  notaMinimaCritico: number | null;
  mediaMinima: number | null;
  ativo: boolean;
  createdAt: string;
  totalItens: number;
};

export type IbcChecklistRecord = Omit<IbcChecklistSummary, "totalItens"> & {
  itens: IbcChecklistItemNoChecklist[];
};

export type IbcChecklistElegibilidade = {
  tipo: ChecklistTipo;
  ativo: boolean;
};

export type IbcChecklistPadraoDto = {
  checklistModeloId: string;
  nome: string;
  ativo: boolean;
  vinculadoEm: string;
  vinculadoPor: { id: string; nome: string };
};

export type IbcChecklistVinculoDto = IbcChecklistPadraoDto & {
  situacao: "ENTRADA_PATIO";
};
