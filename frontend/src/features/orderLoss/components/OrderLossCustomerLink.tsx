import React from "react";
import { Link } from "react-router-dom";
import { buildOverviewCustomerDetailHref } from "@/features/overviewCustomer/utils/overviewCustomerOrderLoss.utils";
import { cn } from "@/lib/utils";

type OrderLossCustomerLinkProps = {
  customerCode?: number;
  name: string;
  className?: string;
};

function isValidCustomerCode(value: number | undefined): value is number {
  return value != null && Number.isInteger(value) && value > 0;
}

export function OrderLossCustomerLink({
  customerCode,
  name,
  className,
}: OrderLossCustomerLinkProps) {
  if (!isValidCustomerCode(customerCode)) {
    return <span className={className}>{name}</span>;
  }

  return (
    <Link
      to={buildOverviewCustomerDetailHref(customerCode)}
      className={cn(
        "text-inherit hover:text-primary hover:underline underline-offset-2 transition-colors",
        className,
      )}
    >
      {name}
    </Link>
  );
}
