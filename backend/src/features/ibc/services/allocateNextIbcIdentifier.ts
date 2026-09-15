const IBC_IDENTIFIER_DIGITS = 5;
const IBC_IDENTIFIER_PATTERN = /^(HM|NHM|HMS|NHS)(\d{4,5})$/;

export function allocateNextIbcIdentifier(highestExisting: string): string {
  const match = IBC_IDENTIFIER_PATTERN.exec(highestExisting);
  if (!match) {
    throw new Error(`Invalid IBC identifier: ${highestExisting}`);
  }

  const prefix = match[1];
  const nextSequence = Number(match[2]) + 1;
  return `${prefix}${String(nextSequence).padStart(IBC_IDENTIFIER_DIGITS, "0")}`;
}
