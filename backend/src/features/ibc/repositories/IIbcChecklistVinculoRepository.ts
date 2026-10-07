import { IbcChecklistVinculoDto } from "../types/IbcChecklist.types";

export interface IIbcChecklistVinculoRepository {
  listByIbc(ibcId: string): Promise<IbcChecklistVinculoDto[]>;
}
