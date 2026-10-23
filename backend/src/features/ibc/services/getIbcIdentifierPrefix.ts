const HOMOLOGADO_PREFIX = "HM";
const NAO_HOMOLOGADO_PREFIX = "NH";

/** `HM`+sigla, `NH`+sigla, or `NH` when there is no sigla (universal). Does not emit `NHM`. */
export function getIbcIdentifierPrefix(input: {
  homologado: boolean;
  sigla?: string | null;
}): string {
  const sigla = (input.sigla ?? "").trim().toUpperCase();
  if (!input.homologado && sigla.length === 0) return NAO_HOMOLOGADO_PREFIX;
  return `${input.homologado ? HOMOLOGADO_PREFIX : NAO_HOMOLOGADO_PREFIX}${sigla}`;
}

/** `NH`, `NH`+sigla and legacy `NHM…` already stored. */
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
