import { IbcChecklistRecord, IbcChecklistSummary } from "../types/IbcChecklist.types";

export type CreateIbcChecklistData = {
  nome: string;
  notaMinimaCritico: number;
  mediaMinima: number;
  itensIds: string[];
};

export interface IIbcChecklistRepository {
  list(): Promise<IbcChecklistSummary[]>;
  findById(id: string): Promise<IbcChecklistRecord | null>;
  create(data: CreateIbcChecklistData): Promise<IbcChecklistRecord>;
}
