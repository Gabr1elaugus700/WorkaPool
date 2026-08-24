import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import { AppError } from "../../../utils/AppError";

export type RemoveAlocacaoIbcInput = {
  alocacaoId: string;
};

export type RemoveAlocacaoIbcResult = {
  removed: boolean;
  identificador: string;
  numPed: string;
};

export class RemoveAlocacaoIbcUseCase {
  private readonly repository: IIbcExpedicaoRepository;

  constructor(repository?: IIbcExpedicaoRepository) {
    this.repository = repository ?? this.createDefaultRepository();
  }

  private createDefaultRepository(): IIbcExpedicaoRepository {
    // Lazy-load para evitar side effects de conexão SQL em testes unitários.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { IbcExpedicaoRepository } = require("../repositories/IbcExpedicaoRepository");
    return new IbcExpedicaoRepository();
  }

  async execute(input: RemoveAlocacaoIbcInput): Promise<RemoveAlocacaoIbcResult> {
    const { alocacaoId } = input;

    if (!alocacaoId?.trim()) {
      throw new AppError({
        message: "ID da alocação é obrigatório",
        statusCode: 400,
        code: "IBC_ALOCACAO_ID_REQUIRED",
        details: { alocacaoId },
      });
    }

    const alocacao = await this.repository.findAlocacaoById(alocacaoId);
    if (!alocacao) {
      throw new AppError({
        message: `Alocação ${alocacaoId} não encontrada`,
        statusCode: 404,
        code: "IBC_ALOCACAO_NOT_FOUND",
        details: { alocacaoId },
      });
    }

    if (alocacao.expedicaoIbcId) {
      throw new AppError({
        message: "Alocação já faz parte de uma expedição fechada e é imutável",
        statusCode: 409,
        code: "IBC_ALOCACAO_IMUTAVEL",
        details: {
          alocacaoId,
          expedicaoIbcId: alocacao.expedicaoIbcId,
        },
      });
    }

    const expedicao = await this.repository.findExpedicaoByCargaId(
      alocacao.cargaId,
    );
    if (expedicao) {
      throw new AppError({
        message: "Expedição já fechada; alocações não podem ser removidas",
        statusCode: 409,
        code: "IBC_ALOCACAO_IMUTAVEL",
        details: {
          alocacaoId,
          expedicaoIbcId: expedicao.id,
        },
      });
    }

    await this.repository.deleteAlocacao(alocacao.id);

    return {
      removed: true,
      identificador: alocacao.identificador,
      numPed: alocacao.numPed,
    };
  }
}
