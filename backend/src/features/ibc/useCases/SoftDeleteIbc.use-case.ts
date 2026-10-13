import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";
import { AppError } from "../../../utils/AppError";

export type SoftDeleteIbcInput = {
  id: string;
};

export class SoftDeleteIbcUseCase {
  private readonly repository: IIbcCadastroRepository;

  constructor(repository: IIbcCadastroRepository) {
    this.repository = repository;
  }

  async execute(input: SoftDeleteIbcInput): Promise<IbcCadastroRecord> {
    const existing = await this.repository.findById(input.id);
    if (!existing || existing.baixadoEm != null) {
      throw new AppError({
        message: "IBC não encontrado",
        statusCode: 404,
        code: "IBC_NOT_FOUND",
        details: { id: input.id },
      });
    }

    if (existing.custodia === "EM_VIAGEM" || existing.custodia === "CLIENTE" || existing.motivoBaixa != null) {
      throw new AppError({
        message: "IBC em viagem, no cliente ou já baixado na viagem não pode ser excluído",
        statusCode: 409,
        code: "IBC_BAIXA_BLOQUEADA",
        details: { id: input.id, custodia: existing.custodia, motivoBaixa: existing.motivoBaixa ?? null },
      });
    }

    const allocated = await this.repository.hasOpenAlocacao(input.id);
    if (allocated) {
      throw new AppError({
        message: "IBC alocado não pode ser baixado",
        statusCode: 409,
        code: "IBC_BAIXA_BLOQUEADA",
        details: { id: input.id, allocated: true },
      });
    }

    return this.repository.softDelete(input.id);
  }
}
