import { ChecklistTipo } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { IIbcChecklistRepository } from "../repositories/IIbcChecklistRepository";
import { ibcChecklistNotFound } from "./GetIbcChecklist.use-case";

type ChecklistLookup = Pick<IIbcChecklistRepository, "findElegibilidade">;

export async function assertChecklistIbcAtivo(
  checklists: ChecklistLookup,
  checklistModeloId: string,
): Promise<void> {
  const checklist = await checklists.findElegibilidade(checklistModeloId);
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
