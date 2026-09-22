import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import type { OverviewCustomerMonthlyEvolutionRow } from "../../types/overviewCustomerMonthlyEvolution.types";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerSectionCardSkeleton } from "./OverviewCustomerSectionCardSkeleton";

const chartConfig = {
  revenue: {
    label: "Faturamento (R$)",
    color: "hsl(var(--primary))",
  },
  volume: {
    label: "Volume",
    color: "hsl(var(--primary) / 0.4)",
  },
} satisfies ChartConfig;

type OverviewCustomerMonthlyEvolutionChartProps = {
  rows: OverviewCustomerMonthlyEvolutionRow[];
  isLoading: boolean;
  isError: boolean;
  variant?: "compact" | "full";
};

export function OverviewCustomerMonthlyEvolutionChart({
  rows,
  isLoading,
  isError,
  variant = "full",
}: OverviewCustomerMonthlyEvolutionChartProps) {
  const title = "Evolução mensal de faturamento e volume";
  const heightClass = variant === "compact" ? "h-[240px]" : "h-[320px]";

  if (isLoading) {
    return (
      <OverviewCustomerSectionCardSkeleton
        title={title}
        skeletonClassName={heightClass}
        loadingLabel="Carregando a evolução mensal deste cliente."
      />
    );
  }

  if (isError) {
    return (
      <OverviewCustomerSectionCard title={title} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage
          message="Não foi possível carregar a evolução mensal deste cliente. Tente novamente."
          tone="destructive"
        />
      </OverviewCustomerSectionCard>
    );
  }

  if (rows.length === 0) {
    return (
      <OverviewCustomerSectionCard title={title} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage message="Não há dados de evolução mensal para este cliente." />
      </OverviewCustomerSectionCard>
    );
  }

  return (
    <OverviewCustomerSectionCard
      title={title}
      description="Desempenho mensal de faturamento e volume comprado."
      className="border-muted"
      contentClassName="pt-0"
    >
      <ChartContainer config={chartConfig} className={cn("aspect-auto w-full", heightClass)}>
        <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
          />
          <YAxis
            yAxisId="volume"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={48}
          />
          <YAxis
            yAxisId="revenue"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={56}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="var(--color-volume)"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ChartContainer>
    </OverviewCustomerSectionCard>
  );
}
