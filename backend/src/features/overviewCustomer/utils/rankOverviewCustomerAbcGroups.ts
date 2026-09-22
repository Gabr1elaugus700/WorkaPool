import type { OverviewCustomerWinsByGroupRow } from "../sync/materializeOverviewCustomerWinsByGroup";

export type OverviewCustomerAbcGroup = {
  grupoCodigo: string;
  grupoDescricao: string;
  revenueShare: number;
};

const TOP_GROUPS = 5;

export function rankOverviewCustomerAbcGroups(
  rows: OverviewCustomerWinsByGroupRow[],
): OverviewCustomerAbcGroup[] {
  const byGroup = new Map<string, { grupoDescricao: string; revenue: number }>();

  for (const row of rows) {
    const existing = byGroup.get(row.grupoCodigo);
    if (existing) {
      existing.revenue += row.vlrfinal;
      continue;
    }
    byGroup.set(row.grupoCodigo, {
      grupoDescricao: row.grupoDescricao,
      revenue: row.vlrfinal,
    });
  }

  let totalRevenue = 0;
  for (const group of byGroup.values()) {
    totalRevenue += group.revenue;
  }

  if (totalRevenue <= 0) {
    return [];
  }

  return Array.from(byGroup.entries())
    .map(([grupoCodigo, group]) => ({
      grupoCodigo,
      grupoDescricao: group.grupoDescricao,
      revenueShare: round2((group.revenue / totalRevenue) * 100),
    }))
    .sort((left, right) => {
      if (right.revenueShare !== left.revenueShare) {
        return right.revenueShare - left.revenueShare;
      }
      return left.grupoCodigo.localeCompare(right.grupoCodigo);
    })
    .slice(0, TOP_GROUPS);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
