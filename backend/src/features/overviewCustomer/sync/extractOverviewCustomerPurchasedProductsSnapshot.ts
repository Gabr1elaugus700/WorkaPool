import type {
  OverviewCustomerPurchasedProduct,
  OverviewCustomerPurchasedProductsSnapshot,
} from "../models/OverviewCustomerIdentity";

type GenericRecord = Record<string, unknown>;

export function extractOverviewCustomerPurchasedProductsSnapshot(
  payload: unknown,
): OverviewCustomerPurchasedProductsSnapshot | null {
  if (!isRecord(payload)) {
    return null;
  }

  const direct = parseSnapshot(payload);
  if (direct) {
    return direct;
  }

  const legacyStep = payload["produtos-comprados"];
  if (isRecord(legacyStep)) {
    const parsed = parseSnapshot(legacyStep);
    if (parsed) {
      return parsed;
    }
  }

  const explicitStep = payload["overview-customer-purchased-products"];
  if (isRecord(explicitStep)) {
    return parseSnapshot(explicitStep);
  }

  return null;
}

function parseSnapshot(source: GenericRecord): OverviewCustomerPurchasedProductsSnapshot | null {
  const customers = source.customers;
  if (!isRecord(customers)) {
    return null;
  }

  const parsed: OverviewCustomerPurchasedProductsSnapshot["customers"] = {};
  for (const [key, value] of Object.entries(customers)) {
    if (!Array.isArray(value)) {
      return null;
    }
    parsed[key] = value.filter(isPurchasedProduct);
  }
  return { customers: parsed };
}

function isPurchasedProduct(value: unknown): value is OverviewCustomerPurchasedProduct {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.productCode === "string" &&
    typeof value.productName === "string" &&
    isNumber(value.quantity) &&
    isNumber(value.volume) &&
    isNumber(value.revenue) &&
    isNumber(value.averagePrice) &&
    isNullableNumber(value.marginPercentWeightedByRevenue) &&
    isIsoDateString(value.firstPurchaseAt) &&
    isIsoDateString(value.lastPurchaseAt) &&
    isNullableNumber(value.frequencyDays) &&
    isNumber(value.revenueShare)
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
