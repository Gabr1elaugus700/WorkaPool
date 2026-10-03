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
