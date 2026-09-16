export function getIbcIdentifierPrefix(
  abreviacao: string,
  isHomologated = true,
): string {
  const normalized = abreviacao.toUpperCase();
  return isHomologated ? `HM${normalized}` : `NHM${normalized}`;
}
