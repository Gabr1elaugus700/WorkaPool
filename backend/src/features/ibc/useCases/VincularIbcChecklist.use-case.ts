import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { assertCanManageIbcChecklists } from "../permissions/assertCanManageIbcChecklists";
import { IIbcChecklistRepository } from "../repositories/IIbcChecklistRepository";
import { IIbcChecklistVinculoRepository } from "../repositories/IIbcChecklistVinculoRepository";
import { IbcChecklistVinculoDto } from "../types/IbcChecklist.types";
import { assertChecklistIbcAtivo } from "./assertChecklistIbcAtivo";
import { assertIbcAtivo, IbcLookup } from "./findIbcOrThrow";

export type VincularIbcChecklistInput = {
  actorRole: Role;
  actorId: string;
  ibcId: string;
  checklistModeloId: string;
};

type ChecklistLookup = Pick<IIbcChecklistRepository, "findElegibilidade">;

export class VincularIbcChecklistUseCase {
  private readonly ibcs: IbcLookup;
  private readonly checklists: ChecklistLookup;
  private readonly vinculos: IIbcChecklistVinculoRepository;

  constructor(ibcs: IbcLookup, checklists: ChecklistLookup, vinculos: IIbcChecklistVinculoRepository) {
    this.ibcs = ibcs;
    this.checklists = checklists;
    this.vinculos = vinculos;
  }

  async execute(input: VincularIbcChecklistInput): Promise<IbcChecklistVinculoDto> {
    assertCanManageIbcChecklists(input.actorRole);
    await assertIbcAtivo(this.ibcs, input.ibcId);
    await assertChecklistIbcAtivo(this.checklists, input.checklistModeloId);

    const vinculo = await this.vinculos.create({
      ibcId: input.ibcId,
      checklistModeloId: input.checklistModeloId,
      situacao: "ENTRADA_PATIO",
      vinculadoPorId: input.actorId,
    });
    if (!vinculo) {
      throw new AppError({
        message: "Checklist já vinculado a este IBC",
        statusCode: 409,
        code: "IBC_CHECKLIST_JA_VINCULADO",
        details: { checklistModeloId: input.checklistModeloId },
      });
    }
    return vinculo;
  }
}
