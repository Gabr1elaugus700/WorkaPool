import React from "react";
import { OrderLossCustomerLink } from "./OrderLossCustomerLink";

type OrderLossCustomerFilterBannerProps = {
  customerCode: number;
};

export function OrderLossCustomerFilterBanner({
  customerCode,
}: OrderLossCustomerFilterBannerProps) {
  return (
    <p className="mt-4 rounded-md border border-muted bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
      Filtrando pedidos perdidos do cliente{" "}
      <OrderLossCustomerLink
        customerCode={customerCode}
        name={`#${customerCode}`}
        className="font-medium text-foreground"
      />
      .
    </p>
  );
}
