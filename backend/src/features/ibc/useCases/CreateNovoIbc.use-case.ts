import { allocateNextIbcIdentifier } from "../services/allocateNextIbcIdentifier";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";
import { AppError } from "../../../utils/AppError";

export type CreateNovoIbcInput = {
  dataLimite: Date;
};

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export class CreateNovoIbcUseCase {
  private readonly repository: IIbcCadastroRepository;

  constructor(repository: IIbcCadastroRepository) {
    this.repository = repository;
  }

  async execute(input: CreateNovoIbcInput): Promise<IbcCadastroRecord> {
    const today = startOfUtcDay(new Date());
    const dataLimiteDay = startOfUtcDay(input.dataLimite);

    if (dataLimiteDay < today) {
      throw new AppError({
        message: "Data limite deve ser hoje ou uma data futura",
        statusCode: 400,
        code: "IBC_DATA_LIMITE_INVALIDA",
        details: { dataLimite: input.dataLimite },
      });
    }

    const highest = await this.repository.findHighestIdentificador();
    const identificador = highest
      ? allocateNextIbcIdentifier(highest)
      : "HM00001";

    return this.repository.createNovoIbc({
      identificador,
      tipoCadastro: "NOVO",
      aptidao: "INAPTO",
      motivoInaptidao: "AGUARDANDO_INSPECAO",
      custodia: "PATIO",
      dataLimite: input.dataLimite,
    });
  }
}
