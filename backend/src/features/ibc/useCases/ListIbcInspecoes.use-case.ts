import { IIbcInspecaoLeituraRepository } from "../repositories/IIbcInspecaoLeituraRepository";
import { IbcInspecaoHistoricoDto } from "../types/IbcInspecao.types";
import { findIbcOrThrow, IbcLookup } from "./findIbcOrThrow";

export class ListIbcInspecoesUseCase {
  private readonly ibcs: IbcLookup;
  private readonly inspecoes: Pick<IIbcInspecaoLeituraRepository, "listByIbc">;

  constructor(ibcs: IbcLookup, inspecoes: Pick<IIbcInspecaoLeituraRepository, "listByIbc">) {
    this.ibcs = ibcs;
    this.inspecoes = inspecoes;
  }

  async execute(ibcId: string): Promise<IbcInspecaoHistoricoDto[]> {
    await findIbcOrThrow(this.ibcs, ibcId);
    return this.inspecoes.listByIbc(ibcId);
  }
}
