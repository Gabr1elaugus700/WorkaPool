import { Button } from "@/components/ui/button";
import { formatIsoDateLabel } from "@/utils/formatDate";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { OverviewCustomerRecentInvoicedOrder } from "../../types/overviewCustomerRecentCommercialMotion.types";
import {
  formatOverviewCurrency,
  formatOverviewDecimal,
  formatOverviewPercent,
} from "../../utils/overviewCustomerFormatters";
import { OverviewCustomerRecentInvoicedOrderItemRow } from "./OverviewCustomerRecentInvoicedOrderItemRow";

type OverviewCustomerRecentInvoicedOrderRowProps = {
  order: OverviewCustomerRecentInvoicedOrder;
};

export function OverviewCustomerRecentInvoicedOrderRow({
  order,
}: OverviewCustomerRecentInvoicedOrderRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const itemCount = order.items.length;
  const itemsPanelId = `recent-invoiced-items-${order.orderNumber}`;

  return (
    <li className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsOpen((current) => !current)}
        className="h-auto w-full items-stretch gap-3 rounded-none px-4 py-3 text-left hover:bg-muted/40"
        aria-expanded={isOpen}
        aria-controls={itemsPanelId}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-sm font-bold tabular-nums text-primary">#{order.orderNumber}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {formatIsoDateLabel(order.occurredAt)}
              </p>
              {order.branchCode != null ? (
                <p className="text-xs tabular-nums text-muted-foreground">
                  Filial {order.branchCode}
                </p>
              ) : null}
            </div>
            {order.codRep != null ? (
              <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium tabular-nums text-primary">
                Rep. {order.codRep}
              </span>
            ) : null}
          </div>

          <dl className="grid grid-cols-3 gap-4 sm:text-right">
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Valor
              </dt>
              <dd className="text-sm font-semibold tabular-nums text-foreground">
                {formatOverviewCurrency(order.revenue)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Volume
              </dt>
              <dd className="text-sm font-semibold tabular-nums text-foreground">
                {formatOverviewDecimal(order.volume)} kg
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Margem
              </dt>
              <dd className="text-sm font-semibold tabular-nums text-primary">
                {formatOverviewPercent(order.marginPercent)}
              </dd>
            </div>
          </dl>
        </div>

        <span className="flex shrink-0 items-center gap-1 self-center text-xs text-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "itens"}
          {isOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </span>
      </Button>

      {isOpen ? (
        <div id={itemsPanelId} className="border-t border-border bg-muted/20 px-4 py-3">
          {order.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item neste pedido.</p>
          ) : (
            <ul className="space-y-2">
              {order.items.map((item) => (
                <OverviewCustomerRecentInvoicedOrderItemRow
                  key={`${order.orderNumber}-${item.productCode}`}
                  item={item}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </li>
  );
}
