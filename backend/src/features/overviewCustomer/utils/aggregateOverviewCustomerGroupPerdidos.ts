export type OverviewCustomerGroupPerdidoLine = {
  numped: number;
  datemi: string;
  qtdped: number;
  preuni: number;
  vlrfinal: number;
  margem: number | null;
};

export type OverviewCustomerGroupPerdidoTotals = {
  numped: number;
  datemi: string;
  vlrfinal: number;
  qtdped: number;
  preuni: number;
  margem: number | null;
};

const TOP_PERDIDOS = 5;

type OrderAccumulator = {
  numped: number;
  quantity: number;
  revenue: number;
  weightedPriceNumerator: number;
  weightedMarginNumerator: number;
  weightedMarginDenominator: number;
  latestDatemi: string;
};

export function aggregateOverviewCustomerGroupPerdidos(
  lines: OverviewCustomerGroupPerdidoLine[],
): OverviewCustomerGroupPerdidoTotals[] {
  const byOrder = new Map<number, OrderAccumulator>();

  for (const line of lines) {
    if (!isValidLine(line)) {
      continue;
    }

    const acc = getOrCreate(byOrder, line.numped, line.datemi);
    acc.quantity += line.qtdped;
    acc.revenue += line.vlrfinal;
    acc.weightedPriceNumerator += line.preuni * line.qtdped;

    if (line.datemi > acc.latestDatemi) {
      acc.latestDatemi = line.datemi;
    }

    if (line.margem !== null && Number.isFinite(line.margem)) {
      acc.weightedMarginNumerator += line.vlrfinal * line.margem;
      acc.weightedMarginDenominator += line.vlrfinal;
    }
  }

  return Array.from(byOrder.values())
    .filter((acc) => acc.quantity > 0)
    .map((acc) => {
      const weightedMargin =
        acc.weightedMarginDenominator > 0
          ? acc.weightedMarginNumerator / acc.weightedMarginDenominator
          : null;
      return {
        numped: acc.numped,
        datemi: acc.latestDatemi,
        vlrfinal: round2(acc.revenue),
        qtdped: round2(acc.quantity),
        preuni: acc.quantity > 0 ? round2(acc.weightedPriceNumerator / acc.quantity) : 0,
        margem: weightedMargin === null ? null : round2(weightedMargin),
      };
    })
    .sort(comparePerdidos)
    .slice(0, TOP_PERDIDOS);
}

function getOrCreate(
  byOrder: Map<number, OrderAccumulator>,
  numped: number,
  datemi: string,
): OrderAccumulator {
  const existing = byOrder.get(numped);
  if (existing) {
    return existing;
  }
  const created: OrderAccumulator = {
    numped,
    quantity: 0,
    revenue: 0,
    weightedPriceNumerator: 0,
    weightedMarginNumerator: 0,
    weightedMarginDenominator: 0,
    latestDatemi: datemi,
  };
  byOrder.set(numped, created);
  return created;
}

function comparePerdidos(
  left: OverviewCustomerGroupPerdidoTotals,
  right: OverviewCustomerGroupPerdidoTotals,
): number {
  if (left.datemi !== right.datemi) {
    return right.datemi.localeCompare(left.datemi);
  }
  return right.numped - left.numped;
}

function isValidLine(line: OverviewCustomerGroupPerdidoLine): boolean {
  return (
    Number.isInteger(line.numped) &&
    line.numped > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(line.datemi) &&
    Number.isFinite(line.qtdped) &&
    line.qtdped > 0 &&
    Number.isFinite(line.preuni) &&
    Number.isFinite(line.vlrfinal)
  );
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
