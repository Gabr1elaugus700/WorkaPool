import React from "react";
import type { OverviewCustomerMonthlyEvolutionRow } from "../types/overviewCustomerMonthlyEvolution.types";

type OverviewCustomerMonthlyEvolutionSectionProps = {
  rows: OverviewCustomerMonthlyEvolutionRow[];
  isLoading: boolean;
  isError: boolean;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function OverviewCustomerMonthlyEvolutionSection({
  rows,
  isLoading,
  isError,
}: OverviewCustomerMonthlyEvolutionSectionProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando evolução mensal…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar a evolução mensal.
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem evolução mensal disponível para este cliente.
      </p>
    );
  }

  return (
    <section className="space-y-3 rounded-md border p-4">
      <h2 className="text-lg font-semibold">Evolução mensal</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Mês</th>
              <th className="px-3 py-2 text-left font-medium">Faturamento</th>
              <th className="px-3 py-2 text-left font-medium">Volume</th>
              <th className="px-3 py-2 text-left font-medium">Pedidos</th>
              <th className="px-3 py-2 text-left font-medium">Margem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month} className="border-t">
                <td className="px-3 py-2">{row.month}</td>
                <td className="px-3 py-2">{currencyFormatter.format(row.revenue)}</td>
                <td className="px-3 py-2">{decimalFormatter.format(row.volume)}</td>
                <td className="px-3 py-2">{row.orderCount}</td>
                <td className="px-3 py-2">
                  {row.marginPercent == null ? "-" : `${decimalFormatter.format(row.marginPercent)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
