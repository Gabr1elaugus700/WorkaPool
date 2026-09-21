import React from "react";
import type { OverviewCustomerOrderCounts } from "../../types/overviewCustomerDetail.types";
import { formatOverviewNumber } from "../../utils/overviewCustomerFormatters";
import { resolveOverviewCustomerOrderCounts } from "../../utils/overviewCustomerOrderCounts.utils";

type OverviewCustomerHeroOrderCountsProps = {
  orderCounts: OverviewCustomerOrderCounts | null | undefined;
};

type CountRowProps = {
  label: string;
  sinceJan2024: number;
  last60Days: number;
};

function CountRow({ label, sinceJan2024, last60Days }: CountRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-4 gap-y-0.5">
      <p className="text-[0.65rem] uppercase tracking-wide text-background/60">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-background">
        {formatOverviewNumber(sinceJan2024)}
      </p>
      <p className="text-sm font-semibold tabular-nums text-background">
        {formatOverviewNumber(last60Days)}
      </p>
    </div>
  );
}

export function OverviewCustomerHeroOrderCounts({
  orderCounts,
}: OverviewCustomerHeroOrderCountsProps) {
  const counts = resolveOverviewCustomerOrderCounts(orderCounts);

  return (
    <aside
      className="w-full min-w-0 flex-1 rounded-lg border border-background/15 bg-background/10 p-4 md:max-w-xs"
      aria-label="Quantidade de pedidos"
    >
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4">
        <p className="text-[0.65rem] font-medium uppercase tracking-wide text-background/60">
          Pedidos
        </p>
        <p className="text-[0.65rem] uppercase tracking-wide text-background/55">Desde Jan/2024</p>
        <p className="text-[0.65rem] uppercase tracking-wide text-background/55">Últimos 60 dias</p>
      </div>
      <div className="space-y-2.5">
        <CountRow
          label="Totais"
          sinceJan2024={counts.totalSinceJan2024}
          last60Days={counts.totalLast60Days}
        />
        <CountRow
          label="Faturados"
          sinceJan2024={counts.invoicedSinceJan2024}
          last60Days={counts.invoicedLast60Days}
        />
        <CountRow
          label="Perdidos"
          sinceJan2024={counts.lostSinceJan2024}
          last60Days={counts.lostLast60Days}
        />
      </div>
    </aside>
  );
}
