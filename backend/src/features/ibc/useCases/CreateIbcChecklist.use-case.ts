import { Role } from "@prisma/client";
import { assertCanManageIbcChecklists } from "../permissions/assertCanManageIbcChecklists";
import {
  CreateIbcChecklistData,
  IIbcChecklistRepository,
} from "../repositories/IIbcChecklistRepository";
import { IIbcChecklistItemRepository } from "../repositories/IIbcChecklistItemRepository";
import { IbcChecklistRecord } from "../types/IbcChecklist.types";
import { assertIbcChecklistItensElegiveis } from "./assertIbcChecklistItensElegiveis";

export type CreateIbcChecklistInput = CreateIbcChecklistData & {
  actorRole: Role;
};

export class CreateIbcChecklistUseCase {
  private readonly repository: IIbcChecklistRepository;
  private readonly itemRepository: IIbcChecklistItemRepository;

  constructor(repository: IIbcChecklistRepository, itemRepository: IIbcChecklistItemRepository) {
    this.repository = repository;
    this.itemRepository = itemRepository;
  }

  async execute(input: CreateIbcChecklistInput): Promise<IbcChecklistRecord> {
    assertCanManageIbcChecklists(input.actorRole);
    await assertIbcChecklistItensElegiveis(this.itemRepository, input.itensIds);

    return this.repository.create({
      nome: input.nome.trim(),
      notaMinimaCritico: input.notaMinimaCritico,
      mediaMinima: input.mediaMinima,
      itensIds: input.itensIds,
    });
  }
}
