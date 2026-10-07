import { IbcChecklistVinculoRecord } from "../types/IbcChecklist.types";

export type CreateIbcChecklistVinculoData = {
  ibcId: string;
  checklistModeloId: string;
  vinculadoPorId: string;
};

export interface IIbcChecklistVinculoRepository {
  listByIbc(ibcId: string): Promise<IbcChecklistVinculoRecord[]>;
  /** Retorna `null` quando o par (ibcId, checklistModeloId) já existe. */
  create(data: CreateIbcChecklistVinculoData): Promise<IbcChecklistVinculoRecord | null>;
  /** Retorna `false` quando não havia vínculo para apagar. */
  delete(ibcId: string, checklistModeloId: string): Promise<boolean>;
}
