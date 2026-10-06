import { Role } from "@prisma/client";
import { assertCanManageIbcChecklists } from "../permissions/assertCanManageIbcChecklists";
import { IIbcChecklistItemRepository } from "../repositories/IIbcChecklistItemRepository";
import { IbcChecklistItemRecord } from "../types/IbcChecklist.types";

export type CreateIbcChecklistItemInput = {
  actorRole: Role;
  descricao: string;
  critico: boolean;
};

export class CreateIbcChecklistItemUseCase {
  private readonly repository: IIbcChecklistItemRepository;

  constructor(repository: IIbcChecklistItemRepository) {
    this.repository = repository;
  }

  async execute(input: CreateIbcChecklistItemInput): Promise<IbcChecklistItemRecord> {
    assertCanManageIbcChecklists(input.actorRole);
    return this.repository.create({
      descricao: input.descricao.trim(),
      critico: input.critico,
    });
  }
}
