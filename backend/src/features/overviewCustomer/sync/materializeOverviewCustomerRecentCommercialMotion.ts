import type {
  OverviewCustomerRecentCommercialMotion,
  OverviewCustomerRecentCommercialMotionSnapshot,
  OverviewCustomerRecentInvoicedOrder,
  OverviewCustomerRecentInvoicedOrderItem,
  OverviewCustomerRecentLostOrder,
} from "../models/OverviewCustomerIdentity";

const MAX_RECENT_ROWS = 5;
const LOST_SITPED = 5;
const HALF_VOLUME_PRODUCT_CODE = "101072";

export type OverviewCustomerInvoicedOrderLine = {
  customerCode: number;
  orderNumber: number;
  invoiceDate: string;
  codRep?: number | null;
  branchCode?: number | null;
  productCode: string;
  productName: string;
  quantityInvoiced: number;
  quantityReturned: number;
  unitPrice: number;
  lineMarginPercent: number | null;
};

export type OverviewCustomerLostOrderRow = {
  customerCode: number;
  orderNumber: number;
  issueDate: string;
  sitped: number;
  codRep?: number | null;
};

export type OverviewCustomerRecentCommercialMotionSeed = {
  invoicedLines: OverviewCustomerInvoicedOrderLine[];
  lostOrders: OverviewCustomerLostOrderRow[];
};

type ItemAccumulator = {
  productCode: string;
  productName: string;
  quantity: number;
  volume: number;
  revenue: number;
  unitPriceWeightedNumerator: number;
  weightedMarginNumerator: number;
  weightedMarginDenominator: number;
};

type OrderAccumulator = {
  orderNumber: number;
  occurredAt: string;
  codRep: number | null;
  branchCode: number | null;
  revenue: number;
  volume: number;
  weightedMarginNumerator: number;
  weightedMarginDenominator: number;
  items: Map<string, ItemAccumulator>;
};

export function materializeOverviewCustomerRecentCommercialMotion(
  seed: OverviewCustomerRecentCommercialMotionSeed,
  now: Date = new Date(),
): OverviewCustomerRecentCommercialMotionSnapshot {
  const last12Cutoff = formatUtcDate(shiftMonths(now, -12));
  const last60Cutoff = formatUtcDate(shiftDays(now, -60));
  const sinceJan2024Cutoff = "2024-01-01";
  const customers = new Map<number, OverviewCustomerRecentCommercialMotion>();
  const ordersByCustomer = new Map<number, Map<number, OrderAccumulator>>();

  for (const line of seed.invoicedLines) {
    if (!isValidInvoicedLine(line)) {
      continue;
    }

    const netQuantity = line.quantityInvoiced - line.quantityReturned;
    if (!Number.isFinite(netQuantity) || netQuantity <= 0) {
      continue;
    }

    const revenue = netQuantity * line.unitPrice;
    if (!Number.isFinite(revenue) || revenue <= 0) {
      continue;
    }

    const volume =
      line.productCode === HALF_VOLUME_PRODUCT_CODE ? netQuantity / 2 : netQuantity;

    const customerOrders = getOrCreateCustomerOrders(ordersByCustomer, line.customerCode);
    const order = getOrCreateOrder(customerOrders, line);
    order.revenue += revenue;
    order.volume += volume;
    if (line.invoiceDate > order.occurredAt) {
      order.occurredAt = line.invoiceDate;
    }
    if (line.codRep != null) {
      order.codRep = line.codRep;
    }
    if (line.branchCode != null) {
      order.branchCode = line.branchCode;
    }

    if (line.lineMarginPercent !== null && Number.isFinite(line.lineMarginPercent)) {
      order.weightedMarginNumerator += revenue * line.lineMarginPercent;
      order.weightedMarginDenominator += revenue;
    }

    const item = getOrCreateItem(order.items, line.productCode, line.productName);
    item.quantity += netQuantity;
    item.volume += volume;
    item.revenue += revenue;
    item.unitPriceWeightedNumerator += line.unitPrice * netQuantity;
    if (line.lineMarginPercent !== null && Number.isFinite(line.lineMarginPercent)) {
      item.weightedMarginNumerator += revenue * line.lineMarginPercent;
      item.weightedMarginDenominator += revenue;
    }
  }

  for (const [customerCode, orders] of ordersByCustomer.entries()) {
    const customer = getOrCreateCustomer(customers, customerCode);
    const materializedOrders = Array.from(orders.values()).map(toRecentInvoicedOrder);

    for (const order of materializedOrders) {
      if (order.occurredAt >= sinceJan2024Cutoff) {
        customer.invoicedCountSinceJan2024 += 1;
      }
      if (order.occurredAt >= last60Cutoff) {
        customer.invoicedCountLast60Days += 1;
      }
      if (order.occurredAt >= last12Cutoff) {
        customer.invoicedCountLast12Months += 1;
      }
    }

    customer.recentInvoicedOrders = sortAndLimitInvoiced(materializedOrders);
    customer.lastInvoicedPurchaseAt = customer.recentInvoicedOrders[0]?.occurredAt ?? null;
  }

  for (const row of dedupeLostRows(seed.lostOrders)) {
    if (row.sitped !== LOST_SITPED) {
      continue;
    }
    const customer = getOrCreateCustomer(customers, row.customerCode);
    customer.recentLostOrders.push({
      orderNumber: row.orderNumber,
      occurredAt: row.issueDate,
      codRep: row.codRep ?? null,
      sitped: row.sitped,
    });
    if (row.issueDate >= sinceJan2024Cutoff) {
      customer.lostCountSinceJan2024 += 1;
    }
    if (row.issueDate >= last60Cutoff) {
      customer.lostCountLast60Days += 1;
    }
    if (row.issueDate >= last12Cutoff) {
      customer.lostCountLast12Months += 1;
    }
  }

  const snapshotCustomers: OverviewCustomerRecentCommercialMotionSnapshot["customers"] = {};
  for (const [customerCode, customer] of customers.entries()) {
    customer.recentLostOrders = sortAndLimitLost(customer.recentLostOrders);
    if (customer.recentInvoicedOrders.length === 0) {
      customer.lastInvoicedPurchaseAt = null;
    } else {
      customer.lastInvoicedPurchaseAt = customer.recentInvoicedOrders[0]?.occurredAt ?? null;
    }
    customer.lastLostOrderAt = customer.recentLostOrders[0]?.occurredAt ?? null;
    customer.lastCommercialMovementAt = maxDate(
      customer.lastInvoicedPurchaseAt,
      customer.lastLostOrderAt,
    );

    snapshotCustomers[String(customerCode)] = customer;
  }

  return {
    customers: snapshotCustomers,
  };
}

function isValidInvoicedLine(line: OverviewCustomerInvoicedOrderLine): boolean {
  return (
    Number.isInteger(line.customerCode) &&
    line.customerCode > 0 &&
    Number.isInteger(line.orderNumber) &&
    line.orderNumber > 0 &&
    isIsoDateString(line.invoiceDate) &&
    typeof line.productCode === "string" &&
    line.productCode.length > 0 &&
    typeof line.productName === "string" &&
    line.productName.length > 0 &&
    Number.isFinite(line.quantityInvoiced) &&
    Number.isFinite(line.quantityReturned) &&
    Number.isFinite(line.unitPrice)
  );
}

function getOrCreateCustomerOrders(
  customers: Map<number, Map<number, OrderAccumulator>>,
  customerCode: number,
): Map<number, OrderAccumulator> {
  const existing = customers.get(customerCode);
  if (existing) {
    return existing;
  }
  const created = new Map<number, OrderAccumulator>();
  customers.set(customerCode, created);
  return created;
}

function getOrCreateOrder(
  orders: Map<number, OrderAccumulator>,
  line: OverviewCustomerInvoicedOrderLine,
): OrderAccumulator {
  const existing = orders.get(line.orderNumber);
  if (existing) {
    return existing;
  }

  const created: OrderAccumulator = {
    orderNumber: line.orderNumber,
    occurredAt: line.invoiceDate,
    codRep: line.codRep ?? null,
    branchCode: line.branchCode ?? null,
    revenue: 0,
    volume: 0,
    weightedMarginNumerator: 0,
    weightedMarginDenominator: 0,
    items: new Map(),
  };
  orders.set(line.orderNumber, created);
  return created;
}

function getOrCreateItem(
  items: Map<string, ItemAccumulator>,
  productCode: string,
  productName: string,
): ItemAccumulator {
  const existing = items.get(productCode);
  if (existing) {
    return existing;
  }

  const created: ItemAccumulator = {
    productCode,
    productName,
    quantity: 0,
    volume: 0,
    revenue: 0,
    unitPriceWeightedNumerator: 0,
    weightedMarginNumerator: 0,
    weightedMarginDenominator: 0,
  };
  items.set(productCode, created);
  return created;
}

function toRecentInvoicedOrder(order: OrderAccumulator): OverviewCustomerRecentInvoicedOrder {
  const marginPercent =
    order.weightedMarginDenominator > 0
      ? round2(order.weightedMarginNumerator / order.weightedMarginDenominator)
      : null;

  const items: OverviewCustomerRecentInvoicedOrderItem[] = Array.from(order.items.values())
    .map((item) => {
      const itemMargin =
        item.weightedMarginDenominator > 0
          ? round2(item.weightedMarginNumerator / item.weightedMarginDenominator)
          : null;
      return {
        productCode: item.productCode,
        productName: item.productName,
        quantity: round2(item.quantity),
        volume: round2(item.volume),
        revenue: round2(item.revenue),
        unitPrice: round2(item.unitPriceWeightedNumerator / item.quantity),
        marginPercent: itemMargin,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return {
    orderNumber: order.orderNumber,
    occurredAt: order.occurredAt,
    codRep: order.codRep,
    branchCode: order.branchCode,
    revenue: round2(order.revenue),
    volume: round2(order.volume),
    marginPercent,
    items,
  };
}

function dedupeLostRows(rows: OverviewCustomerLostOrderRow[]): OverviewCustomerLostOrderRow[] {
  const byKey = new Map<string, OverviewCustomerLostOrderRow>();
  for (const row of rows) {
    const key = `${row.customerCode}:${row.orderNumber}`;
    const existing = byKey.get(key);
    if (!existing || row.issueDate > existing.issueDate) {
      byKey.set(key, row);
    }
  }
  return Array.from(byKey.values());
}

function getOrCreateCustomer(
  customers: Map<number, OverviewCustomerRecentCommercialMotion>,
  customerCode: number,
): OverviewCustomerRecentCommercialMotion {
  const existing = customers.get(customerCode);
  if (existing) {
    return existing;
  }

  const created: OverviewCustomerRecentCommercialMotion = {
    lastInvoicedPurchaseAt: null,
    lastLostOrderAt: null,
    lastCommercialMovementAt: null,
    invoicedCountSinceJan2024: 0,
    lostCountSinceJan2024: 0,
    invoicedCountLast60Days: 0,
    lostCountLast60Days: 0,
    invoicedCountLast12Months: 0,
    lostCountLast12Months: 0,
    recentInvoicedOrders: [],
    recentLostOrders: [],
  };
  customers.set(customerCode, created);
  return created;
}

function sortAndLimitInvoiced(
  rows: OverviewCustomerRecentInvoicedOrder[],
): OverviewCustomerRecentInvoicedOrder[] {
  return [...rows]
    .sort((a, b) => compareDateAndOrder(b.occurredAt, a.occurredAt, b.orderNumber, a.orderNumber))
    .slice(0, MAX_RECENT_ROWS);
}

function sortAndLimitLost(rows: OverviewCustomerRecentLostOrder[]): OverviewCustomerRecentLostOrder[] {
  return [...rows]
    .sort((a, b) => compareDateAndOrder(b.occurredAt, a.occurredAt, b.orderNumber, a.orderNumber))
    .slice(0, MAX_RECENT_ROWS);
}

function compareDateAndOrder(
  leftDate: string,
  rightDate: string,
  leftOrderNumber: number,
  rightOrderNumber: number,
): number {
  const dateDiff = leftDate.localeCompare(rightDate);
  if (dateDiff !== 0) {
    return dateDiff;
  }
  return leftOrderNumber - rightOrderNumber;
}

function maxDate(first: string | null, second: string | null): string | null {
  if (!first) {
    return second;
  }
  if (!second) {
    return first;
  }
  return first >= second ? first : second;
}

function shiftMonths(date: Date, delta: number): Date {
  const shifted = new Date(date.getTime());
  shifted.setUTCMonth(shifted.getUTCMonth() + delta);
  return shifted;
}

function shiftDays(date: Date, delta: number): Date {
  const shifted = new Date(date.getTime());
  shifted.setUTCDate(shifted.getUTCDate() + delta);
  return shifted;
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
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
