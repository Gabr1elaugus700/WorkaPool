import { allocateNextIbcIdentifier } from "../services/allocateNextIbcIdentifier";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IIbcProdutoRepository } from "../repositories/IIbcProdutoRepository";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";
import { AppError } from "../../../utils/AppError";
import { getIbcIdentifierPrefix } from "../services/getIbcIdentifierPrefix";

export type CreateNovoIbcInput = {
  dataLimite: Date;
  produtoId: string;
};

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export class CreateNovoIbcUseCase {
  private readonly repository: IIbcCadastroRepository;
  private readonly produtoRepository: IIbcProdutoRepository;

  constructor(
    repository: IIbcCadastroRepository,
    produtoRepository: IIbcProdutoRepository,
  ) {
    this.repository = repository;
    this.produtoRepository = produtoRepository;
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

    const produto = await this.produtoRepository.findById(input.produtoId);
    if (!produto) {
      throw new AppError({
        message: "Produto de container não encontrado",
        statusCode: 404,
        code: "IBC_PRODUTO_NOT_FOUND",
      });
    }

    const prefix = getIbcIdentifierPrefix(produto.abreviacao);
    const highest = await this.repository.findHighestIdentificadorByPrefix(prefix);
    const identificador = highest
      ? allocateNextIbcIdentifier(highest)
      : `${prefix}00001`;

    return this.repository.createNovoIbc({
      identificador,
      tipoCadastro: "NOVO",
      aptidao: "INAPTO",
      motivoInaptidao: "AGUARDANDO_INSPECAO",
      custodia: "PATIO",
      dataLimite: input.dataLimite,
      produtoId: produto.id,
    });
  }
}
