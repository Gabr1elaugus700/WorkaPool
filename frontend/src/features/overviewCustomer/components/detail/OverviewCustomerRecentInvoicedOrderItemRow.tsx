import React from "react";
import type { OverviewCustomerRecentInvoicedOrderItem } from "../../types/overviewCustomerRecentCommercialMotion.types";
import {
  formatOverviewCurrency,
  formatOverviewDecimal,
  formatOverviewPercent,
} from "../../utils/overviewCustomerFormatters";

type OverviewCustomerRecentInvoicedOrderItemRowProps = {
  item: OverviewCustomerRecentInvoicedOrderItem;
};

export function OverviewCustomerRecentInvoicedOrderItemRow({
  item,
}: OverviewCustomerRecentInvoicedOrderItemRowProps) {
  return (
    <li className="rounded-md bg-muted/40 px-3 py-2.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="inline-flex rounded-md bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
              {item.productCode}
            </span>
            <p className="text-sm font-semibold tracking-wide text-foreground">
              {item.productName}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Preço unitário:{" "}
            <span className="tabular-nums text-foreground">
              {formatOverviewCurrency(item.unitPrice)}/kg
            </span>
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-3 text-right sm:shrink-0">
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Qtd / Volume
            </dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {formatOverviewDecimal(item.quantity)} / {formatOverviewDecimal(item.volume)}{" "}
              kg
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Total
            </dt>
            <dd className="text-xs font-semibold tabular-nums text-foreground">
              {formatOverviewCurrency(item.revenue)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Margem
            </dt>
            <dd className="text-xs font-semibold tabular-nums text-primary">
              {formatOverviewPercent(item.marginPercent)}
            </dd>
          </div>
        </dl>
      </div>
    </li>
  );
}
