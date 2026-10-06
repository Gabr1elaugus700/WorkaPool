import { IIbcChecklistRepository } from "../repositories/IIbcChecklistRepository";
import { IbcChecklistSummary } from "../types/IbcChecklist.types";

export class ListIbcChecklistsUseCase {
  private readonly repository: IIbcChecklistRepository;

  constructor(repository: IIbcChecklistRepository) {
    this.repository = repository;
  }

  async execute(): Promise<IbcChecklistSummary[]> {
    return this.repository.list();
  }
}
