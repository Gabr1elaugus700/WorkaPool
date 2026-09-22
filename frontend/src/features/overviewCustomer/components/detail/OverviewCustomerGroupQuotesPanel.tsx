import React, { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useOverviewCustomerGroupQuotes } from "../../hooks/useOverviewCustomerGroupQuotes";
import { isOverviewCustomerForbiddenMessage } from "../../utils/overviewCustomerForbidden.utils";
import { isOverviewCustomerGroupQuotesRevealRole } from "../../utils/overviewCustomerGroupQuoteBadge.utils";
import { OverviewCustomerAccessDeniedState } from "../OverviewCustomerAccessDeniedState";
import { OverviewCustomerGroupQuoteColumn } from "./OverviewCustomerGroupQuoteColumn";

export type OverviewCustomerGroupQuotesPanelProps = {
  customerCode: number;
  grupoCodigo: string | null;
  enabled?: boolean;
};

export function OverviewCustomerGroupQuotesPanel({
  customerCode,
  grupoCodigo,
  enabled = true,
}: OverviewCustomerGroupQuotesPanelProps) {
  const { user } = useAuth();
  const revealAvailable = isOverviewCustomerGroupQuotesRevealRole(user?.role);
  const [selectedProductCode, setSelectedProductCode] = useState<string | null>(
    null,
  );
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    setSelectedProductCode(null);
    setReveal(false);
  }, [customerCode, grupoCodigo]);

  const query = useOverviewCustomerGroupQuotes(customerCode, grupoCodigo, {
    productCode: selectedProductCode,
    reveal: revealAvailable ? reveal : false,
    enabled: enabled && grupoCodigo != null,
  });

  useEffect(() => {
    const apiSelected = query.data?.selectedProductCode ?? null;
    if (apiSelected != null && selectedProductCode == null) {
      setSelectedProductCode(apiSelected);
    }
  }, [query.data?.selectedProductCode, selectedProductCode]);

  const errorMessage =
    query.error instanceof Error ? query.error.message : "";

  if (query.isError && isOverviewCustomerForbiddenMessage(errorMessage)) {
    return <OverviewCustomerAccessDeniedState />;
  }

  const products = query.data?.products ?? [];
  const rows = query.data?.rows ?? [];
  const resolvedSelected =
    selectedProductCode ?? query.data?.selectedProductCode ?? null;
  const selectedProduct =
    products.find((product) => product.productCode === resolvedSelected) ??
    null;
  const isInitialLoading =
    query.isLoading && query.data == null && !query.isPlaceholderData;

  return (
    <OverviewCustomerGroupQuoteColumn
      products={products}
      selectedProductCode={resolvedSelected}
      selectedProductName={selectedProduct?.productName ?? null}
      rows={rows}
      isLoading={isInitialLoading}
      isError={query.isError && query.data == null}
      revealAvailable={revealAvailable}
      reveal={reveal}
      onProductChange={setSelectedProductCode}
      onRevealChange={setReveal}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
