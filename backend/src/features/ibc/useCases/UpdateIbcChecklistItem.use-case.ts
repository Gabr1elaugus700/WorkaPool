import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { assertCanManageIbcChecklists } from "../permissions/assertCanManageIbcChecklists";
import {
  IIbcChecklistItemRepository,
  UpdateIbcChecklistItemData,
} from "../repositories/IIbcChecklistItemRepository";
import { IbcChecklistItemRecord } from "../types/IbcChecklist.types";

export type UpdateIbcChecklistItemInput = UpdateIbcChecklistItemData & {
  actorRole: Role;
  id: string;
};

export class UpdateIbcChecklistItemUseCase {
  private readonly repository: IIbcChecklistItemRepository;

  constructor(repository: IIbcChecklistItemRepository) {
    this.repository = repository;
  }

  async execute(input: UpdateIbcChecklistItemInput): Promise<IbcChecklistItemRecord> {
    assertCanManageIbcChecklists(input.actorRole);
    const existing = await this.repository.findById(input.id);
    if (!existing) {
      throw new AppError({
        message: "Item de checklist não encontrado",
        statusCode: 404,
        code: "IBC_CHECKLIST_ITEM_NOT_FOUND",
      });
    }

    return this.repository.updateById(input.id, {
      descricao: input.descricao?.trim(),
      critico: input.critico,
      ativo: input.ativo,
    });
  }
}
