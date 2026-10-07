import { IbcChecklistVinculoDto } from "../types/IbcChecklist.types";

export type CreateIbcChecklistVinculoData = {
  ibcId: string;
  checklistModeloId: string;
  vinculadoPorId: string;
};

export interface IIbcChecklistVinculoRepository {
  listByIbc(ibcId: string): Promise<IbcChecklistVinculoDto[]>;
  /** Retorna `null` quando o par (ibcId, checklistModeloId) já existe. */
  create(data: CreateIbcChecklistVinculoData): Promise<IbcChecklistVinculoDto | null>;
  /** Retorna `false` quando não havia vínculo para apagar. */
  delete(ibcId: string, checklistModeloId: string): Promise<boolean>;
}
