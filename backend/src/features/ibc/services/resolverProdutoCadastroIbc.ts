import { AppError } from "../../../utils/AppError";
import type { IbcProdutoConfigRecord } from "../repositories/IbcProdutoRepository";
import { getIbcIdentifierPrefix } from "./getIbcIdentifierPrefix";

export type ProdutoCadastroLookup = {
  findByGrupoCodigo(grupoCodigo: string): Promise<IbcProdutoConfigRecord | null>;
  findUniversal(): Promise<IbcProdutoConfigRecord | null>;
};

export type CatalogoCadastroLookup = {
  hasGrupo(grupoCodigo: string): Promise<boolean>;
};

export type ProdutoCadastroResolvido = {
  produtoId: string;
  prefixo: string;
  corHex: string;
  universal: boolean;
  homologado: boolean;
};

function grupoInformado(grupoCodigo: string | null | undefined): string | null {
  const codigo = grupoCodigo?.trim() ?? "";
  return codigo.length > 0 ? codigo : null;
}

function naoConfigurado(grupoCodigo?: string): never {
  throw new AppError({
    message: grupoCodigo
      ? "Grupo sem configuração de placa ou fora do catálogo"
      : "Container universal sem configuração de placa",
    statusCode: 422,
    code: "IBC_PRODUTO_NAO_CONFIGURADO",
    details: grupoCodigo ? { grupoCodigo } : undefined,
  });
}

function grupoPronto(config: IbcProdutoConfigRecord | null): config is IbcProdutoConfigRecord & { sigla: string } {
  return config != null && !config.universal && config.sigla != null && /^[A-Z]{1,2}$/.test(config.sigla) && config.corHex.length > 0;
}

export async function resolverProdutoCadastroIbc(
  input: { homologado: boolean; grupoCodigo?: string | null },
  produtos: ProdutoCadastroLookup,
  catalogo: CatalogoCadastroLookup,
): Promise<ProdutoCadastroResolvido> {
  const grupoCodigo = grupoInformado(input.grupoCodigo);
  if (input.homologado && !grupoCodigo) {
    throw new AppError({
      message: "Container homologado exige grupo de produto",
      statusCode: 422,
      code: "IBC_PRODUTO_OBRIGATORIO",
    });
  }
  if (!grupoCodigo) {
    const universal = await produtos.findUniversal();
    if (!universal?.corHex) naoConfigurado();
    return {
      produtoId: universal.id,
      prefixo: getIbcIdentifierPrefix({ homologado: false, sigla: null }),
      corHex: universal.corHex,
      universal: true,
      homologado: false,
    };
  }
  const [noCatalogo, config] = await Promise.all([
    catalogo.hasGrupo(grupoCodigo),
    produtos.findByGrupoCodigo(grupoCodigo),
  ]);
  if (!noCatalogo || !grupoPronto(config)) naoConfigurado(grupoCodigo);
  return {
    produtoId: config.id,
    prefixo: getIbcIdentifierPrefix({ homologado: input.homologado, sigla: config.sigla }),
    corHex: config.corHex,
    universal: false,
    homologado: input.homologado,
  };
}
