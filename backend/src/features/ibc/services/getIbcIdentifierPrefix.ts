export function getIbcIdentifierPrefix(abreviacao: string): string {
  return `HM${abreviacao.toUpperCase()}`;
}
