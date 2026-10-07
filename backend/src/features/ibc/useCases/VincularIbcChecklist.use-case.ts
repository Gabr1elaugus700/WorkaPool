import { ChecklistTipo, Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { assertCanManageIbcChecklists } from "../permissions/assertCanManageIbcChecklists";
import { IIbcChecklistRepository } from "../repositories/IIbcChecklistRepository";
import { IIbcChecklistVinculoRepository } from "../repositories/IIbcChecklistVinculoRepository";
import { IbcChecklistVinculoRecord } from "../types/IbcChecklist.types";
import { assertIbcAtivo, IbcLookup } from "./assertIbcAtivo";
import { ibcChecklistNotFound } from "./GetIbcChecklist.use-case";

export type VincularIbcChecklistInput = {
  actorRole: Role;
  actorId: string;
  ibcId: string;
  checklistModeloId: string;
};

type ChecklistLookup = Pick<IIbcChecklistRepository, "findTipoEAtivo">;

export class VincularIbcChecklistUseCase {
  private readonly ibcs: IbcLookup;
  private readonly checklists: ChecklistLookup;
  private readonly vinculos: IIbcChecklistVinculoRepository;

  constructor(ibcs: IbcLookup, checklists: ChecklistLookup, vinculos: IIbcChecklistVinculoRepository) {
    this.ibcs = ibcs;
    this.checklists = checklists;
    this.vinculos = vinculos;
  }

  async execute(input: VincularIbcChecklistInput): Promise<IbcChecklistVinculoRecord> {
    assertCanManageIbcChecklists(input.actorRole);
    await assertIbcAtivo(this.ibcs, input.ibcId);
    await this.assertChecklistVinculavel(input.checklistModeloId);

    const vinculo = await this.vinculos.create({
      ibcId: input.ibcId,
      checklistModeloId: input.checklistModeloId,
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

  private async assertChecklistVinculavel(checklistModeloId: string): Promise<void> {
    const checklist = await this.checklists.findTipoEAtivo(checklistModeloId);
    if (!checklist) throw ibcChecklistNotFound();
    if (checklist.tipo !== ChecklistTipo.IBC) {
      throw new AppError({
        message: "Só checklists de IBC podem ser vinculados a um IBC",
        statusCode: 422,
        code: "IBC_CHECKLIST_TIPO_INVALIDO",
        details: { checklistModeloId, tipo: checklist.tipo },
      });
    }
    if (!checklist.ativo) {
      throw new AppError({
        message: "Checklist inativo não pode ser vinculado",
        statusCode: 422,
        code: "IBC_CHECKLIST_INATIVO",
        details: { checklistModeloId },
      });
    }
  }
}
