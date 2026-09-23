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
    parsed[key] = normalizeCommercialSummary(value);
  }

  return { customers: parsed };
}

function isOverviewCustomerCommercialSummary(value: unknown): value is GenericRecord {
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
    isNullableNumber(value.daysSinceLastPurchase) &&
    isOptionalNullableNumber(value.maxInvoicedOrderMarginPercent) &&
    isOptionalNullableNumber(value.minInvoicedOrderMarginPercent)
  );
}

function normalizeCommercialSummary(value: GenericRecord): OverviewCustomerCommercialSummary {
  return {
    revenueSinceJan2024: value.revenueSinceJan2024 as number,
    revenueLast30Days: isNumber(value.revenueLast30Days) ? value.revenueLast30Days : 0,
    revenueLast12Months: value.revenueLast12Months as number,
    orderCountSinceJan2024: value.orderCountSinceJan2024 as number,
    orderCountLast12Months: value.orderCountLast12Months as number,
    averageTicketSinceJan2024: value.averageTicketSinceJan2024 as number,
    averageTicketLast12Months: value.averageTicketLast12Months as number,
    volumeSinceJan2024: value.volumeSinceJan2024 as number,
    volumeLast30Days: isNumber(value.volumeLast30Days) ? value.volumeLast30Days : 0,
    volumeLast12Months: value.volumeLast12Months as number,
    marginPercentWeightedByRevenue: value.marginPercentWeightedByRevenue as number | null,
    purchaseFrequencyDays: value.purchaseFrequencyDays as number | null,
    daysSinceLastPurchase: value.daysSinceLastPurchase as number | null,
    maxInvoicedOrderMarginPercent:
      value.maxInvoicedOrderMarginPercent === undefined
        ? null
        : (value.maxInvoicedOrderMarginPercent as number | null),
    minInvoicedOrderMarginPercent:
      value.minInvoicedOrderMarginPercent === undefined
        ? null
        : (value.minInvoicedOrderMarginPercent as number | null),
  };
}

function isOptionalNullableNumber(value: unknown): boolean {
  return value === undefined || isNullableNumber(value);
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
