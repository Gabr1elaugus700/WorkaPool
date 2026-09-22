import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OverviewCustomerPurchasedProduct } from "../../types/overviewCustomerPurchasedProducts.types";
import {
  formatOverviewCurrency,
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../utils/overviewCustomerFormatters";
import { filterPurchasedProductsBySearchTerm } from "../../utils/overviewCustomerPurchasedProducts.utils";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";

type OverviewCustomerPurchasedProductsTableProps = {
  rows: OverviewCustomerPurchasedProduct[];
  searchTerm: string;
};

export function OverviewCustomerPurchasedProductsTable({
  rows,
  searchTerm,
}: OverviewCustomerPurchasedProductsTableProps) {
  const filteredRows = filterPurchasedProductsBySearchTerm(rows, searchTerm);

  if (filteredRows.length === 0) {
    return (
      <OverviewCustomerStateMessage
        message={
          searchTerm.trim().length > 0
            ? "Nenhum produto corresponde à busca."
            : "Nenhum produto comprado disponível para este cliente."
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="[&_td]:py-2 [&_th]:py-2">
        <TableCaption className="sr-only">
          Produtos comprados com quantidade, volume, faturamento, margem e participação no mix.
        </TableCaption>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead className="text-right">Qtd.</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Faturamento</TableHead>
            <TableHead className="text-right">Preço médio</TableHead>
            <TableHead className="text-right">Margem</TableHead>
            <TableHead className="text-right">Última compra</TableHead>
            <TableHead className="text-right">Mix</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.map((row) => (
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
              <TableCell className="text-right tabular-nums">{row.lastPurchaseAt}</TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end gap-1.5">
                  <span className="tabular-nums text-sm">
                    {formatOverviewNumber(row.revenueShare)}%
                  </span>
                  <Progress value={row.revenueShare} className="h-1.5 w-20" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
