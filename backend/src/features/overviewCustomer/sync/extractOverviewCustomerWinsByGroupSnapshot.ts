import type {
  OverviewCustomerWinsByGroupRow,
  OverviewCustomerWinsByGroupSnapshot,
} from "./materializeOverviewCustomerWinsByGroup";

type GenericRecord = Record<string, unknown>;

export function extractOverviewCustomerWinsByGroupSnapshot(
  payload: unknown,
): OverviewCustomerWinsByGroupSnapshot | null {
  if (!isRecord(payload)) {
    return null;
  }

  const direct = parseSnapshot(payload);
  if (direct) {
    return direct;
  }

  const step = payload["ganhos-por-grupo"];
  if (isRecord(step)) {
    return parseSnapshot(step);
  }

  return null;
}

function parseSnapshot(source: GenericRecord): OverviewCustomerWinsByGroupSnapshot | null {
  const customers = source.customers;
  if (!isRecord(customers)) {
    return null;
  }

  const parsed: OverviewCustomerWinsByGroupSnapshot["customers"] = {};
  for (const [key, value] of Object.entries(customers)) {
    if (!Array.isArray(value)) {
      return null;
    }
    parsed[key] = value.filter(isWinsByGroupRow);
  }
  return { customers: parsed };
}

function isWinsByGroupRow(value: unknown): value is OverviewCustomerWinsByGroupRow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.grupoCodigo === "string" &&
    typeof value.grupoDescricao === "string" &&
    Number.isInteger(value.numped) &&
    Number.isInteger(value.numnfv) &&
    isIsoDateString(value.datemi) &&
    isNumber(value.qtdped) &&
    isNumber(value.volume) &&
    isNumber(value.vlrfinal) &&
    isNumber(value.preuni) &&
    isNullableNumber(value.margem)
  );
}

function isIsoDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isRecord(value: unknown): value is GenericRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value);
}
