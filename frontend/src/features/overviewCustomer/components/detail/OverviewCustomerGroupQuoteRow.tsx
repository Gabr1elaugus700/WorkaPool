import type { ReactNode } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatIsoDateLabel } from "@/utils/formatDate";
import type { OverviewCustomerGroupQuoteRow } from "../../types/overviewCustomerGroupQuotes.types";
import {
  formatOverviewCurrency,
  formatOverviewDecimal,
  formatOverviewPercent,
} from "../../utils/overviewCustomerFormatters";
import {
  formatOverviewCustomerGroupQuoteSituation,
  getOverviewCustomerGroupQuoteRowTone,
  resolveOverviewCustomerGroupQuoteSellerName,
  type OverviewCustomerGroupQuoteRowTone,
} from "../../utils/overviewCustomerGroupQuoteRow.utils";

type OverviewCustomerGroupQuoteRowProps = {
  row: OverviewCustomerGroupQuoteRow;
};

const ROW_TONE_CLASS: Record<OverviewCustomerGroupQuoteRowTone, string> = {
  ganha: "bg-primary/10 hover:bg-primary/15",
  perdida: "bg-destructive/10 hover:bg-destructive/15",
  outro: "bg-muted/40 text-muted-foreground hover:bg-muted/60",
};

const ORDER_TONE_CLASS: Record<OverviewCustomerGroupQuoteRowTone, string> = {
  ganha: "text-primary",
  perdida: "text-destructive",
  outro: "text-foreground",
};

function formatNullableCurrency(value: number | null): string {
  return value == null ? "Não informado" : formatOverviewCurrency(value);
}

function formatFreightDetail(row: OverviewCustomerGroupQuoteRow): string | null {
  const parts: string[] = [];
  if (row.carrierCode != null) {
    parts.push(`Transp. ${row.carrierCode}`);
  }
  if (row.freightIncluded != null) {
    parts.push(row.freightIncluded ? "Frete incluso" : "Frete não incluso");
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function OverviewCustomerGroupQuoteRowView({
  row,
}: OverviewCustomerGroupQuoteRowProps) {
  const tone = getOverviewCustomerGroupQuoteRowTone(row);
  const isWon = row.outcome === "ganha";

  return (
    <TableRow data-tone={tone} className={ROW_TONE_CLASS[tone]}>
      <Cell subtitle={formatOverviewCustomerGroupQuoteSituation(row.outcome)}>
        <span className={cn("font-semibold", ORDER_TONE_CLASS[tone])}>
          {row.orderNumber}
        </span>
      </Cell>
      <Cell>{formatIsoDateLabel(row.issuedAt)}</Cell>
      <Cell subtitle={row.otherCustomer ? row.customerTradeName : null}>
        <span className="font-medium text-foreground">
          {resolveOverviewCustomerGroupQuoteSellerName(row)}
        </span>
      </Cell>
      <Cell numeric>{`${formatOverviewDecimal(row.quantity)} kg`}</Cell>
      <Cell numeric>{`${formatOverviewCurrency(row.unitPrice)}/kg`}</Cell>
      <Cell numeric emphasize>{formatOverviewCurrency(row.lineAmount)}</Cell>
      <Cell numeric emphasize>{formatOverviewPercent(row.marginPercent)}</Cell>
      <Cell numeric>{formatNullableCurrency(row.costPrice)}</Cell>
      <Cell numeric>{formatNullableCurrency(row.ipiAmount)}</Cell>
      <Cell numeric>{formatNullableCurrency(row.icmsAmount)}</Cell>
      <Cell numeric>{formatOverviewPercent(row.icmsPercent)}</Cell>
      <Cell numeric subtitle={formatFreightDetail(row)}>
        {formatNullableCurrency(row.freightAmount)}
      </Cell>
      <Cell subtitle={isWon ? null : row.lossReason}>
        <span
          className={cn(
            "font-semibold",
            isWon ? "text-primary" : "text-destructive",
          )}
        >
          {isWon ? "Ganha" : "Perdida"}
        </span>
      </Cell>
    </TableRow>
  );
}

function Cell({
  children,
  subtitle = null,
  numeric = false,
  emphasize = false,
}: {
  children: ReactNode;
  subtitle?: string | null;
  numeric?: boolean;
  emphasize?: boolean;
}) {
  return (
    <TableCell
      className={cn(
        "whitespace-nowrap px-3 py-2 text-xs",
        numeric && "text-right tabular-nums",
        emphasize && "font-semibold text-foreground",
      )}
    >
      {children}
      {subtitle ? (
        <span className="block text-[11px] font-normal text-muted-foreground">
          {subtitle}
        </span>
      ) : null}
    </TableCell>
  );
}
