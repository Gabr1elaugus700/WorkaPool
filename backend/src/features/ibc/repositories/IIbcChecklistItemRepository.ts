import { IbcChecklistItemRecord } from "../types/IbcChecklist.types";

export type CreateIbcChecklistItemData = {
  descricao: string;
  critico: boolean;
};

export type UpdateIbcChecklistItemData = {
  descricao?: string;
  critico?: boolean;
  ativo?: boolean;
};

export interface IIbcChecklistItemRepository {
  list(): Promise<IbcChecklistItemRecord[]>;
  findById(id: string): Promise<IbcChecklistItemRecord | null>;
  create(data: CreateIbcChecklistItemData): Promise<IbcChecklistItemRecord>;
  updateById(id: string, data: UpdateIbcChecklistItemData): Promise<IbcChecklistItemRecord>;
}
