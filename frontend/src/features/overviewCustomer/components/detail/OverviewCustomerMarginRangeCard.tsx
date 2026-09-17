import { Progress } from "@/components/ui/progress";
import React from "react";
import { formatOverviewPercent } from "../../utils/overviewCustomerFormatters";
import { computeMarginRange } from "../../utils/overviewCustomerAnalytics.utils";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";

type OverviewCustomerMarginRangeCardProps = {
  margins: Array<number | null>;
  isLoading: boolean;
  isError: boolean;
};

function computeAveragePosition(min: number, max: number, avg: number): number {
  if (max === min) {
    return 100;
  }
  return ((avg - min) / (max - min)) * 100;
}

export function OverviewCustomerMarginRangeCard({
  margins,
  isLoading,
  isError,
}: OverviewCustomerMarginRangeCardProps) {
  const title = "Faixa histórica de margem";

  if (isLoading) {
    return (
      <OverviewCustomerSectionCard title={title} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage message="Carregando faixa de margem deste cliente." />
      </OverviewCustomerSectionCard>
    );
  }

  if (isError) {
    return (
      <OverviewCustomerSectionCard title={title} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage
          message="Não foi possível calcular a faixa de margem."
          tone="destructive"
        />
      </OverviewCustomerSectionCard>
    );
  }

  const range = computeMarginRange(margins);
  if (range.min == null || range.max == null || range.avg == null) {
    return (
      <OverviewCustomerSectionCard title={title} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage message="Margem indisponível para este cliente." />
      </OverviewCustomerSectionCard>
    );
  }

  const averagePosition = computeAveragePosition(range.min, range.max, range.avg);

  return (
    <OverviewCustomerSectionCard
      title={title}
      description="Mínima, média e máxima ponderada por produto."
      className="border-muted"
      contentClassName="space-y-4"
    >
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Mínima</p>
          <p className="font-semibold tabular-nums">{formatOverviewPercent(range.min)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Média</p>
          <p className="font-semibold tabular-nums">{formatOverviewPercent(range.avg)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Máxima</p>
          <p className="font-semibold tabular-nums">{formatOverviewPercent(range.max)}</p>
        </div>
      </div>
      <Progress value={averagePosition} className="h-2" />
    </OverviewCustomerSectionCard>
  );
}
