import React from "react";
import type { OverviewCustomerListRow } from "../types/overviewCustomerList.types";

type OverviewCustomerPortfolioListProps = {
  items: OverviewCustomerListRow[];
  isLoading: boolean;
};

export function OverviewCustomerPortfolioList({
  items,
  isLoading,
}: OverviewCustomerPortfolioListProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando carteira…</p>;
  }

  if (items.length === 0) {
    return (
      <section className="rounded-md border p-5">
        <h2 className="text-lg font-semibold">Nenhum cliente encontrado na carteira</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajuste os filtros de busca ou aguarde a próxima sincronização.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-x-auto rounded-md border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Codigo</th>
            <th className="px-3 py-2 text-left font-medium">Nome</th>
            <th className="px-3 py-2 text-left font-medium">Cidade/UF</th>
            <th className="px-3 py-2 text-left font-medium">Filial</th>
            <th className="px-3 py-2 text-left font-medium">Ultima compra</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.customerCode} className="border-t">
              <td className="px-3 py-2">{item.customerCode}</td>
              <td className="px-3 py-2">
                <a
                  href={`/overview/customers/${item.customerCode}`}
                  className="text-primary underline"
                >
                  {item.tradeName}
                </a>
              </td>
              <td className="px-3 py-2">
                {item.city}/{item.state}
              </td>
              <td className="px-3 py-2">{item.branchIndicator}</td>
              <td className="px-3 py-2">{item.lastPurchaseAt ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
