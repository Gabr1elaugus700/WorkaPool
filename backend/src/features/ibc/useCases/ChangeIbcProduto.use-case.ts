import { AppError } from "../../../utils/AppError";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IIbcProdutoRepository } from "../repositories/IIbcProdutoRepository";
import { assertIbcNotReplaced } from "../services/assertIbcNotReplaced";
import {
  getIbcIdentifierPrefix,
  isHomologadoPrefixo,
  isNaoHomologadoPrefixo,
  resolveIbcPrefixo,
} from "../services/getIbcIdentifierPrefix";
import { IbcCadastroRecord, IbcProdutoRecord } from "../types/IbcCadastro.types";

export type ChangeIbcProdutoInput = {
  sourceIbcId: string;
  targetProdutoId: string;
  actorId: string;
  observation?: string | null;
};

function falha(statusCode: number, code: string, message: string, details?: unknown): never {
  throw new AppError({ statusCode, code, message, details });
}

function assertOrigemNaoHomologada(source: IbcCadastroRecord): void {
  const prefixo = resolveIbcPrefixo(source);
  if (!prefixo) {
    falha(409, "IBC_IDENTIFICADOR_INVALIDO", `Identificador inválido para mudança de produto: ${source.identificador}`, {
      identificador: source.identificador,
    });
  }
  if (isNaoHomologadoPrefixo(prefixo)) return;
  if (isHomologadoPrefixo(prefixo)) {
    falha(409, "IBC_HOMOLOGADO_PRODUTO_FIXO", "Container homologado não muda de produto", {
      identificador: source.identificador,
    });
  }
  falha(409, "IBC_IDENTIFICADOR_INVALIDO", `Identificador inválido para mudança de produto: ${source.identificador}`, {
    identificador: source.identificador,
    prefixo,
  });
}

/** NH + sigla do grupo, ou NH sem sigla no universal. Nunca HM. */
function prefixoNh(produto: IbcProdutoRecord): string {
  if (!produto.corHex || (!produto.universal && !produto.sigla)) {
    falha(422, "IBC_PRODUTO_NAO_CONFIGURADO", "Destino sem configuração de placa", { id: produto.id });
  }
  return getIbcIdentifierPrefix({
    homologado: false,
    sigla: produto.universal ? null : produto.sigla,
  });
}

export class ChangeIbcProdutoUseCase {
  constructor(
    private readonly repository: IIbcCadastroRepository,
    private readonly produtoRepository: IIbcProdutoRepository,
  ) {}

  async execute(input: ChangeIbcProdutoInput): Promise<IbcCadastroRecord> {
    const source = await this.repository.findById(input.sourceIbcId);
    if (!source) {
      falha(404, "IBC_NOT_FOUND", "IBC não encontrado", { id: input.sourceIbcId });
    }
    assertIbcNotReplaced(source);
    assertOrigemNaoHomologada(source);

    const targetProduto = await this.produtoRepository.findById(input.targetProdutoId);
    if (!targetProduto) {
      falha(404, "IBC_PRODUTO_NOT_FOUND", "Produto de container não encontrado", { id: input.targetProdutoId });
    }
    if (source.produtoId === targetProduto.id) {
      falha(409, "IBC_PRODUTO_UNCHANGED", "Produto de destino deve ser diferente do atual", {
        produtoId: targetProduto.id,
      });
    }

    return this.repository.createDerivedIbcFromSource({
      sourceIbcId: source.id,
      prefixo: prefixoNh(targetProduto),
      produtoId: targetProduto.id,
      changeType: "product_change",
      actorId: input.actorId,
      observation: input.observation?.trim() || null,
      placa: {
        identificadorAnterior: source.identificador,
        corAnterior: source.corHex ?? null,
        corNova: targetProduto.corHex,
      },
    });
  }
}
