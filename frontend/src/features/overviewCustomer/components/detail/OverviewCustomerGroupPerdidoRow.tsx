import { formatIsoDateLabel } from "@/utils/formatDate";
import type { OverviewCustomerGroupPerdido } from "../../types/overviewCustomerGroupAnalise.types";
import {
  formatOverviewCurrency,
  formatOverviewDecimal,
  formatOverviewPercent,
} from "../../utils/overviewCustomerFormatters";
import { truncateMotivoBadge } from "../../utils/overviewCustomerGroupAnaliseHeader.utils";

type OverviewCustomerGroupPerdidoRowProps = {
  row: OverviewCustomerGroupPerdido;
};

export function OverviewCustomerGroupPerdidoRow({
  row,
}: OverviewCustomerGroupPerdidoRowProps) {
  const motivoBadge = truncateMotivoBadge(row.motivo);

  return (
    <li className="rounded-lg border border-destructive/25 bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="text-sm font-semibold tabular-nums text-destructive">
            Pedido {row.numped}
          </p>
          {motivoBadge ? (
            <span className="inline-flex max-w-full truncate rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              {motivoBadge}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          Data: {formatIsoDateLabel(row.datemi)}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Valor Ofertado</dt>
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
          <dt className="text-xs text-muted-foreground">Preço Ofertado</dt>
          <dd className="font-semibold tabular-nums text-destructive">
            {formatOverviewCurrency(row.preuni)} /kg
          </dd>
        </div>
      </dl>

      <div className="mt-3 rounded-md bg-destructive/5 px-3 py-2">
        <p className="text-xs font-semibold text-destructive">Motivo Registrado:</p>
        <p className="mt-1 text-sm text-foreground">{row.motivo}</p>
      </div>

      <div className="mt-3 border-t border-destructive/15 pt-2">
        <p className="text-sm text-muted-foreground tabular-nums">
          Margem projetada: {formatOverviewPercent(row.margem)}
        </p>
      </div>
    </li>
  );
}
