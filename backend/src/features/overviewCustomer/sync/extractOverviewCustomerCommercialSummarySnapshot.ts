import type {
  OverviewCustomerCommercialSummary,
  OverviewCustomerCommercialSummarySnapshot,
} from "../models/OverviewCustomerIdentity";

type GenericRecord = Record<string, unknown>;

export function extractOverviewCustomerCommercialSummarySnapshot(
  payload: unknown,
): OverviewCustomerCommercialSummarySnapshot | null {
  if (!isRecord(payload)) {
    return null;
  }

  const direct = parseSnapshot(payload);
  if (direct) {
    return direct;
  }

  const legacySummaryStep = payload["resumo-comercial"];
  if (isRecord(legacySummaryStep)) {
    const parsed = parseSnapshot(legacySummaryStep);
    if (parsed) {
      return parsed;
    }
  }

  const explicitSummaryStep = payload["overview-customer-commercial-summary"];
  if (isRecord(explicitSummaryStep)) {
    return parseSnapshot(explicitSummaryStep);
  }

  return null;
}

function parseSnapshot(source: GenericRecord): OverviewCustomerCommercialSummarySnapshot | null {
  const customers = source.customers;
  if (!isRecord(customers)) {
    return null;
  }

  const parsed: Record<string, OverviewCustomerCommercialSummary> = {};
  for (const [key, value] of Object.entries(customers)) {
    if (!isOverviewCustomerCommercialSummary(value)) {
      continue;
    }
    parsed[key] = value;
  }

  return { customers: parsed };
}

function isOverviewCustomerCommercialSummary(
  value: unknown,
): value is OverviewCustomerCommercialSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNumber(value.revenueSinceJan2024) &&
    isNumber(value.revenueLast12Months) &&
    isNumber(value.orderCountSinceJan2024) &&
    isNumber(value.orderCountLast12Months) &&
    isNumber(value.averageTicketSinceJan2024) &&
    isNumber(value.averageTicketLast12Months) &&
    isNumber(value.volumeSinceJan2024) &&
    isNumber(value.volumeLast12Months) &&
    isNullableNumber(value.marginPercentWeightedByRevenue) &&
    isNullableNumber(value.purchaseFrequencyDays) &&
    isNullableNumber(value.daysSinceLastPurchase)
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
