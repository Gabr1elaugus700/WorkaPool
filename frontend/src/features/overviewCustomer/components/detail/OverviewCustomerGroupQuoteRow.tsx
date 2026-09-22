import { formatIsoDateLabel } from "@/utils/formatDate";
import type { OverviewCustomerGroupQuoteRow } from "../../types/overviewCustomerGroupQuotes.types";
import {
  formatOverviewCurrency,
  formatOverviewDecimal,
  formatOverviewPercent,
} from "../../utils/overviewCustomerFormatters";
import { formatOverviewCustomerGroupQuoteSellerBadge } from "../../utils/overviewCustomerGroupQuoteBadge.utils";

type OverviewCustomerGroupQuoteRowProps = {
  row: OverviewCustomerGroupQuoteRow;
};

function formatNullableCurrency(value: number | null): string {
  if (value == null) {
    return "Não informado";
  }
  return formatOverviewCurrency(value);
}

function formatFreightIncluded(value: boolean | null): string {
  if (value == null) {
    return "Não informado";
  }
  return value ? "Sim" : "Não";
}

export function OverviewCustomerGroupQuoteRowView({
  row,
}: OverviewCustomerGroupQuoteRowProps) {
  const isOther = row.otherCustomer;
  const isWon = row.outcome === "ganha";

  const shellClass = isOther
    ? "rounded-lg border border-border/60 bg-muted/40 p-3 opacity-80"
    : isWon
      ? "rounded-lg border border-primary/40 bg-primary/15 p-3"
      : "rounded-lg border border-destructive/40 bg-destructive/15 p-3";

  const orderClass = isOther
    ? "text-sm font-semibold tabular-nums text-foreground"
    : isWon
      ? "text-sm font-semibold tabular-nums text-primary"
      : "text-sm font-semibold tabular-nums text-destructive";

  return (
    <li className={shellClass}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className={orderClass}>Pedido {row.orderNumber}</p>
            {isOther ? (
              <>
                <span
                  className={
                    isWon
                      ? "inline-flex rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground"
                      : "inline-flex rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground"
                  }
                >
                  {isWon ? "Ganha" : "Perdida"}
                </span>
                <span className="inline-flex rounded-full bg-sky-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {formatOverviewCustomerGroupQuoteSellerBadge({
                    codRep: row.codRep,
                    sellerName: row.sellerName,
                    repShortName: row.repShortName,
                  })}
                </span>
              </>
            ) : null}
          </div>
          {isOther && row.customerTradeName ? (
            <p className="text-xs font-medium text-muted-foreground">
              {row.customerTradeName}
            </p>
          ) : null}
          {!isWon && row.lossReason ? (
            <p className="text-xs text-destructive">{row.lossReason}</p>
          ) : null}
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">
          Emissão: {formatIsoDateLabel(row.issuedAt)}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Quantidade" value={`${formatOverviewDecimal(row.quantity)} kg`} />
        <Metric label="Preço" value={`${formatOverviewCurrency(row.unitPrice)}/kg`} />
        <Metric label="Valor" value={formatOverviewCurrency(row.lineAmount)} emphasize />
        <Metric label="Margem" value={formatOverviewPercent(row.marginPercent)} emphasize />
        <Metric label="IPI" value={formatNullableCurrency(row.ipiAmount)} />
        <Metric label="ICMS" value={formatNullableCurrency(row.icmsAmount)} />
        <Metric label="ICMS %" value={formatOverviewPercent(row.icmsPercent)} />
        <Metric label="Custo" value={formatNullableCurrency(row.costPrice)} />
        <Metric label="Frete" value={formatNullableCurrency(row.freightAmount)} />
        <Metric
          label="Transportadora"
          value={
            row.carrierCode == null ? "Não informado" : String(row.carrierCode)
          }
        />
        <Metric
          label="Frete incluso"
          value={formatFreightIncluded(row.freightIncluded)}
        />
      </dl>
    </li>
  );
}

function Metric({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={
          emphasize
            ? "text-xs font-semibold tabular-nums text-foreground"
            : "text-xs font-medium tabular-nums text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}
