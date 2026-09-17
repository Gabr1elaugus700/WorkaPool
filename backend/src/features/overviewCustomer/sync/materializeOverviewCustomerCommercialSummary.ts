import type { OverviewCustomerCommercialSummarySnapshot } from "../models/OverviewCustomerIdentity";

const HALF_VOLUME_PRODUCT_CODE = "101072";
const DAY_MS = 24 * 60 * 60 * 1000;
const JAN_2024_CUTOFF = new Date("2024-01-01T00:00:00.000Z");

export type OverviewCustomerCommercialLine = {
  customerCode: number;
  orderId: number;
  issuedAt: string;
  productCode: string;
  quantityInvoiced: number;
  quantityReturned: number;
  unitPrice: number;
  lineMarginPercent: number | null;
};

export type OverviewCustomerCommercialSummarySeed = {
  lines: OverviewCustomerCommercialLine[];
};

type OrderAccumulator = {
  issuedAt: string;
  revenue: number;
  volume: number;
};

type CustomerAccumulator = {
  orders: Map<number, OrderAccumulator>;
  weightedMarginNumerator: number;
  weightedMarginDenominator: number;
};

export function materializeOverviewCustomerCommercialSummary(
  seed: OverviewCustomerCommercialSummarySeed,
  now: Date = new Date(),
): OverviewCustomerCommercialSummarySnapshot {
  const byCustomer = new Map<number, CustomerAccumulator>();

  for (const line of seed.lines) {
    if (!Number.isInteger(line.customerCode) || line.customerCode <= 0) {
      continue;
    }
    if (!Number.isInteger(line.orderId) || line.orderId <= 0) {
      continue;
    }
    if (!isIsoDateString(line.issuedAt)) {
      continue;
    }

    const netQuantity = line.quantityInvoiced - line.quantityReturned;
    if (!Number.isFinite(netQuantity) || netQuantity <= 0) {
      continue;
    }

    const revenue = line.unitPrice * netQuantity;
    if (!Number.isFinite(revenue) || revenue <= 0) {
      continue;
    }

    const volume =
      line.productCode === HALF_VOLUME_PRODUCT_CODE ? netQuantity / 2 : netQuantity;

    const customer = getOrCreateCustomer(byCustomer, line.customerCode);
    const order = getOrCreateOrder(customer.orders, line.orderId, line.issuedAt);
    order.revenue += revenue;
    order.volume += volume;

    if (line.lineMarginPercent !== null && Number.isFinite(line.lineMarginPercent)) {
      customer.weightedMarginNumerator += revenue * line.lineMarginPercent;
      customer.weightedMarginDenominator += revenue;
    }
  }

  const last12Cutoff = shiftMonths(now, -12);
  const customers: OverviewCustomerCommercialSummarySnapshot["customers"] = {};

  for (const [customerCode, customer] of byCustomer.entries()) {
    const orders = Array.from(customer.orders.entries())
      .map(([orderId, order]) => ({ orderId, ...order }))
      .sort((a, b) => compareOrders(a.issuedAt, a.orderId, b.issuedAt, b.orderId));

    if (orders.length === 0) {
      continue;
    }

    const sinceJan2024Orders = orders.filter(
      (order) => toUtcDate(order.issuedAt) >= JAN_2024_CUTOFF,
    );
    const totalRevenue = sumBy(sinceJan2024Orders, (order) => order.revenue);
    const totalVolume = sumBy(sinceJan2024Orders, (order) => order.volume);
    const last12Orders = orders.filter((order) => toUtcDate(order.issuedAt) >= last12Cutoff);
    const last12Revenue = sumBy(last12Orders, (order) => order.revenue);
    const last12Volume = sumBy(last12Orders, (order) => order.volume);

    const purchaseFrequencyDays = computeAverageFrequencyDays(orders);
    const lastOrder = orders[orders.length - 1];
    const lastOrderDate = toUtcDate(lastOrder.issuedAt);
    const daysSinceLastPurchase = diffDays(lastOrderDate, now);
    const weightedMargin =
      customer.weightedMarginDenominator > 0
        ? customer.weightedMarginNumerator / customer.weightedMarginDenominator
        : null;

    customers[String(customerCode)] = {
      revenueSinceJan2024: round2(totalRevenue),
      revenueLast12Months: round2(last12Revenue),
      orderCountSinceJan2024: sinceJan2024Orders.length,
      orderCountLast12Months: last12Orders.length,
      averageTicketSinceJan2024:
        sinceJan2024Orders.length > 0 ? round2(totalRevenue / sinceJan2024Orders.length) : 0,
      averageTicketLast12Months:
        last12Orders.length > 0 ? round2(last12Revenue / last12Orders.length) : 0,
      volumeSinceJan2024: round2(totalVolume),
      volumeLast12Months: round2(last12Volume),
      marginPercentWeightedByRevenue:
        weightedMargin === null ? null : round2(weightedMargin),
      purchaseFrequencyDays:
        purchaseFrequencyDays === null ? null : round2(purchaseFrequencyDays),
      daysSinceLastPurchase,
    };
  }

  return { customers };
}

function getOrCreateCustomer(
  acc: Map<number, CustomerAccumulator>,
  customerCode: number,
): CustomerAccumulator {
  const current = acc.get(customerCode);
  if (current) {
    return current;
  }
  const created: CustomerAccumulator = {
    orders: new Map<number, OrderAccumulator>(),
    weightedMarginNumerator: 0,
    weightedMarginDenominator: 0,
  };
  acc.set(customerCode, created);
  return created;
}

function getOrCreateOrder(
  orders: Map<number, OrderAccumulator>,
  orderId: number,
  issuedAt: string,
): OrderAccumulator {
  const current = orders.get(orderId);
  if (current) {
    if (issuedAt < current.issuedAt) {
      current.issuedAt = issuedAt;
    }
    return current;
  }
  const created: OrderAccumulator = {
    issuedAt,
    revenue: 0,
    volume: 0,
  };
  orders.set(orderId, created);
  return created;
}

function computeAverageFrequencyDays(
  orders: Array<{ issuedAt: string; orderId: number }>,
): number | null {
  if (orders.length < 2) {
    return null;
  }

  let diffSum = 0;
  let diffCount = 0;
  for (let index = 1; index < orders.length; index += 1) {
    const previous = toUtcDate(orders[index - 1].issuedAt);
    const current = toUtcDate(orders[index].issuedAt);
    diffSum += diffDays(previous, current);
    diffCount += 1;
  }

  return diffCount > 0 ? diffSum / diffCount : null;
}

function sumBy<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((acc, item) => acc + pick(item), 0);
}

function diffDays(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

function shiftMonths(date: Date, delta: number): Date {
  const shifted = new Date(date.getTime());
  shifted.setUTCMonth(shifted.getUTCMonth() + delta);
  return shifted;
}

function compareOrders(
  issuedAtA: string,
  orderIdA: number,
  issuedAtB: string,
  orderIdB: number,
): number {
  if (issuedAtA !== issuedAtB) {
    return issuedAtA.localeCompare(issuedAtB);
  }
  return orderIdA - orderIdB;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function isIsoDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  return !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}

function toUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
