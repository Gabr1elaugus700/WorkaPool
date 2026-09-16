import type {
  OverviewCustomerMonthlyEvolutionRow,
  OverviewCustomerMonthlyEvolutionSnapshot,
} from "../models/OverviewCustomerIdentity";

type GenericRecord = Record<string, unknown>;

export function extractOverviewCustomerMonthlyEvolutionSnapshot(
  payload: unknown,
): OverviewCustomerMonthlyEvolutionSnapshot | null {
  if (!isRecord(payload)) {
    return null;
  }

  const direct = parseSnapshot(payload);
  if (direct) {
    return direct;
  }

  const legacyStep = payload["evolucao-mensal"];
  if (isRecord(legacyStep)) {
    const parsed = parseSnapshot(legacyStep);
    if (parsed) {
      return parsed;
    }
  }

  const explicitStep = payload["overview-customer-monthly-evolution"];
  if (isRecord(explicitStep)) {
    return parseSnapshot(explicitStep);
  }

  return null;
}

function parseSnapshot(source: GenericRecord): OverviewCustomerMonthlyEvolutionSnapshot | null {
  const customers = source.customers;
  if (!isRecord(customers)) {
    return null;
  }

  const parsed: OverviewCustomerMonthlyEvolutionSnapshot["customers"] = {};
  for (const [key, value] of Object.entries(customers)) {
    if (!Array.isArray(value)) {
      return null;
    }
    const rows = value.filter(isOverviewCustomerMonthlyEvolutionRow);
    parsed[key] = rows;
  }

  return { customers: parsed };
}

function isOverviewCustomerMonthlyEvolutionRow(
  value: unknown,
): value is OverviewCustomerMonthlyEvolutionRow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.month === "string" &&
    /^\d{4}-\d{2}$/.test(value.month) &&
    isNumber(value.revenue) &&
    isNumber(value.volume) &&
    isNumber(value.orderCount) &&
    isNullableNumber(value.marginPercent)
  );
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
