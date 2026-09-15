import type {
  BranchIndicator,
  OverviewCustomerIdentity,
  OverviewCustomerIdentitySnapshot,
} from "../models/OverviewCustomerIdentity";

export type OverviewCustomerIdentityBaseRow = {
  customerCode: number;
  tradeName: string;
  document: string;
  city: string;
  state: string;
  segment?: string | null;
  registrationDate?: string | null;
};

export type OverviewCustomerInvoicedSaleRow = {
  customerCode: number;
  codRep?: number | null;
  invoiceDate: string;
  branchCode: number;
  isInvoiced: boolean;
};

export type OverviewCustomerIdentitySeed = {
  customers: OverviewCustomerIdentityBaseRow[];
  sales: OverviewCustomerInvoicedSaleRow[];
};

type SalesSummary = {
  firstPurchase: string | null;
  lastPurchase: string | null;
  primaryCodRep: number | null;
  branchIndicator: BranchIndicator;
};

export function materializeOverviewCustomerIdentity(
  seed: OverviewCustomerIdentitySeed,
): OverviewCustomerIdentitySnapshot {
  const customers: Record<string, OverviewCustomerIdentity> = {};

  for (const base of seed.customers) {
    const sales = seed.sales.filter(
      (sale) => sale.customerCode === base.customerCode && sale.isInvoiced,
    );
    const summary = summarizeSales(sales);
    customers[String(base.customerCode)] = {
      customerCode: base.customerCode,
      tradeName: base.tradeName,
      document: base.document,
      city: base.city,
      state: base.state,
      segment: base.segment ?? null,
      registrationDate: base.registrationDate ?? null,
      primaryCodRep: summary.primaryCodRep,
      firstInvoicedPurchaseAt: summary.firstPurchase,
      lastInvoicedPurchaseAt: summary.lastPurchase,
      branchIndicator: summary.branchIndicator,
    };
  }

  return { customers };
}

function summarizeSales(sales: OverviewCustomerInvoicedSaleRow[]): SalesSummary {
  if (sales.length === 0) {
    return {
      firstPurchase: null,
      lastPurchase: null,
      primaryCodRep: null,
      branchIndicator: "CTB",
    };
  }

  const dates = sales.map((sale) => sale.invoiceDate);
  dates.sort((a, b) => a.localeCompare(b));

  const branchCodes = new Set(sales.map((sale) => normalizeBranchCode(sale.branchCode)));
  const branchIndicator = deriveBranchIndicator(branchCodes);

  const repStats = new Map<
    number,
    {
      orderCount: number;
      lastSale: string;
    }
  >();

  for (const sale of sales) {
    if (sale.codRep == null) {
      continue;
    }
    const current = repStats.get(sale.codRep);
    if (!current) {
      repStats.set(sale.codRep, {
        orderCount: 1,
        lastSale: sale.invoiceDate,
      });
      continue;
    }
    current.orderCount += 1;
    if (sale.invoiceDate > current.lastSale) {
      current.lastSale = sale.invoiceDate;
    }
  }

  const sortedReps = Array.from(repStats.entries()).sort((a, b) => {
    const countDelta = b[1].orderCount - a[1].orderCount;
    if (countDelta !== 0) {
      return countDelta;
    }
    return b[1].lastSale.localeCompare(a[1].lastSale);
  });

  return {
    firstPurchase: dates[0] ?? null,
    lastPurchase: dates[dates.length - 1] ?? null,
    primaryCodRep: sortedReps.length > 0 ? sortedReps[0][0] : null,
    branchIndicator,
  };
}

function normalizeBranchCode(branchCode: number): "MGA" | "CTB" {
  return branchCode === 1 ? "MGA" : "CTB";
}

function deriveBranchIndicator(branchCodes: Set<"MGA" | "CTB">): BranchIndicator {
  if (branchCodes.has("MGA") && branchCodes.has("CTB")) {
    return "BOTH";
  }
  if (branchCodes.has("MGA")) {
    return "MGA";
  }
  return "CTB";
}
