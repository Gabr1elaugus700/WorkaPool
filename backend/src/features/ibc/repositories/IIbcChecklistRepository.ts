import {
  IbcChecklistElegibilidade,
  IbcChecklistRecord,
  IbcChecklistSummary,
} from "../types/IbcChecklist.types";

export type CreateIbcChecklistData = {
  nome: string;
  notaMinimaCritico: number;
  mediaMinima: number;
  itensIds: string[];
};

export type UpdateIbcChecklistData = {
  nome?: string;
  notaMinimaCritico?: number;
  mediaMinima?: number;
  ativo?: boolean;
  itensIds?: string[];
};

export interface IIbcChecklistRepository {
  list(): Promise<IbcChecklistSummary[]>;
  findById(id: string): Promise<IbcChecklistRecord | null>;
  /** Busca qualquer `ChecklistModelo`, inclusive VISTORIA. */
  findElegibilidade(id: string): Promise<IbcChecklistElegibilidade | null>;
  create(data: CreateIbcChecklistData): Promise<IbcChecklistRecord>;
  updateById(id: string, data: UpdateIbcChecklistData): Promise<IbcChecklistRecord>;
}
