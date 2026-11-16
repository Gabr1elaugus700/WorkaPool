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
import { resolveIbcChecklistMinimas } from "./resolveIbcChecklistMinimas";

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

    let notaMinimaCritico = input.notaMinimaCritico;
    let mediaMinima = input.mediaMinima;

    const minimaInformada =
      input.notaMinimaCritico !== undefined || input.mediaMinima !== undefined;

    if (input.itensIds || minimaInformada) {
      const itensParaMinima = input.itensIds
        ? await this.itemRepository.findManyByIds(input.itensIds)
        : existing.itens.map((item) => ({ tipo: item.tipo }));

      const minima = resolveIbcChecklistMinimas({
        itens: itensParaMinima,
        incoming: {
          notaMinimaCritico: input.notaMinimaCritico,
          mediaMinima: input.mediaMinima,
        },
        existing: {
          notaMinimaCritico: existing.notaMinimaCritico,
          mediaMinima: existing.mediaMinima,
        },
      });
      notaMinimaCritico = minima.notaMinimaCritico;
      mediaMinima = minima.mediaMinima;
    }

    return this.repository.updateById(input.id, {
      nome: input.nome?.trim(),
      notaMinimaCritico,
      mediaMinima,
      ativo: input.ativo,
      itensIds: input.itensIds,
    });
  }
}