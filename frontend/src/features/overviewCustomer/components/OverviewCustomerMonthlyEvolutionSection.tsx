import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { OverviewCustomerMonthlyEvolutionRow } from "../types/overviewCustomerMonthlyEvolution.types";
import {
  formatOverviewCurrency,
  formatOverviewDecimal,
  formatOverviewPercent,
} from "../utils/overviewCustomerFormatters";
import { OverviewCustomerSectionCard } from "./OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "./OverviewCustomerStateMessage";

type OverviewCustomerMonthlyEvolutionSectionProps = {
  rows: OverviewCustomerMonthlyEvolutionRow[];
  isLoading: boolean;
  isError: boolean;
  isOpen: boolean;
  onToggle: () => void;
  showToggle?: boolean;
};

export function OverviewCustomerMonthlyEvolutionSection({
  rows,
  isLoading,
  isError,
  isOpen,
  onToggle,
  showToggle = true,
}: OverviewCustomerMonthlyEvolutionSectionProps) {
  const title = "Evolução mensal do cliente";

  return (
    <OverviewCustomerSectionCard
      title={title}
      description="Desempenho mensal de faturamento, volume, pedidos e margem."
      className="border-muted"
      contentClassName="space-y-3"
    >
      {showToggle ? (
        <Button
          type="button"
          variant="outline"
          onClick={onToggle}
          className="w-full justify-between"
          aria-expanded={isOpen}
        >
          {isOpen ? "Ocultar evolução mensal" : "Carregar evolução mensal"}
          {isOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </Button>
      ) : null}

      {!isOpen ? (
        <OverviewCustomerStateMessage
          message="Abra esta seção para carregar a evolução mensal do cliente."
          className="py-1"
        />
      ) : null}

      {isOpen && isLoading ? (
        <OverviewCustomerStateMessage
          message="Carregando a evolução mensal deste cliente."
          className="py-1"
        />
      ) : null}

      {isOpen && isError ? (
        <OverviewCustomerStateMessage
          message="Não foi possível carregar a evolução mensal deste cliente. Tente novamente."
          tone="destructive"
          className="py-1"
        />
      ) : null}

      {isOpen && !isLoading && !isError && rows.length === 0 ? (
        <OverviewCustomerStateMessage
          message="Não há dados de evolução mensal para este cliente."
          className="py-1"
        />
      ) : null}

      {isOpen && !isLoading && !isError && rows.length > 0 ? (
        <Table className="[&_td]:py-2 [&_th]:py-2">
          <TableCaption className="sr-only">
            Evolução mensal com faturamento, volume, pedidos e margem do cliente.
          </TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Mês de referência</TableHead>
              <TableHead className="text-right">Faturamento (R$)</TableHead>
              <TableHead className="text-right">Volume total</TableHead>
              <TableHead className="text-right">Quantidade de pedidos</TableHead>
              <TableHead className="text-right">Margem (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="tabular-nums">{row.month}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatOverviewCurrency(row.revenue)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatOverviewDecimal(row.volume)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.orderCount}</TableCell>
                <TableCell className="text-right">
                  {formatOverviewPercent(row.marginPercent)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </OverviewCustomerSectionCard>
  );
}
