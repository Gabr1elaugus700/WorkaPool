import type {
  OverviewCustomerIdentity,
  OverviewCustomerIdentitySnapshot,
} from "../models/OverviewCustomerIdentity";

type GenericRecord = Record<string, unknown>;

export function extractOverviewCustomerIdentitySnapshot(
  payload: unknown,
): OverviewCustomerIdentitySnapshot | null {
  if (!isRecord(payload)) {
    return null;
  }

  const direct = parseSnapshot(payload);
  if (direct) {
    return direct;
  }

  const legacyIdentityStep = payload["dados-gerais-cliente"];
  if (isRecord(legacyIdentityStep)) {
    const parsed = parseSnapshot(legacyIdentityStep);
    if (parsed) {
      return parsed;
    }
  }

  const explicitIdentityStep = payload["overview-customer-identity"];
  if (isRecord(explicitIdentityStep)) {
    return parseSnapshot(explicitIdentityStep);
  }

  return null;
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

function isRecord(value: unknown): value is GenericRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
