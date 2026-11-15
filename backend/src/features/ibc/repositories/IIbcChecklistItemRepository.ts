import {
  ChecklistItemRespostaEsperada,
  ChecklistItemTipo,
  IbcChecklistItemRecord,
} from "../types/IbcChecklist.types";

export type CreateIbcChecklistItemData = {
  descricao: string;
  tipo: ChecklistItemTipo;
  critico: boolean;
  respostaEsperada: ChecklistItemRespostaEsperada | null;
  bloqueante: boolean | null;
};

export type UpdateIbcChecklistItemData = {
  descricao: string;
  tipo: ChecklistItemTipo;
  critico: boolean;
  respostaEsperada: ChecklistItemRespostaEsperada | null;
  bloqueante: boolean | null;
  ativo: boolean;
};

export interface IIbcChecklistItemRepository {
  list(): Promise<IbcChecklistItemRecord[]>;
  findById(id: string): Promise<IbcChecklistItemRecord | null>;
  findManyByIds(ids: string[]): Promise<IbcChecklistItemRecord[]>;
  create(data: CreateIbcChecklistItemData): Promise<IbcChecklistItemRecord>;
  updateById(id: string, data: UpdateIbcChecklistItemData): Promise<IbcChecklistItemRecord>;
}
