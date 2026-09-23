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
    !isNonNegativeInteger(value.invoicedCountLast12Months) ||
    !isNonNegativeInteger(value.lostCountLast12Months) ||
    !Array.isArray(value.recentInvoicedOrders) ||
    !Array.isArray(value.recentLostOrders)
  ) {
    return null;
  }

  return {
    lastInvoicedPurchaseAt: value.lastInvoicedPurchaseAt,
    lastLostOrderAt: value.lastLostOrderAt,
    lastCommercialMovementAt: value.lastCommercialMovementAt,
    invoicedCountSinceJan2024: readOptionalNonNegativeInteger(value.invoicedCountSinceJan2024),
    lostCountSinceJan2024: readOptionalNonNegativeInteger(value.lostCountSinceJan2024),
    invoicedCountLast60Days: readOptionalNonNegativeInteger(value.invoicedCountLast60Days),
    lostCountLast60Days: readOptionalNonNegativeInteger(value.lostCountLast60Days),
    invoicedCountLast12Months: value.invoicedCountLast12Months,
    lostCountLast12Months: value.lostCountLast12Months,
    recentInvoicedOrders: value.recentInvoicedOrders.filter(isRecentInvoicedOrder),
    recentLostOrders: value.recentLostOrders.filter(isRecentLostOrder),
  };
}

function isRecentInvoicedOrder(value: unknown): value is OverviewCustomerRecentInvoicedOrder {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isPositiveInteger(value.orderNumber) ||
    !isDateString(value.occurredAt) ||
    !isNullableNumber(value.codRep) ||
    !isNullableNumber(value.branchCode) ||
    !isNumber(value.revenue) ||
    !isNumber(value.volume) ||
    !isNullableNumber(value.marginPercent) ||
    !Array.isArray(value.items)
  ) {
    return false;
  }

  return value.items.every(isRecentInvoicedOrderItem);
}

function isRecentInvoicedOrderItem(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.productCode === "string" &&
    value.productCode.length > 0 &&
    typeof value.productName === "string" &&
    value.productName.length > 0 &&
    isNumber(value.quantity) &&
    isNumber(value.volume) &&
    isNumber(value.revenue) &&
    isNumber(value.unitPrice) &&
    isNullableNumber(value.marginPercent)
  );
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function readOptionalNonNegativeInteger(value: unknown): number {
  if (isNonNegativeInteger(value)) {
    return value;
  }
  return 0;
}

function isRecord(value: unknown): value is GenericRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
