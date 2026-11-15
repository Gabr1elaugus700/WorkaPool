import { Role } from "@prisma/client";
import { assertCanManageIbcChecklists } from "../permissions/assertCanManageIbcChecklists";
import {
  CreateIbcChecklistData,
  IIbcChecklistRepository,
} from "../repositories/IIbcChecklistRepository";
import { IIbcChecklistItemRepository } from "../repositories/IIbcChecklistItemRepository";
import { IbcChecklistRecord } from "../types/IbcChecklist.types";
import { assertIbcChecklistItensElegiveis } from "./assertIbcChecklistItensElegiveis";
import { resolveIbcChecklistMinimas } from "./resolveIbcChecklistMinimas";

export type CreateIbcChecklistInput = {
  actorRole: Role;
  nome: string;
  notaMinimaCritico?: number | null;
  mediaMinima?: number | null;
  itensIds: string[];
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

    const catalogo = await this.itemRepository.findManyByIds(input.itensIds);
    const minima = resolveIbcChecklistMinimas({
      itens: catalogo,
      incoming: {
        notaMinimaCritico: input.notaMinimaCritico,
        mediaMinima: input.mediaMinima,
      },
    });

    const data: CreateIbcChecklistData = {
      nome: input.nome.trim(),
      notaMinimaCritico: minima.notaMinimaCritico,
      mediaMinima: minima.mediaMinima,
      itensIds: input.itensIds,
    };

    return this.repository.create(data);
  }
}