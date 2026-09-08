const IBC_IDENTIFIER_PREFIX = "HM";
const IBC_IDENTIFIER_DIGITS = 4;
const IBC_IDENTIFIER_PATTERN = /^HM(\d{4})$/;

export function allocateNextIbcIdentifier(highestExisting: string): string {
  const match = IBC_IDENTIFIER_PATTERN.exec(highestExisting);
  if (!match) {
    throw new Error(`Invalid IBC identifier: ${highestExisting}`);
  }

  const nextSequence = Number(match[1]) + 1;
  return `${IBC_IDENTIFIER_PREFIX}${String(nextSequence).padStart(IBC_IDENTIFIER_DIGITS, "0")}`;
}
