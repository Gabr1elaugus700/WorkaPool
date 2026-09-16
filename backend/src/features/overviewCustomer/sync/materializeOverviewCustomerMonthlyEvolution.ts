import type { OverviewCustomerMonthlyEvolutionSnapshot } from "../models/OverviewCustomerIdentity";

const OVERVIEW_CUTOFF_MONTH = "2024-01";

export type OverviewCustomerMonthlyEvolutionRowSeed = {
  customerCode: number;
  month: string;
  revenue: number;
  volume: number;
  orderCount: number;
  marginPercent: number | null;
};

export type OverviewCustomerMonthlyEvolutionSeed = {
  rows: OverviewCustomerMonthlyEvolutionRowSeed[];
};

export function materializeOverviewCustomerMonthlyEvolution(
  seed: OverviewCustomerMonthlyEvolutionSeed,
): OverviewCustomerMonthlyEvolutionSnapshot {
  const grouped = new Map<number, OverviewCustomerMonthlyEvolutionSnapshot["customers"][string]>();

  for (const row of seed.rows) {
    if (!isValidRow(row)) {
      continue;
    }
    if (row.month < OVERVIEW_CUTOFF_MONTH) {
      continue;
    }

    const current = grouped.get(row.customerCode) ?? [];
    current.push({
      month: row.month,
      revenue: round2(row.revenue),
      volume: round2(row.volume),
      orderCount: row.orderCount,
      marginPercent: row.marginPercent === null ? null : round2(row.marginPercent),
    });
    grouped.set(row.customerCode, current);
  }

  const customers: OverviewCustomerMonthlyEvolutionSnapshot["customers"] = {};
  for (const [customerCode, rows] of grouped.entries()) {
    rows.sort((a, b) => a.month.localeCompare(b.month));
    customers[String(customerCode)] = rows;
  }

  return { customers };
}

function isValidRow(row: OverviewCustomerMonthlyEvolutionRowSeed): boolean {
  return (
    Number.isInteger(row.customerCode) &&
    row.customerCode > 0 &&
    isYearMonthString(row.month) &&
    Number.isFinite(row.revenue) &&
    Number.isFinite(row.volume) &&
    Number.isInteger(row.orderCount) &&
    row.orderCount >= 0 &&
    isNullableFiniteNumber(row.marginPercent)
  );
}

function isYearMonthString(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return false;
  }
  const monthNumber = Number.parseInt(value.slice(5), 10);
  return monthNumber >= 1 && monthNumber <= 12;
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
