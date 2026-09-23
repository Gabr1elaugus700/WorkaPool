import { formatIsoDateLabel } from "@/utils/formatDate";
import React from "react";
import type { OverviewCustomerGroupGanho } from "../../types/overviewCustomerGroupAnalise.types";
import {
  formatOverviewCurrency,
  formatOverviewDecimal,
  formatOverviewPercent,
} from "../../utils/overviewCustomerFormatters";

type OverviewCustomerGroupGanhoRowProps = {
  row: OverviewCustomerGroupGanho;
};

export function OverviewCustomerGroupGanhoRow({ row }: OverviewCustomerGroupGanhoRowProps) {
  return (
    <li className="rounded-lg border border-primary/25 bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-semibold tabular-nums text-primary">NF {row.numnfv}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          Data: {formatIsoDateLabel(row.datemi)}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Valor Total</dt>
          <dd className="font-semibold tabular-nums text-foreground">
            {formatOverviewCurrency(row.vlrfinal)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Quantidade</dt>
          <dd className="font-semibold tabular-nums text-foreground">
            {formatOverviewDecimal(row.qtdped)} kg
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-xs text-muted-foreground">Margem</dt>
          <dd className="font-semibold tabular-nums text-primary">
            {formatOverviewPercent(row.margem)}
          </dd>
        </div>
      </dl>

      <div className="mt-3 border-t border-primary/15 pt-2">
        <p className="text-sm font-medium tabular-nums text-foreground">
          Preço unit.: {formatOverviewCurrency(row.preuni)} /kg
        </p>
      </div>
    </li>
  );
}
