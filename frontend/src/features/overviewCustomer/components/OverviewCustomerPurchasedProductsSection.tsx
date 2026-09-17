import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OverviewCustomerPurchasedProduct } from "../types/overviewCustomerPurchasedProducts.types";
import {
  formatOverviewCurrency,
  formatOverviewNumber,
  formatOverviewPercent,
} from "../utils/overviewCustomerFormatters";
import { OverviewCustomerSectionCard } from "./OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "./OverviewCustomerStateMessage";

type Props = {
  rows: OverviewCustomerPurchasedProduct[];
  isLoading: boolean;
  isError: boolean;
};

export function OverviewCustomerPurchasedProductsSection({
  rows,
  isLoading,
  isError,
}: Props) {
  const title = "Produtos comprados";

  if (isLoading) {
    return (
      <OverviewCustomerSectionCard title={title} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage message="Carregando produtos comprados deste cliente." />
      </OverviewCustomerSectionCard>
    );
  }

  if (isError) {
    return (
      <OverviewCustomerSectionCard title={title} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage
          message="Não foi possível carregar os produtos comprados deste cliente."
          tone="destructive"
        />
      </OverviewCustomerSectionCard>
    );
  }

  if (rows.length === 0) {
    return (
      <OverviewCustomerSectionCard title={title} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage message="Nenhum produto comprado disponível para este cliente." />
      </OverviewCustomerSectionCard>
    );
  }

  return (
    <OverviewCustomerSectionCard
      title={title}
      description="Produtos com maior impacto no faturamento e na recorrência de compra."
      className="border-muted"
      contentClassName="space-y-3"
    >
      <Table className="[&_td]:py-2 [&_th]:py-2">
        <TableCaption className="sr-only">
          Produtos comprados com quantidade, volume, faturamento, margem e frequência.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead className="text-right">Qtd.</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Faturamento</TableHead>
            <TableHead className="text-right">Preço médio</TableHead>
            <TableHead className="text-right">Margem</TableHead>
            <TableHead className="text-right">Frequência (dias)</TableHead>
            <TableHead className="text-right">Share de faturamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.productCode}-${row.productName}`}>
              <TableCell>
                <div className="font-medium">{row.productName}</div>
                <div className="text-xs text-muted-foreground">{row.productCode}</div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatOverviewNumber(row.quantity)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatOverviewNumber(row.volume)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatOverviewCurrency(row.revenue)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatOverviewCurrency(row.averagePrice)}
              </TableCell>
              <TableCell className="text-right">
                {formatOverviewPercent(row.marginPercentWeightedByRevenue)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.frequencyDays == null ? "Não informado" : formatOverviewNumber(row.frequencyDays)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {`${formatOverviewNumber(row.revenueShare)}%`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </OverviewCustomerSectionCard>
  );
}
