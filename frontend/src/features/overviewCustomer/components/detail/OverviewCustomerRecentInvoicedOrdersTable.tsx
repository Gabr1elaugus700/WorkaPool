import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OverviewCustomerRecentInvoicedOrder } from "../../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerTableSkeleton } from "./OverviewCustomerTableSkeleton";

type OverviewCustomerRecentInvoicedOrdersTableProps = {
  rows: OverviewCustomerRecentInvoicedOrder[];
  isLoading: boolean;
  isError: boolean;
};

export function OverviewCustomerRecentInvoicedOrdersTable({
  rows,
  isLoading,
  isError,
}: OverviewCustomerRecentInvoicedOrdersTableProps) {
  if (isLoading) {
    return (
      <OverviewCustomerTableSkeleton loadingLabel="Carregando pedidos faturados recentes deste cliente." />
    );
  }

  if (isError) {
    return (
      <OverviewCustomerStateMessage
        message="Não foi possível carregar pedidos faturados recentes. Tente novamente."
        tone="destructive"
      />
    );
  }

  if (rows.length === 0) {
    return (
      <OverviewCustomerStateMessage message="Nenhum pedido faturado recente para este cliente." />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="[&_td]:py-2 [&_th]:py-2">
        <TableCaption className="sr-only">
          Pedidos faturados recentes com data, filial e representante.
        </TableCaption>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Filial</TableHead>
            <TableHead className="text-right">Rep</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`invoiced-${row.orderNumber}-${row.occurredAt}`}>
              <TableCell className="font-medium tabular-nums">#{row.orderNumber}</TableCell>
              <TableCell className="tabular-nums">{row.occurredAt}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.branchCode ?? "Não informado"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.codRep ?? "Não informado"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
