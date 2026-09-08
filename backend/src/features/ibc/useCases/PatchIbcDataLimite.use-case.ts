import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";
import { AppError } from "../../../utils/AppError";

export type PatchIbcDataLimiteInput = {
  id: string;
  dataLimite: Date;
  identificador?: string;
};

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export class PatchIbcDataLimiteUseCase {
  private readonly repository: IIbcCadastroRepository;

  constructor(repository: IIbcCadastroRepository) {
    this.repository = repository;
  }

  async execute(input: PatchIbcDataLimiteInput): Promise<IbcCadastroRecord> {
    if (input.identificador !== undefined) {
      throw new AppError({
        message: "Identificador do IBC não pode ser alterado",
        statusCode: 400,
        code: "IBC_IDENTIFICADOR_IMUTAVEL",
        details: { identificador: input.identificador },
      });
    }

    const existing = await this.repository.findById(input.id);
    if (!existing || existing.baixadoEm != null) {
      throw new AppError({
        message: "IBC não encontrado",
        statusCode: 404,
        code: "IBC_NOT_FOUND",
        details: { id: input.id },
      });
    }

    const today = startOfUtcDay(new Date());
    if (startOfUtcDay(input.dataLimite) < today) {
      throw new AppError({
        message: "Data limite deve ser hoje ou uma data futura",
        statusCode: 400,
        code: "IBC_DATA_LIMITE_INVALIDA",
        details: { dataLimite: input.dataLimite },
      });
    }

    return this.repository.updateDataLimite(input.id, input.dataLimite);
  }
}
