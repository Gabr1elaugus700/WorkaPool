import { formatIsoDateLabel } from "@/utils/formatDate";
import type { OverviewCustomerGroupPerdido } from "../../types/overviewCustomerGroupAnalise.types";
import {
  formatOverviewCurrency,
  formatOverviewDecimal,
  formatOverviewPercent,
} from "../../utils/overviewCustomerFormatters";

type OverviewCustomerGroupPerdidoRowProps = {
  row: OverviewCustomerGroupPerdido;
};

export function OverviewCustomerGroupPerdidoRow({
  row,
}: OverviewCustomerGroupPerdidoRowProps) {
  return (
    <li className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
      <p className="text-sm font-medium tabular-nums text-destructive">Pedido {row.numped}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Data</dt>
          <dd className="font-medium tabular-nums">{formatIsoDateLabel(row.datemi)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Valor</dt>
          <dd className="font-medium tabular-nums">{formatOverviewCurrency(row.vlrfinal)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Quantidade</dt>
          <dd className="font-medium tabular-nums">{formatOverviewDecimal(row.qtdped)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Preço unit.</dt>
          <dd className="font-medium tabular-nums">{formatOverviewCurrency(row.preuni)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Margem</dt>
          <dd className="font-medium tabular-nums">{formatOverviewPercent(row.margem)}</dd>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <dt className="text-muted-foreground">Motivo</dt>
          <dd className="font-medium">{row.motivo}</dd>
        </div>
      </dl>
    </li>
  );
}
