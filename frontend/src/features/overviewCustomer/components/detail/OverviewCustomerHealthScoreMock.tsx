import { Badge } from "@/components/ui/badge";
import {
  formatDaysSinceLastPurchase,
  formatPurchaseFrequencyDays,
} from "@/utils/formatDate";
import type { OverviewCustomerOrderCounts } from "../../types/overviewCustomerDetail.types";
import { formatOverviewNumber } from "../../utils/overviewCustomerFormatters";
import { resolveOverviewCustomerOrderCounts } from "../../utils/overviewCustomerOrderCounts.utils";

export type OverviewCustomerHealthScoreMockProps = {
  daysSinceLastPurchase: number | null;
  purchaseFrequencyDays: number | null;
  orderCounts?: OverviewCustomerOrderCounts | null;
};

type SignalCellProps = {
  label: string;
  value: string;
};

type CountPair = {
  label: string;
  value: number;
};

function SignalCell({ label, value }: SignalCellProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-background/75">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-background">{value}</p>
    </div>
  );
}

function CountPairItem({ label, value }: CountPair) {
  return (
    <p className="flex items-baseline gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-background/75">{label}</span>
      <span className="text-lg font-semibold tabular-nums text-background">
        {formatOverviewNumber(value)}
      </span>
    </p>
  );
}

function PeriodGroup({ title, pairs }: { title: string; pairs: CountPair[] }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-background/75">{title}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {pairs.map((pair) => (
          <CountPairItem key={pair.label} label={pair.label} value={pair.value} />
        ))}
      </div>
    </div>
  );
}

export function OverviewCustomerHealthScoreMock({
  daysSinceLastPurchase,
  purchaseFrequencyDays,
  orderCounts,
}: OverviewCustomerHealthScoreMockProps) {
  const counts = resolveOverviewCustomerOrderCounts(orderCounts);

  return (
    <aside
      className="border-t border-background/15 px-5 py-4 md:px-6"
      aria-label="Score de Saúde 360° (demonstração)"
    >
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-background/75">
            Score de Saúde 360°
          </p>
          <p className="text-lg font-semibold tabular-nums text-background">
            92
            <span className="text-sm font-normal text-background/75"> / 100</span>
          </p>
          <Badge
            variant="outline"
            className="border-background/25 bg-background/10 text-background hover:bg-background/10"
          >
            Saudável
          </Badge>
          <p className="text-xs text-background/75">Indicador em desenvolvimento</p>
        </div>
        <SignalCell
          label="Dias desde última compra"
          value={formatDaysSinceLastPurchase(daysSinceLastPurchase)}
        />
        <SignalCell
          label="Frequência média"
          value={formatPurchaseFrequencyDays(purchaseFrequencyDays)}
        />
        <PeriodGroup
          title="Desde Jan/2024"
          pairs={[
            { label: "Faturados", value: counts.invoicedSinceJan2024 },
            { label: "Perdidos", value: counts.lostSinceJan2024 },
          ]}
        />
        <PeriodGroup
          title="Últimos 60 dias"
          pairs={[
            { label: "Faturados", value: counts.invoicedLast60Days },
            { label: "Perdidos", value: counts.lostLast60Days },
          ]}
        />
      </div>
    </aside>
  );
}
