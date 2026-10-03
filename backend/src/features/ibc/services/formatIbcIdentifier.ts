export const IBC_SEQUENCIAL_DIGITS = 5;

export function formatIbcIdentifier(prefixo: string, sequencial: number): string {
  if (!Number.isInteger(sequencial) || sequencial < 1) {
    throw new Error(`Invalid IBC sequencial: ${sequencial}`);
  }

  return `${prefixo}${String(sequencial).padStart(IBC_SEQUENCIAL_DIGITS, "0")}`;
}
