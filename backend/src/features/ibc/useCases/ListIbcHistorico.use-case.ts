import { AppError } from "../../../utils/AppError";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IbcConversionHistoryRecord } from "../types/IbcCadastro.types";

export class ListIbcHistoricoUseCase {
  private readonly repository: IIbcCadastroRepository;

  constructor(repository: IIbcCadastroRepository) {
    this.repository = repository;
  }

  async execute(ibcId: string): Promise<IbcConversionHistoryRecord[]> {
    const ibc = await this.repository.findById(ibcId);
    if (!ibc) {
      throw new AppError({
        message: "IBC não encontrado",
        statusCode: 404,
        code: "IBC_NOT_FOUND",
        details: { id: ibcId },
      });
    }

    return this.repository.listConversionHistory(ibcId);
  }
}
