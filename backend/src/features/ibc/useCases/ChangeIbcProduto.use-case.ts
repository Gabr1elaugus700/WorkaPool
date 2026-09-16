import { AppError } from "../../../utils/AppError";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IIbcProdutoRepository } from "../repositories/IIbcProdutoRepository";
import { getIbcIdentifierPrefix } from "../services/getIbcIdentifierPrefix";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";

export type ChangeIbcProdutoInput = {
  sourceIbcId: string;
  targetProdutoId: string;
  actorId: string;
  observation?: string | null;
};

function nextIdentifier(currentHighest: string): string {
  const match = /^([A-Z]+)(\d{5})$/.exec(currentHighest);
  if (!match) {
    throw new AppError({
      message: `Identificador inválido para mudança de produto: ${currentHighest}`,
      statusCode: 409,
      code: "IBC_IDENTIFICADOR_INVALIDO",
      details: { identificador: currentHighest },
    });
  }

  const prefix = match[1];
  const next = Number(match[2]) + 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

function isNonHomologated(identificador: string): boolean {
  const match = /^([A-Z]+)(\d{5})$/.exec(identificador);
  if (!match) {
    throw new AppError({
      message: `Identificador inválido para mudança de produto: ${identificador}`,
      statusCode: 409,
      code: "IBC_IDENTIFICADOR_INVALIDO",
      details: { identificador },
    });
  }

  return match[1].startsWith("NHM");
}

export class ChangeIbcProdutoUseCase {
  private readonly repository: IIbcCadastroRepository;
  private readonly produtoRepository: IIbcProdutoRepository;

  constructor(
    repository: IIbcCadastroRepository,
    produtoRepository: IIbcProdutoRepository,
  ) {
    this.repository = repository;
    this.produtoRepository = produtoRepository;
  }

  async execute(input: ChangeIbcProdutoInput): Promise<IbcCadastroRecord> {
    const source = await this.repository.findById(input.sourceIbcId);
    if (!source) {
      throw new AppError({
        message: "IBC não encontrado",
        statusCode: 404,
        code: "IBC_NOT_FOUND",
        details: { id: input.sourceIbcId },
      });
    }

    const targetProduto = await this.produtoRepository.findById(input.targetProdutoId);
    if (!targetProduto) {
      throw new AppError({
        message: "Produto de container não encontrado",
        statusCode: 404,
        code: "IBC_PRODUTO_NOT_FOUND",
        details: { id: input.targetProdutoId },
      });
    }

    if (source.produtoId === targetProduto.id) {
      throw new AppError({
        message: "Produto de destino deve ser diferente do atual",
        statusCode: 409,
        code: "IBC_PRODUTO_UNCHANGED",
        details: { produtoId: targetProduto.id },
      });
    }

    const prefix = getIbcIdentifierPrefix(
      targetProduto.abreviacao,
      !isNonHomologated(source.identificador),
    );
    const highest = await this.repository.findHighestIdentificadorByPrefix(prefix);
    const identificador = highest ? nextIdentifier(highest) : `${prefix}00001`;

    return this.repository.createDerivedIbcFromSource({
      sourceIbcId: source.id,
      identificador,
      produtoId: targetProduto.id,
      changeType: "product_change",
      actorId: input.actorId,
      observation: input.observation?.trim() || null,
    });
  }
}
