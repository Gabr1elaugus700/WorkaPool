import React, { useState } from "react";
import type { OverviewCustomerPurchasedProduct } from "../../types/overviewCustomerPurchasedProducts.types";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerProductsToolbar } from "./OverviewCustomerProductsToolbar";
import { OverviewCustomerPurchasedProductsTable } from "./OverviewCustomerPurchasedProductsTable";

type OverviewCustomerDetailProductsPanelProps = {
  rows: OverviewCustomerPurchasedProduct[];
  isLoading: boolean;
  isError: boolean;
};

export function OverviewCustomerDetailProductsPanel({
  rows,
  isLoading,
  isError,
}: OverviewCustomerDetailProductsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const title = isLoading || isError || rows.length === 0
    ? "Produtos comprados"
    : `Produtos comprados (${rows.length})`;

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
      contentClassName="space-y-4"
    >
      <OverviewCustomerProductsToolbar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        productCount={rows.length}
      />
      <OverviewCustomerPurchasedProductsTable rows={rows} searchTerm={searchTerm} />
    </OverviewCustomerSectionCard>
  );
}
