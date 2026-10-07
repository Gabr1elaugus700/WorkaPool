import { IIbcChecklistVinculoRepository } from "../repositories/IIbcChecklistVinculoRepository";
import { IbcChecklistVinculoRecord } from "../types/IbcChecklist.types";
import { findIbcOrThrow, IbcLookup } from "./assertIbcAtivo";

export class ListIbcChecklistVinculosUseCase {
  private readonly ibcs: IbcLookup;
  private readonly vinculos: IIbcChecklistVinculoRepository;

  constructor(ibcs: IbcLookup, vinculos: IIbcChecklistVinculoRepository) {
    this.ibcs = ibcs;
    this.vinculos = vinculos;
  }

  async execute(ibcId: string): Promise<IbcChecklistVinculoRecord[]> {
    await findIbcOrThrow(this.ibcs, ibcId);
    return this.vinculos.listByIbc(ibcId);
  }
}
