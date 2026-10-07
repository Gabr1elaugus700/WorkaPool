export type IbcChecklistItemDTO = {
  id: string;
  descricao: string;
  critico: boolean;
  ativo: boolean;
};

export type IbcChecklistItemNoChecklistDTO = {
  itemId: string;
  descricao: string;
  critico: boolean;
  ativo: boolean;
  ordem: number;
};

export type IbcChecklistSummaryDTO = {
  id: string;
  nome: string;
  notaMinimaCritico: number | null;
  mediaMinima: number | null;
  ativo: boolean;
  createdAt: string;
  totalItens: number;
};

export type IbcChecklistDTO = Omit<IbcChecklistSummaryDTO, "totalItens"> & {
  itens: IbcChecklistItemNoChecklistDTO[];
};

export type CreateIbcChecklistItemInput = {
  descricao: string;
  critico: boolean;
};

export type UpdateIbcChecklistItemInput = Partial<CreateIbcChecklistItemInput> & {
  ativo?: boolean;
};

export type CreateIbcChecklistInput = {
  nome: string;
  notaMinimaCritico: number;
  mediaMinima: number;
  itensIds: string[];
};

export type UpdateIbcChecklistInput = Partial<CreateIbcChecklistInput> & {
  ativo?: boolean;
};
