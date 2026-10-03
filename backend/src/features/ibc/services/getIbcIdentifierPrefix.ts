const HOMOLOGADO_PREFIX = "HM";
const NAO_HOMOLOGADO_PREFIX = "NHM";

export function getIbcIdentifierPrefix(
  abreviacao: string,
  isHomologated = true,
): string {
  const normalized = abreviacao.toUpperCase();
  return isHomologated
    ? `${HOMOLOGADO_PREFIX}${normalized}`
    : `${NAO_HOMOLOGADO_PREFIX}${normalized}`;
}

export function isNaoHomologadoPrefixo(prefixo: string): boolean {
  return prefixo.startsWith(NAO_HOMOLOGADO_PREFIX);
}

export function isHomologadoPrefixo(prefixo: string): boolean {
  return prefixo.startsWith(HOMOLOGADO_PREFIX);
}

export function toNaoHomologadoPrefixo(prefixo: string): string {
  return `N${prefixo}`;
}

export function resolveIbcPrefixo(ibc: {
  identificador: string;
  prefixo?: string | null;
}): string | null {
  if (ibc.prefixo) return ibc.prefixo;
  return /^([A-Z]+)\d+$/.exec(ibc.identificador)?.[1] ?? null;
}
