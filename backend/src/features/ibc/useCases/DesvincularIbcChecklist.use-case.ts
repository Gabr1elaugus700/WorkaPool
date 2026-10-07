import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { assertCanManageIbcChecklists } from "../permissions/assertCanManageIbcChecklists";
import { IIbcChecklistVinculoRepository } from "../repositories/IIbcChecklistVinculoRepository";
import { assertIbcAtivo, IbcLookup } from "./findIbcOrThrow";

export type DesvincularIbcChecklistInput = {
  actorRole: Role;
  ibcId: string;
  checklistModeloId: string;
};

export class DesvincularIbcChecklistUseCase {
  private readonly ibcs: IbcLookup;
  private readonly vinculos: IIbcChecklistVinculoRepository;

  constructor(ibcs: IbcLookup, vinculos: IIbcChecklistVinculoRepository) {
    this.ibcs = ibcs;
    this.vinculos = vinculos;
  }

  async execute(input: DesvincularIbcChecklistInput): Promise<void> {
    assertCanManageIbcChecklists(input.actorRole);
    await assertIbcAtivo(this.ibcs, input.ibcId);

    const removido = await this.vinculos.delete(input.ibcId, input.checklistModeloId);
    if (!removido) {
      throw new AppError({
        message: "Checklist não está vinculado a este IBC",
        statusCode: 404,
        code: "IBC_CHECKLIST_VINCULO_NOT_FOUND",
        details: { ibcId: input.ibcId, checklistModeloId: input.checklistModeloId },
      });
    }
  }
}
