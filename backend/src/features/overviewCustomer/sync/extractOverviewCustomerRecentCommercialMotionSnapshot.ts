import type {
  OverviewCustomerRecentCommercialMotion,
  OverviewCustomerRecentCommercialMotionSnapshot,
  OverviewCustomerRecentInvoicedOrder,
  OverviewCustomerRecentLostOrder,
} from "../models/OverviewCustomerIdentity";

type GenericRecord = Record<string, unknown>;

export function extractOverviewCustomerRecentCommercialMotionSnapshot(
  payload: unknown,
): OverviewCustomerRecentCommercialMotionSnapshot | null {
  if (!isRecord(payload)) {
    return null;
  }

  const direct = parseSnapshot(payload);
  if (direct) {
    return direct;
  }

  const legacyStep = payload["ultimo-pedido-cliente"];
  if (isRecord(legacyStep)) {
    const parsed = parseSnapshot(legacyStep);
    if (parsed) {
      return parsed;
    }
  }

  const explicitStep = payload["overview-customer-recent-commercial-motion"];
  if (isRecord(explicitStep)) {
    return parseSnapshot(explicitStep);
  }

  return null;
}

function parseSnapshot(
  source: GenericRecord,
): OverviewCustomerRecentCommercialMotionSnapshot | null {
  const customers = source.customers;
  if (!isRecord(customers)) {
    return null;
  }

  const parsed: OverviewCustomerRecentCommercialMotionSnapshot["customers"] = {};
  for (const [customerCode, value] of Object.entries(customers)) {
    const parsedCustomer = parseCustomer(value);
    if (!parsedCustomer) {
      continue;
    }
    parsed[customerCode] = parsedCustomer;
  }

  if (Object.keys(parsed).length === 0) {
    return null;
  }

  return { customers: parsed };
}

function parseCustomer(value: unknown): OverviewCustomerRecentCommercialMotion | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNullableDateString(value.lastInvoicedPurchaseAt) ||
    !isNullableDateString(value.lastLostOrderAt) ||
    !isNullableDateString(value.lastCommercialMovementAt) ||
    !Array.isArray(value.recentInvoicedOrders) ||
    !Array.isArray(value.recentLostOrders)
  ) {
    return null;
  }

  return {
    lastInvoicedPurchaseAt: value.lastInvoicedPurchaseAt,
    lastLostOrderAt: value.lastLostOrderAt,
    lastCommercialMovementAt: value.lastCommercialMovementAt,
    recentInvoicedOrders: value.recentInvoicedOrders.filter(isRecentInvoicedOrder),
    recentLostOrders: value.recentLostOrders.filter(isRecentLostOrder),
  };
}

function isRecentInvoicedOrder(value: unknown): value is OverviewCustomerRecentInvoicedOrder {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPositiveInteger(value.orderNumber) &&
    isDateString(value.occurredAt) &&
    isNullableNumber(value.codRep) &&
    isNullableNumber(value.branchCode)
  );
}

function isRecentLostOrder(value: unknown): value is OverviewCustomerRecentLostOrder {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPositiveInteger(value.orderNumber) &&
    isDateString(value.occurredAt) &&
    isNullableNumber(value.codRep) &&
    isPositiveInteger(value.sitped)
  );
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isNullableDateString(value: unknown): value is string | null {
  return value === null || isDateString(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isRecord(value: unknown): value is GenericRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
