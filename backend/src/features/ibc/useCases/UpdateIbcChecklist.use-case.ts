import { Role } from "@prisma/client";
import { assertCanManageIbcChecklists } from "../permissions/assertCanManageIbcChecklists";
import {
  IIbcChecklistRepository,
  UpdateIbcChecklistData,
} from "../repositories/IIbcChecklistRepository";
import { IIbcChecklistItemRepository } from "../repositories/IIbcChecklistItemRepository";
import { IbcChecklistRecord } from "../types/IbcChecklist.types";
import { assertIbcChecklistItensElegiveis } from "./assertIbcChecklistItensElegiveis";
import { ibcChecklistNotFound } from "./GetIbcChecklist.use-case";

export type UpdateIbcChecklistInput = UpdateIbcChecklistData & {
  actorRole: Role;
  id: string;
};

export class UpdateIbcChecklistUseCase {
  private readonly repository: IIbcChecklistRepository;
  private readonly itemRepository: IIbcChecklistItemRepository;

  constructor(repository: IIbcChecklistRepository, itemRepository: IIbcChecklistItemRepository) {
    this.repository = repository;
    this.itemRepository = itemRepository;
  }

  async execute(input: UpdateIbcChecklistInput): Promise<IbcChecklistRecord> {
    assertCanManageIbcChecklists(input.actorRole);
    const existing = await this.repository.findById(input.id);
    if (!existing) throw ibcChecklistNotFound();

    if (input.itensIds) {
      const idsJaPresentes = new Set(existing.itens.map((item) => item.itemId));
      await assertIbcChecklistItensElegiveis(this.itemRepository, input.itensIds, idsJaPresentes);
    }

    return this.repository.updateById(input.id, {
      nome: input.nome?.trim(),
      notaMinimaCritico: input.notaMinimaCritico,
      mediaMinima: input.mediaMinima,
      ativo: input.ativo,
      itensIds: input.itensIds,
    });
  }
}
