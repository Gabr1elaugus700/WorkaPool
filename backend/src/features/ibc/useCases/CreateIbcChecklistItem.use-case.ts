import { Role } from "@prisma/client";
import { assertCanManageIbcChecklists } from "../permissions/assertCanManageIbcChecklists";
import { IIbcChecklistItemRepository } from "../repositories/IIbcChecklistItemRepository";
import { IbcChecklistItemRecord } from "../types/IbcChecklist.types";
import {
  CreateItemHttpInput,
  toCreateChecklistItemData,
} from "../utils/ibcChecklistItemWrite";

export type CreateIbcChecklistItemInput = CreateItemHttpInput & {
  actorRole: Role;
};

export class CreateIbcChecklistItemUseCase {
  private readonly repository: IIbcChecklistItemRepository;

  constructor(repository: IIbcChecklistItemRepository) {
    this.repository = repository;
  }

  async execute(input: CreateIbcChecklistItemInput): Promise<IbcChecklistItemRecord> {
    assertCanManageIbcChecklists(input.actorRole);
    return this.repository.create(toCreateChecklistItemData(input));
  }
}
