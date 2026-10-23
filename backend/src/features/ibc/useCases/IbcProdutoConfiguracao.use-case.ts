import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import type { IbcProdutoConfigRecord, IIbcProdutoConfigRepository } from "../repositories/IbcProdutoRepository";
import type { IProdutoGrupoCatalogoRepository } from "../repositories/ProdutoGrupoCatalogoRepository";
import type { GrupoConfigItem, ListaIbcProdutoConfig, UniversalConfigItem } from "../http/schemas/IbcProdutoSchema";

const LEITURA = new Set<Role>([Role.ADMIN, Role.ALMOX, Role.LOGISTICA, Role.GERENTE_DPTO]);
const TRAVA = "Sigla e cor não podem mudar: já existe container usando esta configuração";
function falha(statusCode: number, code: string, message: string, details?: unknown): never {
  throw new AppError({ message, statusCode, code, details });
}
function assertAcesso(role: Role, escrita: boolean): void {
  if (escrita ? role === Role.ADMIN || role === Role.ALMOX : LEITURA.has(role)) return;
  falha(403, "IBC_PRODUTO_CONFIG_FORBIDDEN", escrita
    ? "Apenas ADMIN e ALMOX configuram o produto do container"
    : "Sem permissão para ler a configuração de produto");
}
function normalizarSigla(value: string): string {
  const sigla = value.trim().toUpperCase();
  if (!/^[A-Z]{1,2}$/.test(sigla)) falha(400, "IBC_PRODUTO_SIGLA_INVALIDA", "Sigla deve ter 1 ou 2 letras de A a Z", { sigla: value });
  return sigla;
}
function normalizarCor(value: string): string {
  const corHex = value.trim().toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(corHex)) falha(400, "IBC_PRODUTO_COR_INVALIDA", "Cor da placa deve estar no formato #RRGGBB", { corHex: value });
  return corHex;
}
function grupoItem(codigo: string, descricao: string | null, config: IbcProdutoConfigRecord | null, noSapiens: boolean): GrupoConfigItem {
  return {
    id: config?.id ?? null, grupoCodigo: codigo, grupoDescricao: descricao, sigla: config?.sigla ?? null,
    corHex: config?.corHex ?? null, configurado: config?.sigla != null && config.corHex != null,
    emUso: config?.emUso ?? false, encontradoNoSapiens: noSapiens,
  };
}
function universalItem(config: IbcProdutoConfigRecord | null): UniversalConfigItem {
  return { id: config?.id ?? null, corHex: config?.corHex ?? null, configurado: config != null, emUso: config?.emUso ?? false };
}
function assertLivre(configs: IbcProdutoConfigRecord[], exceptId: string | undefined, sigla: string | null, corHex: string): void {
  if (configs.some((config) => config.id !== exceptId && config.corHex === corHex)) {
    falha(409, "IBC_PRODUTO_COR_EM_USO", "Cor da placa já usada em outra configuração");
  }
  if (sigla && configs.some((config) => config.id !== exceptId && config.sigla === sigla)) {
    falha(409, "IBC_PRODUTO_SIGLA_DUPLICADA", "Sigla já usada em outra configuração");
  }
}

export class IbcProdutoConfiguracaoUseCase {
  constructor(private readonly configs: IIbcProdutoConfigRepository, private readonly catalogo: IProdutoGrupoCatalogoRepository) {}
  async list(role: Role): Promise<ListaIbcProdutoConfig> {
    assertAcesso(role, false);
    const [catalogo, configs] = await Promise.all([this.catalogo.listDistinct(), this.configs.list()]);
    const porCodigo = new Map<string, IbcProdutoConfigRecord>();
    let universal: IbcProdutoConfigRecord | null = null;
    for (const config of configs) {
      if (config.universal) universal = universal ?? config;
      else if (config.grupoCodigo && !porCodigo.has(config.grupoCodigo)) porCodigo.set(config.grupoCodigo, config);
    }
    const vistos = new Set<string>();
    const grupos: GrupoConfigItem[] = [];
    for (const grupo of catalogo) {
      if (vistos.has(grupo.grupoCodigo)) continue;
      vistos.add(grupo.grupoCodigo);
      grupos.push(grupoItem(grupo.grupoCodigo, grupo.grupoDescricao, porCodigo.get(grupo.grupoCodigo) ?? null, true));
    }
    for (const codigo of [...porCodigo.keys()].filter((item) => !vistos.has(item)).sort((a, b) => a.localeCompare(b))) {
      grupos.push(grupoItem(codigo, null, porCodigo.get(codigo) ?? null, false));
    }
    return { universal: universalItem(universal), grupos };
  }

  async saveGrupo(input: { role: Role; grupoCodigo: string; sigla: string; corHex: string }): Promise<GrupoConfigItem> {
    assertAcesso(input.role, true);
    const grupoCodigo = input.grupoCodigo.trim();
    if (!grupoCodigo || grupoCodigo.length > 10) falha(400, "IBC_PRODUTO_GRUPO_INVALIDO", "Código do grupo inválido", { grupoCodigo: input.grupoCodigo });
    const sigla = normalizarSigla(input.sigla);
    const corHex = normalizarCor(input.corHex);
    const [configs, catalogo] = await Promise.all([this.configs.list(), this.catalogo.listDistinct()]);
    const grupo = catalogo.find((item) => item.grupoCodigo === grupoCodigo) ?? null;
    const existing = configs.find((config) => !config.universal && config.grupoCodigo === grupoCodigo) ?? null;
    if (!existing && !grupo) falha(404, "IBC_PRODUTO_GRUPO_NAO_ENCONTRADO", "Grupo não encontrado no catálogo do Sapiens", { grupoCodigo });
    if (existing && existing.sigla === sigla && existing.corHex === corHex) return grupoItem(grupoCodigo, grupo?.grupoDescricao ?? null, existing, grupo != null);
    if (existing?.emUso) falha(409, "IBC_PRODUTO_CONFIG_EM_USO", TRAVA);
    assertLivre(configs, existing?.id, sigla, corHex);
    const saved = await this.configs.save({ id: existing?.id, universal: false, grupoCodigo, sigla, corHex });
    return grupoItem(grupoCodigo, grupo?.grupoDescricao ?? null, saved, grupo != null);
  }
  async saveUniversal(input: { role: Role; corHex: string }): Promise<UniversalConfigItem> {
    assertAcesso(input.role, true);
    const corHex = normalizarCor(input.corHex);
    const configs = await this.configs.list();
    const existing = configs.find((config) => config.universal) ?? null;
    if (existing?.corHex === corHex) return universalItem(existing);
    if (existing?.emUso) falha(409, "IBC_PRODUTO_CONFIG_EM_USO", TRAVA);
    assertLivre(configs, existing?.id, null, corHex);
    return universalItem(await this.configs.save({ id: existing?.id, universal: true, corHex }));
  }
}
