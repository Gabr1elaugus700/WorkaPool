import {
  formatOverviewCurrency,
  formatOverviewDecimal,
  formatOverviewNumber,
} from "./overviewCustomerFormatters";

type QuantityRow = {
  qtdped: number;
};

type ValueRow = {
  vlrfinal: number;
};

export function sumGroupVolumeKg(rows: readonly QuantityRow[]): number {
  return rows.reduce((total, row) => total + row.qtdped, 0);
}

export function sumGroupPerdaTotal(rows: readonly ValueRow[]): number {
  return rows.reduce((total, row) => total + row.vlrfinal, 0);
}

export function formatGroupShareLabel(
  grupoDescricao: string,
  revenueShare: number | null,
): string {
  if (revenueShare == null) {
    return grupoDescricao;
  }

  return `${grupoDescricao} ${formatOverviewNumber(revenueShare)}%`;
}

export function formatGroupVolumePill(volumeKg: number): string {
  return `Volume: ${formatOverviewDecimal(volumeKg)} kg`;
}

export function formatGroupPerdaTotalPill(perdaTotal: number): string {
  return `Perda Total: ${formatOverviewCurrency(perdaTotal)}`;
}

export function formatGroupAnalysisSubtitle(
  kind: "ganhos" | "perdidos",
  grupoDescricao: string,
  revenueShare: number | null,
): string {
  const groupLabel = formatGroupShareLabel(grupoDescricao, revenueShare);
  if (kind === "ganhos") {
    return `Até 5 notas faturadas do grupo selecionado (${groupLabel})`;
  }
  return `Até 5 pedidos perdidos do grupo selecionado (${groupLabel})`;
}

export function truncateMotivoBadge(motivo: string, maxLength = 28): string | null {
  const trimmed = motivo.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed === "Sem justificativa registrada.") {
    return null;
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}
