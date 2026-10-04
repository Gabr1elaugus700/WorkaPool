import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { OverviewCustomerGroupQuoteRow } from "../../types/overviewCustomerGroupQuotes.types";
import { OverviewCustomerGroupQuoteRowView } from "./OverviewCustomerGroupQuoteRow";

const COLUMNS = [
  { label: "Pedido", numeric: false },
  { label: "Data", numeric: false },
  { label: "Vendedor", numeric: false },
  { label: "Volume", numeric: true },
  { label: "Preço unit.", numeric: true },
  { label: "Valor", numeric: true },
  { label: "Margem %", numeric: true },
  { label: "Custo", numeric: true },
  { label: "IPI", numeric: true },
  { label: "ICMS", numeric: true },
  { label: "ICMS %", numeric: true },
  { label: "Frete", numeric: true },
  { label: "Status & motivo", numeric: false },
] as const;

type OverviewCustomerGroupQuotesTableProps = {
  rows: OverviewCustomerGroupQuoteRow[];
};

export function OverviewCustomerGroupQuotesTable({
  rows,
}: OverviewCustomerGroupQuotesTableProps) {
  return (
    <div className="rounded-lg border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((column) => (
              <TableHead
                key={column.label}
                className={cn(
                  "h-9 whitespace-nowrap px-3 text-[10px] uppercase tracking-wider",
                  column.numeric && "text-right",
                )}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <OverviewCustomerGroupQuoteRowView
              key={`${row.orderNumber}-${row.productCode}-${row.issuedAt}-${index}`}
              row={row}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
