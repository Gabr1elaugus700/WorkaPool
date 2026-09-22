const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

export function formatOverviewNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatOverviewDecimal(value: number): string {
  return decimalFormatter.format(value);
}

export function formatOverviewCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatOverviewPercent(value: number | null): string {
  if (value == null) {
    return "Não informado";
  }
  return `${formatOverviewDecimal(value)}%`;
}
