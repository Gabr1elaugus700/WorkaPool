import { AppError } from "../../../utils/AppError";
import { IIbcChecklistRepository } from "../repositories/IIbcChecklistRepository";
import { IbcChecklistRecord } from "../types/IbcChecklist.types";

export function ibcChecklistNotFound(): AppError {
  return new AppError({
    message: "Checklist de IBC não encontrado",
    statusCode: 404,
    code: "IBC_CHECKLIST_NOT_FOUND",
  });
}

export class GetIbcChecklistUseCase {
  private readonly repository: IIbcChecklistRepository;

  constructor(repository: IIbcChecklistRepository) {
    this.repository = repository;
  }

  async execute(id: string): Promise<IbcChecklistRecord> {
    const checklist = await this.repository.findById(id);
    if (!checklist) throw ibcChecklistNotFound();
    return checklist;
  }
}
