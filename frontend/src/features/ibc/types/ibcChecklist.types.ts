export type IbcChecklistItemTipo = "NUMERICO" | "SIM_NAO";
export type IbcChecklistItemRespostaEsperada = "SIM" | "NAO";

export type IbcChecklistItemDTO = {
  id: string;
  descricao: string;
  tipo: IbcChecklistItemTipo;
  critico: boolean;
  respostaEsperada: IbcChecklistItemRespostaEsperada | null;
  bloqueante: boolean | null;
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

export type IbcChecklistVinculoDTO = {
  checklistModeloId: string;
  nome: string;
  ativo: boolean;
  vinculadoEm: string;
  vinculadoPor: { id: string; nome: string };
};

export type CreateIbcChecklistItemInput = {
  descricao: string;
  tipo?: IbcChecklistItemTipo;
  critico?: boolean;
  respostaEsperada?: IbcChecklistItemRespostaEsperada;
  bloqueante?: boolean;
};

export type UpdateIbcChecklistItemInput = Partial<CreateIbcChecklistItemInput> & {
  ativo?: boolean;
};

export type CreateIbcChecklistInput = {
  nome: string;
  notaMinimaCritico: number | null;
  mediaMinima: number | null;
  itensIds: string[];
};

export type UpdateIbcChecklistInput = Partial<CreateIbcChecklistInput> & {
  ativo?: boolean;
};