const HALF_VOLUME_PRODUCT_CODE = "101072";
const CUTOFF_DATE = "2024-01-01";
const OUTROS_GRUPO_CODIGO = "OUTROS";
const OUTROS_GRUPO_DESCRICAO = "OUTROS PRODUTOS";

export type OverviewCustomerWinsByGroupLine = {
  customerCode: number;
  orderId: number;
  invoiceNumber: number;
  issuedAt: string;
  productCode: string;
  quantityInvoiced: number;
  quantityReturned: number;
  unitPrice: number;
  lineMarginPercent: number | null;
};

export type OverviewCustomerProdutoGrupoMapRow = {
  produtoCodigo: string;
  grupoCodigo: string;
  grupoDescricao: string;
};

export type OverviewCustomerWinsByGroupSeed = {
  lines: OverviewCustomerWinsByGroupLine[];
  grupoMap: OverviewCustomerProdutoGrupoMapRow[];
};

export type OverviewCustomerWinsByGroupRow = {
  grupoCodigo: string;
  grupoDescricao: string;
  numped: number;
  numnfv: number;
  datemi: string;
  qtdped: number;
  volume: number;
  vlrfinal: number;
  preuni: number;
  margem: number | null;
};

export type OverviewCustomerWinsByGroupSnapshot = {
  customers: Record<string, OverviewCustomerWinsByGroupRow[]>;
};

type OrderGroupAccumulator = {
  grupoCodigo: string;
  grupoDescricao: string;
  numped: number;
  quantity: number;
  volume: number;
  revenue: number;
  weightedPriceNumerator: number;
  weightedMarginNumerator: number;
  weightedMarginDenominator: number;
  latestIssuedAt: string;
  latestInvoiceNumber: number;
};

export function materializeOverviewCustomerWinsByGroup(
  seed: OverviewCustomerWinsByGroupSeed,
): OverviewCustomerWinsByGroupSnapshot {
  const grupoByProduct = new Map<string, OverviewCustomerProdutoGrupoMapRow>();
  for (const row of seed.grupoMap) {
    if (row.produtoCodigo.length > 0) {
      grupoByProduct.set(row.produtoCodigo, row);
    }
  }

  const byCustomer = new Map<number, Map<string, OrderGroupAccumulator>>();

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
      line.productCode === HALF_VOLUME_PRODUCT_CODE ? netQuantity / 2 : netQuantity;

    const mapped = grupoByProduct.get(line.productCode);
    const grupoCodigo = mapped?.grupoCodigo ?? OUTROS_GRUPO_CODIGO;
    const grupoDescricao = mapped?.grupoDescricao ?? OUTROS_GRUPO_DESCRICAO;
    const customerOrders = getOrCreateCustomer(byCustomer, line.customerCode);
    const acc = getOrCreateOrderGroup(
      customerOrders,
      line.customerCode,
      grupoCodigo,
      grupoDescricao,
      line.orderId,
      line.issuedAt,
      line.invoiceNumber,
    );

    acc.quantity += netQuantity;
    acc.volume += volume;
    acc.revenue += revenue;
    acc.weightedPriceNumerator += line.unitPrice * volume;

    if (isNewerInvoice(line.issuedAt, line.invoiceNumber, acc.latestIssuedAt, acc.latestInvoiceNumber)) {
      acc.latestIssuedAt = line.issuedAt;
      acc.latestInvoiceNumber = line.invoiceNumber;
    }

    if (line.lineMarginPercent !== null && Number.isFinite(line.lineMarginPercent)) {
      acc.weightedMarginNumerator += revenue * line.lineMarginPercent;
      acc.weightedMarginDenominator += revenue;
    }
  }

  const customers: OverviewCustomerWinsByGroupSnapshot["customers"] = {};
  for (const [customerCode, orders] of byCustomer.entries()) {
    const rows = Array.from(orders.values())
      .filter((acc) => acc.volume > 0 && acc.revenue > 0)
      .map((acc) => {
        const weightedMargin =
          acc.weightedMarginDenominator > 0
            ? acc.weightedMarginNumerator / acc.weightedMarginDenominator
            : null;
        return {
          grupoCodigo: acc.grupoCodigo,
          grupoDescricao: acc.grupoDescricao,
          numped: acc.numped,
          numnfv: acc.latestInvoiceNumber,
          datemi: acc.latestIssuedAt,
          qtdped: round2(acc.quantity),
          volume: round2(acc.volume),
          vlrfinal: round2(acc.revenue),
          preuni: round2(acc.weightedPriceNumerator / acc.volume),
          margem: weightedMargin === null ? null : round2(weightedMargin),
        };
      });

    rows.sort(compareWinsRows);
    if (rows.length > 0) {
      customers[String(customerCode)] = rows;
    }
  }

  return { customers };
}

function getOrCreateCustomer(
  acc: Map<number, Map<string, OrderGroupAccumulator>>,
  customerCode: number,
): Map<string, OrderGroupAccumulator> {
  const existing = acc.get(customerCode);
  if (existing) {
    return existing;
  }
  const created = new Map<string, OrderGroupAccumulator>();
  acc.set(customerCode, created);
  return created;
}

function getOrCreateOrderGroup(
  orders: Map<string, OrderGroupAccumulator>,
  customerCode: number,
  grupoCodigo: string,
  grupoDescricao: string,
  numped: number,
  issuedAt: string,
  invoiceNumber: number,
): OrderGroupAccumulator {
  const key = `${customerCode}|${grupoCodigo}|${numped}`;
  const existing = orders.get(key);
  if (existing) {
    return existing;
  }
  const created: OrderGroupAccumulator = {
    grupoCodigo,
    grupoDescricao,
    numped,
    quantity: 0,
    volume: 0,
    revenue: 0,
    weightedPriceNumerator: 0,
    weightedMarginNumerator: 0,
    weightedMarginDenominator: 0,
    latestIssuedAt: issuedAt,
    latestInvoiceNumber: invoiceNumber,
  };
  orders.set(key, created);
  return created;
}

function isNewerInvoice(
  issuedAt: string,
  invoiceNumber: number,
  currentIssuedAt: string,
  currentInvoiceNumber: number,
): boolean {
  if (issuedAt > currentIssuedAt) {
    return true;
  }
  if (issuedAt < currentIssuedAt) {
    return false;
  }
  return invoiceNumber > currentInvoiceNumber;
}

function compareWinsRows(
  left: OverviewCustomerWinsByGroupRow,
  right: OverviewCustomerWinsByGroupRow,
): number {
  if (left.datemi !== right.datemi) {
    return right.datemi.localeCompare(left.datemi);
  }
  if (left.numped !== right.numped) {
    return right.numped - left.numped;
  }
  return left.grupoCodigo.localeCompare(right.grupoCodigo);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function isValidLine(line: OverviewCustomerWinsByGroupLine): boolean {
  return (
    Number.isInteger(line.customerCode) &&
    line.customerCode > 0 &&
    Number.isInteger(line.orderId) &&
    line.orderId > 0 &&
    Number.isInteger(line.invoiceNumber) &&
    line.invoiceNumber > 0 &&
    typeof line.productCode === "string" &&
    line.productCode.length > 0 &&
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
