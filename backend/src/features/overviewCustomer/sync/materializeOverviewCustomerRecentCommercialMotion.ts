import type {
  OverviewCustomerRecentCommercialMotion,
  OverviewCustomerRecentCommercialMotionSnapshot,
  OverviewCustomerRecentInvoicedOrder,
  OverviewCustomerRecentLostOrder,
} from "../models/OverviewCustomerIdentity";

const MAX_RECENT_ROWS = 5;
const LOST_SITPED = 5;
export type OverviewCustomerInvoicedOrderRow = {
  customerCode: number;
  orderNumber: number;
  invoiceDate: string;
  codRep?: number | null;
  branchCode?: number | null;
};

export type OverviewCustomerLostOrderRow = {
  customerCode: number;
  orderNumber: number;
  issueDate: string;
  sitped: number;
  codRep?: number | null;
};

export type OverviewCustomerRecentCommercialMotionSeed = {
  invoicedOrders: OverviewCustomerInvoicedOrderRow[];
  lostOrders: OverviewCustomerLostOrderRow[];
};

export function materializeOverviewCustomerRecentCommercialMotion(
  seed: OverviewCustomerRecentCommercialMotionSeed,
  now: Date = new Date(),
): OverviewCustomerRecentCommercialMotionSnapshot {
  const last12Cutoff = formatUtcDate(shiftMonths(now, -12));
  const customers = new Map<number, OverviewCustomerRecentCommercialMotion>();

  for (const row of dedupeInvoicedRows(seed.invoicedOrders)) {
    const customer = getOrCreateCustomer(customers, row.customerCode);
    customer.recentInvoicedOrders.push({
      orderNumber: row.orderNumber,
      occurredAt: row.invoiceDate,
      codRep: row.codRep ?? null,
      branchCode: row.branchCode ?? null,
    });
    if (row.invoiceDate >= last12Cutoff) {
      customer.invoicedCountLast12Months += 1;
    }
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
    if (row.issueDate >= last12Cutoff) {
      customer.lostCountLast12Months += 1;
    }
  }

  const snapshotCustomers: OverviewCustomerRecentCommercialMotionSnapshot["customers"] = {};
  for (const [customerCode, customer] of customers.entries()) {
    customer.recentInvoicedOrders = sortAndLimitInvoiced(customer.recentInvoicedOrders);
    customer.recentLostOrders = sortAndLimitLost(customer.recentLostOrders);
    customer.lastInvoicedPurchaseAt = customer.recentInvoicedOrders[0]?.occurredAt ?? null;
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

function dedupeInvoicedRows(
  rows: OverviewCustomerInvoicedOrderRow[],
): OverviewCustomerInvoicedOrderRow[] {
  const byKey = new Map<string, OverviewCustomerInvoicedOrderRow>();
  for (const row of rows) {
    const key = `${row.customerCode}:${row.orderNumber}`;
    const existing = byKey.get(key);
    if (!existing || row.invoiceDate > existing.invoiceDate) {
      byKey.set(key, row);
    }
  }
  return Array.from(byKey.values());
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

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
