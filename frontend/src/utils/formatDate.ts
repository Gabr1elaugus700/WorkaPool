const DAY_MS = 24 * 60 * 60 * 1000;

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDaysSinceLastPurchase(value: number | null): string {
  if (value == null) {
    return "Não informado";
  }
  if (value === 0) {
    return "Hoje";
  }
  if (value === 1) {
    return "1 dia";
  }
  return `${formatNumber(value)} dias`;
}

export function formatPurchaseFrequencyDays(value: number | null): string {
  if (value == null) {
    return "Não informado";
  }
  const days = Math.round(value);
  if (days === 1) {
    return "1 dia";
  }
  return `${formatNumber(days)} dias`;
}

export function estimateNextPurchaseDate(
  lastInvoicedPurchaseAt: string | null,
  purchaseFrequencyDays: number | null,
): string | null {
  if (!lastInvoicedPurchaseAt || purchaseFrequencyDays == null) {
    return null;
  }

  const lastPurchase = Date.parse(`${lastInvoicedPurchaseAt}T00:00:00.000Z`);
  if (Number.isNaN(lastPurchase)) {
    return null;
  }

  const estimated = new Date(lastPurchase + purchaseFrequencyDays * DAY_MS);
  return estimated.toISOString().slice(0, 10);
}

export function formatEstimatedDaysUntilNextPurchase(
  lastInvoicedPurchaseAt: string | null,
  purchaseFrequencyDays: number | null,
  referenceDate: Date = new Date(),
): string | null {
  const estimatedDate = estimateNextPurchaseDate(
    lastInvoicedPurchaseAt,
    purchaseFrequencyDays,
  );
  if (!estimatedDate) {
    return null;
  }

  const estimated = Date.parse(`${estimatedDate}T00:00:00.000Z`);
  const reference = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
  );
  const diffDays = Math.round((estimated - reference) / DAY_MS);

  if (diffDays === 0) {
    return "Hoje";
  }
  if (diffDays === 1) {
    return "~1 dia";
  }
  if (diffDays > 0) {
    return `~${formatNumber(diffDays)} dias`;
  }
  if (diffDays === -1) {
    return "1 dia atrás";
  }
  return `${formatNumber(Math.abs(diffDays))} dias atrás`;
}

export function formatIsoDateLabel(value: string | null): string {
  if (!value) {
    return "Não informado";
  }

  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(parsed));
}
