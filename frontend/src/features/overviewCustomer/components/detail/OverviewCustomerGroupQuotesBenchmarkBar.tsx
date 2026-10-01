import { cn } from "@/lib/utils";
import {
  formatOverviewCurrency,
  formatOverviewDecimal,
} from "../../utils/overviewCustomerFormatters";
import type { OverviewCustomerGroupQuoteBenchmark } from "../../utils/overviewCustomerGroupQuotesBenchmark.utils";

export const OVERVIEW_CUSTOMER_GROUP_QUOTES_BENCHMARK_EMPTY = "—";

function formatPricePerKg(value: number | null): string {
  return value == null
    ? OVERVIEW_CUSTOMER_GROUP_QUOTES_BENCHMARK_EMPTY
    : `${formatOverviewCurrency(value)}/kg`;
}

function formatSpreadAmount(value: number | null): string {
  if (value == null) {
    return OVERVIEW_CUSTOMER_GROUP_QUOTES_BENCHMARK_EMPTY;
  }
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatOverviewCurrency(Math.abs(value))}/kg`;
}

function formatSpreadPercent(value: number | null): string | null {
  if (value == null) {
    return null;
  }
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatOverviewDecimal(Math.abs(value))}%`;
}

export function OverviewCustomerGroupQuotesBenchmarkBar({
  benchmark,
}: {
  benchmark: OverviewCustomerGroupQuoteBenchmark;
}) {
  return (
    <dl
      className="grid gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60 sm:grid-cols-3"
      aria-label="Benchmark de preço das cotações filtradas"
    >
      <Metric
        label="Preço médio ganho"
        value={formatPricePerKg(benchmark.wonAveragePrice)}
        valueClassName="text-primary"
      />
      <Metric
        label="Preço médio perdido"
        value={formatPricePerKg(benchmark.lostAveragePrice)}
        valueClassName="text-destructive"
      />
      <Metric
        label="Spread (perdido − ganho)"
        value={formatSpreadAmount(benchmark.spreadAmount)}
        detail={formatSpreadPercent(benchmark.spreadPercent)}
        valueClassName="text-foreground"
      />
    </dl>
  );
}

function Metric({
  label,
  value,
  detail = null,
  valueClassName,
}: {
  label: string;
  value: string;
  detail?: string | null;
  valueClassName: string;
}) {
  return (
    <div className="bg-card px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("text-sm font-semibold tabular-nums", valueClassName)}>
        {value}
        {detail ? (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {detail}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
