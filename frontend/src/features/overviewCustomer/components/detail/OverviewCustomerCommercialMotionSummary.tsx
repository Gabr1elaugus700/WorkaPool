import React from "react";
import { formatOverviewNumber } from "../../utils/overviewCustomerFormatters";

type OverviewCustomerCommercialMotionSummaryProps = {
  lastInvoicedPurchaseAt: string | null;
  lastLostOrderAt: string | null;
  lastCommercialMovementAt: string | null;
  invoicedCountLast12Months: number | null;
  lostCountLast12Months: number | null;
};

export function OverviewCustomerCommercialMotionSummary({
  lastInvoicedPurchaseAt,
  lastLostOrderAt,
  lastCommercialMovementAt,
  invoicedCountLast12Months,
  lostCountLast12Months,
}: OverviewCustomerCommercialMotionSummaryProps) {
  return (
    <>
      <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Última compra (NF faturada)</dt>
          <dd className="font-medium">{lastInvoicedPurchaseAt ?? "Não informado"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Último pedido perdido</dt>
          <dd className="font-medium">{lastLostOrderAt ?? "Não informado"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Última movimentação comercial</dt>
          <dd className="font-medium">{lastCommercialMovementAt ?? "Não informado"}</dd>
        </div>
      </dl>

      {(invoicedCountLast12Months != null || lostCountLast12Months != null) && (
        <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Faturados (12 meses)</dt>
            <dd className="font-medium">
              {invoicedCountLast12Months != null
                ? formatOverviewNumber(invoicedCountLast12Months)
                : "Não informado"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Perdidos (12 meses)</dt>
            <dd className="font-medium">
              {lostCountLast12Months != null
                ? formatOverviewNumber(lostCountLast12Months)
                : "Não informado"}
            </dd>
          </div>
        </dl>
      )}
    </>
  );
}
