import type {
  OverviewCustomerIdentity,
  OverviewCustomerIdentitySnapshot,
} from "../models/OverviewCustomerIdentity";
import { extractOverviewCustomerCommercialSummarySnapshot } from "./extractOverviewCustomerCommercialSummarySnapshot";

type GenericRecord = Record<string, unknown>;

export function extractOverviewCustomerIdentitySnapshot(
  payload: unknown,
): OverviewCustomerIdentitySnapshot | null {
  if (!isRecord(payload)) {
    return null;
  }

  const direct = parseSnapshot(payload);
  if (direct) {
    return enrichWithCommercialSummary(payload, direct);
  }

  const legacyIdentityStep = payload["dados-gerais-cliente"];
  if (isRecord(legacyIdentityStep)) {
    const parsed = parseSnapshot(legacyIdentityStep);
    if (parsed) {
      return enrichWithCommercialSummary(payload, parsed);
    }
  }

  const explicitIdentityStep = payload["overview-customer-identity"];
  if (isRecord(explicitIdentityStep)) {
    const parsed = parseSnapshot(explicitIdentityStep);
    if (parsed) {
      return enrichWithCommercialSummary(payload, parsed);
    }
  }

  return null;
}

function enrichWithCommercialSummary(
  payload: unknown,
  identitySnapshot: OverviewCustomerIdentitySnapshot,
): OverviewCustomerIdentitySnapshot {
  const summarySnapshot = extractOverviewCustomerCommercialSummarySnapshot(payload);
  if (!summarySnapshot) {
    return identitySnapshot;
  }

  const enrichedCustomers: OverviewCustomerIdentitySnapshot["customers"] = {};
  for (const [customerCode, customer] of Object.entries(identitySnapshot.customers)) {
    const summary = summarySnapshot.customers[customerCode];
    enrichedCustomers[customerCode] = {
      ...customer,
      orderCountLast12Months:
        summary?.orderCountLast12Months ?? customer.orderCountLast12Months,
      revenueLast12Months: summary?.revenueLast12Months ?? customer.revenueLast12Months,
      daysSinceLastPurchase:
        summary?.daysSinceLastPurchase ?? customer.daysSinceLastPurchase,
    };
  }

  return { customers: enrichedCustomers };
}

function parseSnapshot(source: GenericRecord): OverviewCustomerIdentitySnapshot | null {
  const customers = source.customers;
  if (!isRecord(customers)) {
    return null;
  }

  const parsed: Record<string, OverviewCustomerIdentity> = {};
  for (const [key, value] of Object.entries(customers)) {
    if (!isOverviewCustomerIdentity(value)) {
      continue;
    }
    parsed[key] = value;
  }
  return { customers: parsed };
}

function isOverviewCustomerIdentity(value: unknown): value is OverviewCustomerIdentity {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.customerCode === "number" &&
    typeof value.tradeName === "string" &&
    typeof value.document === "string" &&
    typeof value.city === "string" &&
    typeof value.state === "string" &&
    isNullableString(value.segment) &&
    isNullableString(value.registrationDate) &&
    isNullableNumber(value.primaryCodRep) &&
    isNullableString(value.firstInvoicedPurchaseAt) &&
    isNullableString(value.lastInvoicedPurchaseAt) &&
    isOptionalNumber(value.orderCountLast12Months) &&
    isOptionalNumber(value.revenueLast12Months) &&
    isOptionalNullableNumber(value.daysSinceLastPurchase) &&
    (value.branchIndicator === "MGA" ||
      value.branchIndicator === "CTB" ||
      value.branchIndicator === "BOTH")
  );
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || typeof value === "number";
}

function isOptionalNullableNumber(value: unknown): value is number | null | undefined {
  return value === undefined || value === null || typeof value === "number";
}

function isRecord(value: unknown): value is GenericRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
