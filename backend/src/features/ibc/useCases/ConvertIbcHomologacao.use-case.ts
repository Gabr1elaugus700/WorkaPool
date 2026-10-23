import { AppError } from "../../../utils/AppError";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { assertIbcNotReplaced } from "../services/assertIbcNotReplaced";
import {
  isHomologadoPrefixo,
  isNaoHomologadoPrefixo,
  resolveIbcPrefixo,
  getIbcIdentifierPrefix,
} from "../services/getIbcIdentifierPrefix";
import {
  CatalogoCadastroLookup,
  ProdutoCadastroLookup,
  ProdutoCadastroResolvido,
  resolverProdutoCadastroIbc,
} from "../services/resolverProdutoCadastroIbc";
import { IbcCadastroRecord, IbcPlacaSnapshotInput, IbcProdutoRecord } from "../types/IbcCadastro.types";

export type ConvertIbcDestino = "manter_grupo" | "universal";

export type ConvertIbcHomologacaoInput = {
  sourceIbcId: string;
  actorId: string;
  observation?: string | null;
  destino: ConvertIbcDestino;
  /** Obrigatório no legado sem produto quando o destino é um grupo. */
  grupoCodigo?: string | null;
};

type ProdutosDaConversao = ProdutoCadastroLookup & {
  findById(id: string): Promise<IbcProdutoRecord | null>;
};

function falha(statusCode: number, code: string, message: string, details?: unknown): never {
  throw new AppError({ statusCode, code, message, details });
}

function assertOrigemHomologada(source: IbcCadastroRecord): void {
  const prefixo = resolveIbcPrefixo(source);
  if (!prefixo) {
    falha(409, "IBC_IDENTIFICADOR_INVALIDO", `Identificador inválido para conversão: ${source.identificador}`, {
      identificador: source.identificador,
    });
  }
  if (isNaoHomologadoPrefixo(prefixo)) {
    falha(409, "IBC_ALREADY_NON_HOMOLOGATED", "IBC já está não homologado", {
      identificador: source.identificador,
    });
  }
  if (!isHomologadoPrefixo(prefixo)) {
    falha(409, "IBC_PREFIXO_HOMOLOGADO_INVALIDO", "Conversão exige prefixo homologado iniciado por HM", {
      identificador: source.identificador,
      prefixo,
    });
  }
}

function placaDe(source: IbcCadastroRecord, corNova: string): IbcPlacaSnapshotInput {
  return {
    identificadorAnterior: source.identificador,
    corAnterior: source.corHex ?? null,
    corNova,
  };
}

export class ConvertIbcHomologacaoUseCase {
  constructor(
    private readonly repository: IIbcCadastroRepository,
    private readonly produtos: ProdutosDaConversao,
    private readonly catalogo: CatalogoCadastroLookup,
  ) {}

  async execute(input: ConvertIbcHomologacaoInput): Promise<IbcCadastroRecord> {
    const source = await this.repository.findById(input.sourceIbcId);
    if (!source) {
      falha(404, "IBC_NOT_FOUND", "IBC não encontrado", { id: input.sourceIbcId });
    }
    assertIbcNotReplaced(source);
    assertOrigemHomologada(source);

    const destino = await this.resolverDestino(source, input);
    return this.repository.createDerivedIbcFromSource({
      sourceIbcId: source.id,
      prefixo: destino.prefixo,
      produtoId: destino.produtoId,
      changeType: "conversion",
      actorId: input.actorId,
      observation: input.observation?.trim() || null,
      placa: placaDe(source, destino.corHex),
    });
  }

  private async resolverDestino(
    source: IbcCadastroRecord,
    input: ConvertIbcHomologacaoInput,
  ): Promise<ProdutoCadastroResolvido> {
    if (input.destino === "universal") {
      return resolverProdutoCadastroIbc({ homologado: false }, this.produtos, this.catalogo);
    }

    if (source.produtoId) {
      const produto = await this.produtos.findById(source.produtoId);
      if (produto && !produto.universal && produto.sigla) {
        return {
          produtoId: produto.id,
          prefixo: getIbcIdentifierPrefix({ homologado: false, sigla: produto.sigla }),
          corHex: produto.corHex,
          universal: false,
          homologado: false,
        };
      }
    }

    const grupoCodigo = input.grupoCodigo?.trim() || null;
    if (!grupoCodigo) {
      falha(422, "IBC_PRODUTO_OBRIGATORIO", "Conversão sem grupo exige escolher um grupo ou o universal");
    }
    return resolverProdutoCadastroIbc(
      { homologado: false, grupoCodigo },
      this.produtos,
      this.catalogo,
    );
  }
}
