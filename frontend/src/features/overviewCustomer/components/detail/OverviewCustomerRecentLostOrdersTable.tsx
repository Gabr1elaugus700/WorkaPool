import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";
import type { OverviewCustomerRecentLostOrder } from "../../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerTableSkeleton } from "./OverviewCustomerTableSkeleton";

type OverviewCustomerRecentLostOrdersTableProps = {
  rows: OverviewCustomerRecentLostOrder[];
  isLoading: boolean;
  isError: boolean;
};

export function OverviewCustomerRecentLostOrdersTable({
  rows,
  isLoading,
  isError,
}: OverviewCustomerRecentLostOrdersTableProps) {
  if (isLoading) {
    return (
      <OverviewCustomerTableSkeleton loadingLabel="Carregando pedidos perdidos recentes deste cliente." />
    );
  }

  if (isError) {
    return (
      <OverviewCustomerStateMessage
        message="Não foi possível carregar pedidos perdidos recentes. Tente novamente."
        tone="destructive"
      />
    );
  }

  if (rows.length === 0) {
    return (
      <OverviewCustomerStateMessage message="Nenhum pedido perdido recente para este cliente." />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="[&_td]:py-2 [&_th]:py-2">
        <TableCaption className="sr-only">
          Pedidos perdidos recentes com data e representante.
        </TableCaption>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Rep</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`lost-${row.orderNumber}-${row.occurredAt}`}>
              <TableCell className="font-medium tabular-nums">#{row.orderNumber}</TableCell>
              <TableCell className="tabular-nums">{row.occurredAt}</TableCell>
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
