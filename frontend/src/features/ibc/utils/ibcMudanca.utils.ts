import type {
  IbcCadastroDTO,
  IbcMudancaConfirmacaoInput,
} from "../types/ibcCadastro.types";

export const IBC_OBSERVACAO_MAX = 500;

const HOMOLOGADO_PREFIX = "HM";
const NAO_HOMOLOGADO_PREFIX = "NHM";

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

/** Prefixo que a conversão vai gerar, ou null quando o IBC não pode ser convertido. */
export function previewConversaoPrefixo(
  ibc: Pick<IbcCadastroDTO, "identificador" | "prefixo">,
): string | null {
  const prefixo = resolveIbcPrefixo(ibc);
  if (!prefixo || !prefixo.startsWith(HOMOLOGADO_PREFIX)) return null;
  return `N${prefixo}`;
}

export function previewMudancaProdutoPrefixo(
  ibc: Pick<IbcCadastroDTO, "identificador" | "prefixo">,
  abreviacao: string,
): string {
  const base = isIbcNaoHomologado(ibc) ? NAO_HOMOLOGADO_PREFIX : HOMOLOGADO_PREFIX;
  return `${base}${abreviacao.toUpperCase()}`;
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
