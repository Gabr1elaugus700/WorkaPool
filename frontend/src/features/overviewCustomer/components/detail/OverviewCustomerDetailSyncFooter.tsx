import React from "react";

type OverviewCustomerDetailSyncFooterProps = {
  lastSuccessfulSyncAt: string | null;
};

export function OverviewCustomerDetailSyncFooter({
  lastSuccessfulSyncAt,
}: OverviewCustomerDetailSyncFooterProps) {
  return (
    <p className="px-1 text-xs text-muted-foreground">
      Última sincronização com sucesso: {lastSuccessfulSyncAt ?? "Não informado"}
    </p>
  );
}
