import { Badge } from "@/components/ui/badge";
import React from "react";
import { formatOverviewPercent } from "../../utils/overviewCustomerFormatters";
import {
  formatDaysSinceLastPurchase,
  formatPurchaseFrequencyDays,
} from "@/utils/formatDate";

export type OverviewCustomerHealthScoreMockProps = {
  daysSinceLastPurchase: number | null;
  purchaseFrequencyDays: number | null;
  maxInvoicedOrderMarginPercent: number | null;
  minInvoicedOrderMarginPercent: number | null;
};

type SignalCellProps = {
  label: string;
  value: string;
};

function SignalCell({ label, value }: SignalCellProps) {
  return (
    <div className="space-y-0.5">
      <p className="text-[0.65rem] uppercase tracking-wide text-background/60">{label}</p>
      <p className="text-sm font-medium tabular-nums text-background">{value}</p>
    </div>
  );
}

export function OverviewCustomerHealthScoreMock({
  daysSinceLastPurchase,
  purchaseFrequencyDays,
  maxInvoicedOrderMarginPercent,
  minInvoicedOrderMarginPercent,
}: OverviewCustomerHealthScoreMockProps) {
  return (
    <aside
      className="w-full rounded-lg border border-background/15 bg-background/10 p-4 md:max-w-md"
      aria-label="Score de Saúde 360° (demonstração)"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="space-y-2 sm:min-w-[120px]">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-background/60">
            Score de Saúde 360°
          </p>
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-background">
            92
            <span className="text-base font-normal text-background/60"> / 100</span>
          </p>
          <Badge
            variant="outline"
            className="border-background/25 bg-background/10 text-background hover:bg-background/10"
          >
            Saudável
          </Badge>
          <p className="text-[0.65rem] text-background/50">Indicador em desenvolvimento</p>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3">
          <SignalCell
            label="Dias desde última compra"
            value={formatDaysSinceLastPurchase(daysSinceLastPurchase)}
          />
          <SignalCell
            label="Frequência média"
            value={formatPurchaseFrequencyDays(purchaseFrequencyDays)}
          />
          <SignalCell
            label="Maior margem (pedido ganho)"
            value={formatOverviewPercent(maxInvoicedOrderMarginPercent)}
          />
          <SignalCell
            label="Menor margem vendida"
            value={formatOverviewPercent(minInvoicedOrderMarginPercent)}
          />
        </div>
      </div>
    </aside>
  );
}
