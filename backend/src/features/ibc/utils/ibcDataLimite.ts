import { IbcCadastroRecord } from "../types/IbcCadastro.types";

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function isDataLimiteDue(dataLimite: Date, now: Date): boolean {
  return startOfUtcDay(dataLimite) <= startOfUtcDay(now);
}

export function shouldMarkDataLimite(
  ibc: Pick<IbcCadastroRecord, "baixadoEm" | "dataLimite" | "motivoInaptidao">,
  now: Date,
): boolean {
  return (
    ibc.baixadoEm == null &&
    ibc.dataLimite != null &&
    ibc.motivoInaptidao !== "DATA_LIMITE" &&
    isDataLimiteDue(ibc.dataLimite, now)
  );
}
