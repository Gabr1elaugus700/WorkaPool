import type { OverviewCustomerPurchasedProductsSnapshot } from "../models/OverviewCustomerIdentity";

const HALF_VOLUME_PRODUCT_CODE = "101072";
const CUTOFF_DATE = "2024-01-01";
const DAY_MS = 24 * 60 * 60 * 1000;

export type OverviewCustomerPurchasedProductLine = {
  customerCode: number;
  orderId: number;
  issuedAt: string;
  productCode: string;
  productName: string;
  quantityInvoiced: number;
  quantityReturned: number;
  unitPrice: number;
  lineMarginPercent: number | null;
};

export type OverviewCustomerPurchasedProductsSeed = {
  lines: OverviewCustomerPurchasedProductLine[];
};

type ProductAccumulator = {
  productCode: string;
  productName: string;
  quantity: number;
  volume: number;
  revenue: number;
  weightedMarginNumerator: number;
  weightedMarginDenominator: number;
  firstPurchaseAt: string;
  lastPurchaseAt: string;
  orderDatesByOrderId: Map<number, string>;
};

type CustomerAccumulator = {
  totalRevenue: number;
  products: Map<string, ProductAccumulator>;
};

export function materializeOverviewCustomerPurchasedProducts(
  seed: OverviewCustomerPurchasedProductsSeed,
): OverviewCustomerPurchasedProductsSnapshot {
  const byCustomer = new Map<number, CustomerAccumulator>();

  for (const line of seed.lines) {
    if (!isValidLine(line) || line.issuedAt < CUTOFF_DATE) {
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
      line.productCode === HALF_VOLUME_PRODUCT_CODE
        ? netQuantity / 2
        : netQuantity;

    const customer = getOrCreateCustomer(byCustomer, line.customerCode);
    customer.totalRevenue += revenue;
    const product = getOrCreateProduct(
      customer.products,
      line.productCode,
      line.productName,
      line.issuedAt,
    );

    product.quantity += netQuantity;
    product.volume += volume;
    product.revenue += revenue;
    product.firstPurchaseAt = minDate(product.firstPurchaseAt, line.issuedAt);
    product.lastPurchaseAt = maxDate(product.lastPurchaseAt, line.issuedAt);
    const knownOrderDate = product.orderDatesByOrderId.get(line.orderId);
    if (!knownOrderDate || line.issuedAt < knownOrderDate) {
      product.orderDatesByOrderId.set(line.orderId, line.issuedAt);
    }

    if (line.lineMarginPercent !== null && Number.isFinite(line.lineMarginPercent)) {
      product.weightedMarginNumerator += revenue * line.lineMarginPercent;
      product.weightedMarginDenominator += revenue;
    }
  }

  const customers: OverviewCustomerPurchasedProductsSnapshot["customers"] = {};
  for (const [customerCode, customer] of byCustomer.entries()) {
    if (customer.totalRevenue <= 0) {
      continue;
    }

    const rows = Array.from(customer.products.values()).map((product) => {
      const weightedMargin =
        product.weightedMarginDenominator > 0
          ? product.weightedMarginNumerator / product.weightedMarginDenominator
          : null;
      return {
        productCode: product.productCode,
        productName: product.productName,
        quantity: round2(product.quantity),
        volume: round2(product.volume),
        revenue: round2(product.revenue),
        averagePrice: round2(product.revenue / product.quantity),
        marginPercentWeightedByRevenue:
          weightedMargin === null ? null : round2(weightedMargin),
        firstPurchaseAt: product.firstPurchaseAt,
        lastPurchaseAt: product.lastPurchaseAt,
        frequencyDays: computeFrequencyDays(product.orderDatesByOrderId),
        revenueShare: round2((product.revenue / customer.totalRevenue) * 100),
      };
    });

    rows.sort((a, b) => {
      if (b.revenueShare !== a.revenueShare) {
        return b.revenueShare - a.revenueShare;
      }
      return a.productCode.localeCompare(b.productCode);
    });
    customers[String(customerCode)] = rows;
  }

  return { customers };
}

function getOrCreateCustomer(
  acc: Map<number, CustomerAccumulator>,
  customerCode: number,
): CustomerAccumulator {
  const existing = acc.get(customerCode);
  if (existing) {
    return existing;
  }
  const created: CustomerAccumulator = { totalRevenue: 0, products: new Map() };
  acc.set(customerCode, created);
  return created;
}

function getOrCreateProduct(
  products: Map<string, ProductAccumulator>,
  productCode: string,
  productName: string,
  issuedAt: string,
): ProductAccumulator {
  const key = `${productCode}|${productName}`;
  const existing = products.get(key);
  if (existing) {
    return existing;
  }
  const created: ProductAccumulator = {
    productCode,
    productName,
    quantity: 0,
    volume: 0,
    revenue: 0,
    weightedMarginNumerator: 0,
    weightedMarginDenominator: 0,
    firstPurchaseAt: issuedAt,
    lastPurchaseAt: issuedAt,
    orderDatesByOrderId: new Map<number, string>(),
  };
  products.set(key, created);
  return created;
}

function computeFrequencyDays(orderDatesByOrderId: Map<number, string>): number | null {
  const dates = Array.from(orderDatesByOrderId.values()).sort((a, b) => a.localeCompare(b));
  if (dates.length < 2) {
    return null;
  }
  let diffSum = 0;
  let diffCount = 0;
  for (let index = 1; index < dates.length; index += 1) {
    diffSum += diffDays(toUtcDate(dates[index - 1]), toUtcDate(dates[index]));
    diffCount += 1;
  }
  return diffCount > 0 ? round2(diffSum / diffCount) : null;
}

function diffDays(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

function toUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function minDate(left: string, right: string): string {
  return left <= right ? left : right;
}

function maxDate(left: string, right: string): string {
  return left >= right ? left : right;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function isValidLine(line: OverviewCustomerPurchasedProductLine): boolean {
  return (
    Number.isInteger(line.customerCode) &&
    line.customerCode > 0 &&
    Number.isInteger(line.orderId) &&
    line.orderId > 0 &&
    typeof line.productCode === "string" &&
    line.productCode.length > 0 &&
    typeof line.productName === "string" &&
    line.productName.length > 0 &&
    isIsoDateString(line.issuedAt) &&
    Number.isFinite(line.quantityInvoiced) &&
    Number.isFinite(line.quantityReturned) &&
    Number.isFinite(line.unitPrice)
  );
}

function isIsoDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  return !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}
