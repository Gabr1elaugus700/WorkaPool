import type { Role } from "@prisma/client";
import { assertCanOperarEntradaPatio } from "../permissions/assertCanOperarEntradaPatio";
import { IIbcEntradaPatioRepository } from "../repositories/IIbcEntradaPatioRepository";
import { EntradaPatioFilaItem } from "../types/IbcEntradaPatio.types";

export class ListEntradasPatioPendentesUseCase {
  private readonly entradas: Pick<IIbcEntradaPatioRepository, "listPendentes">;

  constructor(entradas: Pick<IIbcEntradaPatioRepository, "listPendentes">) {
    this.entradas = entradas;
  }

  async execute(actorRole: Role): Promise<EntradaPatioFilaItem[]> {
    assertCanOperarEntradaPatio(actorRole);
    return this.entradas.listPendentes();
  }
}
