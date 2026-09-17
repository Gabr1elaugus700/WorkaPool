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
): OverviewCustomerRecentCommercialMotionSnapshot {
  const customers = new Map<number, OverviewCustomerRecentCommercialMotion>();

  for (const row of seed.invoicedOrders) {
    const customer = getOrCreateCustomer(customers, row.customerCode);
    customer.recentInvoicedOrders.push({
      orderNumber: row.orderNumber,
      occurredAt: row.invoiceDate,
      codRep: row.codRep ?? null,
      branchCode: row.branchCode ?? null,
    });
  }

  for (const row of seed.lostOrders) {
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
