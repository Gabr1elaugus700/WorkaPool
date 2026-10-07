export type IbcChecklistItemDTO = {
  id: string;
  descricao: string;
  critico: boolean;
  ativo: boolean;
};

export type CreateIbcChecklistItemInput = {
  descricao: string;
  critico: boolean;
};

export type UpdateIbcChecklistItemInput = Partial<CreateIbcChecklistItemInput> & {
  ativo?: boolean;
};
