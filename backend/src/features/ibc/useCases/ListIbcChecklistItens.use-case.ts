import { IIbcChecklistItemRepository } from "../repositories/IIbcChecklistItemRepository";
import { IbcChecklistItemRecord } from "../types/IbcChecklist.types";

export class ListIbcChecklistItensUseCase {
  private readonly repository: IIbcChecklistItemRepository;

  constructor(repository: IIbcChecklistItemRepository) {
    this.repository = repository;
  }

  async execute(): Promise<IbcChecklistItemRecord[]> {
    return this.repository.list();
  }
}
