import { IbcChecklistVinculoRecord } from "../types/IbcChecklist.types";

export interface IIbcChecklistVinculoRepository {
  listByIbc(ibcId: string): Promise<IbcChecklistVinculoRecord[]>;
}
