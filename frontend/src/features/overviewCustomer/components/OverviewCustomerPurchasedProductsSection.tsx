import React from "react";
import type { OverviewCustomerPurchasedProduct } from "../types/overviewCustomerPurchasedProducts.types";

type Props = {
  rows: OverviewCustomerPurchasedProduct[];
  isLoading: boolean;
  isError: boolean;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function OverviewCustomerPurchasedProductsSection({
  rows,
  isLoading,
  isError,
}: Props) {
  if (isLoading) {
    return (
      <section className="rounded-md border p-4" aria-busy="true">
        <h2 className="text-lg font-semibold">Produtos comprados</h2>
        <p className="mt-2 text-sm text-muted-foreground">Carregando produtos comprados…</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-md border p-4">
        <h2 className="text-lg font-semibold">Produtos comprados</h2>
        <p className="mt-2 text-sm text-destructive">
          Não foi possível carregar os produtos comprados.
        </p>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-md border p-4">
        <h2 className="text-lg font-semibold">Produtos comprados</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhum produto comprado disponível.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md border p-4">
      <h2 className="text-lg font-semibold">Produtos comprados</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1">Produto</th>
              <th className="px-2 py-1">Qtd</th>
              <th className="px-2 py-1">Volume</th>
              <th className="px-2 py-1">Faturamento</th>
              <th className="px-2 py-1">Preço médio</th>
              <th className="px-2 py-1">Margem</th>
              <th className="px-2 py-1">Frequência (dias)</th>
              <th className="px-2 py-1">Share de faturamento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.productCode}-${row.productName}`} className="border-t">
                <td className="px-2 py-1">
                  <div className="font-medium">{row.productName}</div>
                  <div className="text-xs text-muted-foreground">{row.productCode}</div>
                </td>
                <td className="px-2 py-1">{formatNumber(row.quantity)}</td>
                <td className="px-2 py-1">{formatNumber(row.volume)}</td>
                <td className="px-2 py-1">{formatCurrency(row.revenue)}</td>
                <td className="px-2 py-1">{formatCurrency(row.averagePrice)}</td>
                <td className="px-2 py-1">
                  {row.marginPercentWeightedByRevenue == null
                    ? "-"
                    : `${formatNumber(row.marginPercentWeightedByRevenue)}%`}
                </td>
                <td className="px-2 py-1">
                  {row.frequencyDays == null ? "-" : formatNumber(row.frequencyDays)}
                </td>
                <td className="px-2 py-1">{formatNumber(row.revenueShare)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
