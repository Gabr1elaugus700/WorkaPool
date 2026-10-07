import { ChecklistTipo } from "@prisma/client";

export type IbcChecklistItemRecord = {
  id: string;
  descricao: string;
  critico: boolean;
  ativo: boolean;
};

export type IbcChecklistItemNoChecklist = {
  itemId: string;
  descricao: string;
  critico: boolean;
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

export type IbcChecklistVinculoRecord = {
  checklistModeloId: string;
  nome: string;
  ativo: boolean;
  totalItens: number;
  vinculadoPorId: string;
  vinculadoEm: string;
};
