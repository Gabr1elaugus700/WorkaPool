import { AppError } from "../../../utils/AppError";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IIbcProdutoRepository } from "../repositories/IIbcProdutoRepository";
import {
  getIbcIdentifierPrefix,
  isNaoHomologadoPrefixo,
  resolveIbcPrefixo,
} from "../services/getIbcIdentifierPrefix";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";

export type ChangeIbcProdutoInput = {
  sourceIbcId: string;
  targetProdutoId: string;
  actorId: string;
  observation?: string | null;
};

function isSourceNaoHomologado(source: IbcCadastroRecord): boolean {
  const prefixo = resolveIbcPrefixo(source);
  if (!prefixo) {
    throw new AppError({
      message: `Identificador inválido para mudança de produto: ${source.identificador}`,
      statusCode: 409,
      code: "IBC_IDENTIFICADOR_INVALIDO",
      details: { identificador: source.identificador },
    });
  }
  return isNaoHomologadoPrefixo(prefixo);
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

    return this.repository.createDerivedIbcFromSource({
      sourceIbcId: source.id,
      prefixo: getIbcIdentifierPrefix(
        targetProduto.abreviacao,
        !isSourceNaoHomologado(source),
      ),
      produtoId: targetProduto.id,
      changeType: "product_change",
      actorId: input.actorId,
      observation: input.observation?.trim() || null,
    });
  }
}
