import type { ListaIbcProdutoConfig } from "../services/ibcProdutoConfigService";
import type {
  ChangeIbcProdutoInput,
  ConvertIbcInput,
  IbcCadastroDTO,
  IbcConversaoDestino,
  IbcMudancaConfirmacaoInput,
} from "../types/ibcCadastro.types";

export const IBC_OBSERVACAO_MAX = 500;

const HOMOLOGADO_PREFIX = "HM";
const NAO_HOMOLOGADO_PREFIX = "NH";
const SIGLA = /^[A-Z]{1,2}$/;
const COR_PLACA = /^#[0-9A-Fa-f]{6}$/;

export type IbcAcaoMudanca = "converter" | "mudar_produto";

export type IbcDestinoPlaca = {
  produtoId: string; rotulo: string; sigla: string | null; corHex: string; grupoCodigo: string | null;
};

export function resolveIbcPrefixo(
  ibc: Pick<IbcCadastroDTO, "identificador" | "prefixo">,
): string | null {
  if (ibc.prefixo) return ibc.prefixo;
  return /^([A-Z]+)\d+$/.exec(ibc.identificador)?.[1] ?? null;
}

export function isIbcNaoHomologado(
  ibc: Pick<IbcCadastroDTO, "identificador" | "prefixo">,
): boolean {
  return resolveIbcPrefixo(ibc)?.startsWith(NAO_HOMOLOGADO_PREFIX) ?? false;
}

export function isIbcHomologado(ibc: Pick<IbcCadastroDTO, "identificador" | "prefixo">): boolean {
  const prefixo = resolveIbcPrefixo(ibc);
  return prefixo != null && !prefixo.startsWith(NAO_HOMOLOGADO_PREFIX) && prefixo.startsWith(HOMOLOGADO_PREFIX);
}

export function siglaDoPrefixoHomologado(ibc: Pick<IbcCadastroDTO, "identificador" | "prefixo">): string | null {
  const prefixo = resolveIbcPrefixo(ibc);
  if (!prefixo?.startsWith(HOMOLOGADO_PREFIX) || prefixo.startsWith(NAO_HOMOLOGADO_PREFIX)) return null;
  const sigla = prefixo.slice(HOMOLOGADO_PREFIX.length);
  return SIGLA.test(sigla) ? sigla : null;
}

export function acaoMudancaDisponivel(
  ibc: Pick<IbcCadastroDTO, "identificador" | "prefixo" | "convertedToContainerId">,
): IbcAcaoMudanca | null {
  if (isIbcSubstituido(ibc)) return null;
  if (isIbcNaoHomologado(ibc)) return "mudar_produto";
  return isIbcHomologado(ibc) ? "converter" : null;
}

export function isIbcSubstituido(
  ibc: Pick<IbcCadastroDTO, "convertedToContainerId">,
): boolean {
  return Boolean(ibc.convertedToContainerId);
}

export function previewConversaoPrefixo(
  ibc: Pick<IbcCadastroDTO, "identificador" | "prefixo">,
  destino: IbcConversaoDestino,
  siglaLegado: string | null = null,
): string | null {
  if (!isIbcHomologado(ibc)) return null;
  if (destino === "universal") return NAO_HOMOLOGADO_PREFIX;
  const sigla = siglaDoPrefixoHomologado(ibc) ?? siglaLimpa(siglaLegado);
  return sigla ? `${NAO_HOMOLOGADO_PREFIX}${sigla}` : null;
}

export function previewMudancaProdutoPrefixo(sigla: string | null): string {
  const limpa = siglaLimpa(sigla);
  return limpa ? `${NAO_HOMOLOGADO_PREFIX}${limpa}` : NAO_HOMOLOGADO_PREFIX;
}

export function corDePlaca(value: string | null | undefined): string | null {
  if (!value || !COR_PLACA.test(value)) return null;
  return value.toUpperCase();
}

export function listarDestinosPlaca(lista: ListaIbcProdutoConfig, produtoAtualId: string | null | undefined): IbcDestinoPlaca[] {
  const destinos: IbcDestinoPlaca[] = [];
  const corUniversal = corDePlaca(lista.universal.corHex);
  if (lista.universal.configurado && lista.universal.id && corUniversal && lista.universal.id !== produtoAtualId) {
    destinos.push({ produtoId: lista.universal.id, rotulo: "Universal", sigla: null, corHex: corUniversal, grupoCodigo: null });
  }
  for (const grupo of lista.grupos) {
    const cor = corDePlaca(grupo.corHex);
    const sigla = siglaLimpa(grupo.sigla);
    if (!grupo.configurado || !grupo.id || !sigla || !cor || grupo.id === produtoAtualId) continue;
    const nome = grupo.grupoDescricao?.trim() || grupo.grupoCodigo;
    destinos.push({ produtoId: grupo.id, rotulo: `${nome} (${sigla})`, sigla, corHex: cor, grupoCodigo: grupo.grupoCodigo });
  }
  return destinos;
}

export function buildConversaoInput(
  confirmado: boolean, observacao: string, destino: IbcConversaoDestino, grupoCodigo: string | null,
): ConvertIbcInput | null {
  const base = buildIbcMudancaConfirmacao(confirmado, observacao);
  if (!base) return null;
  const grupo = grupoCodigo?.trim() || null;
  return grupo ? { ...base, destino, grupoCodigo: grupo } : { ...base, destino };
}

export function buildMudancaProdutoInput(confirmado: boolean, observacao: string, produtoId: string): ChangeIbcProdutoInput | null {
  const base = buildIbcMudancaConfirmacao(confirmado, observacao);
  if (!base || produtoId.trim().length === 0) return null;
  return { ...base, produtoId };
}

function siglaLimpa(sigla: string | null): string | null {
  const limpa = (sigla ?? "").trim().toUpperCase();
  return SIGLA.test(limpa) ? limpa : null;
}

/**
 * Payload de confirmação exigido pela API; null enquanto o usuário não confirmou
 * ou a observação excede o limite.
 */
export function buildIbcMudancaConfirmacao(
  confirmado: boolean,
  observacao: string,
): IbcMudancaConfirmacaoInput | null {
  if (!confirmado) return null;
  const trimmed = observacao.trim();
  if (trimmed.length > IBC_OBSERVACAO_MAX) return null;
  return { confirmado: true, observacao: trimmed.length > 0 ? trimmed : null };
}
