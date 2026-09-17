import { Badge } from "@/components/ui/badge";
import React from "react";
import { cn } from "@/lib/utils";
import type { OverviewCustomerIdentity } from "../../types/overviewCustomerDetail.types";
import {
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../utils/overviewCustomerFormatters";
import {
  deriveOverviewCustomerInitials,
  formatOverviewBranchIndicator,
} from "../../utils/overviewCustomerIdentity.utils";

type OverviewCustomerDetailHeroProps = {
  customer: OverviewCustomerIdentity;
  commercialSignals: {
    marginPercentWeightedByRevenue: number | null;
    purchaseFrequencyDays: number | null;
    daysSinceLastPurchase: number | null;
  };
};

type SignalItemProps = {
  label: string;
  value: string;
};

function SignalItem({ label, value }: SignalItemProps) {
  return (
    <div className="rounded-md bg-primary-foreground/10 px-3 py-2">
      <p className="text-[0.65rem] uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function formatNullableDays(value: number | null): string {
  if (value == null) {
    return "Não informado";
  }
  return formatOverviewNumber(value);
}

export function OverviewCustomerDetailHero({
  customer,
  commercialSignals,
}: OverviewCustomerDetailHeroProps) {
  const initials = deriveOverviewCustomerInitials(customer.tradeName);

  return (
    <section className="overflow-hidden rounded-lg bg-primary text-primary-foreground shadow-sm">
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between md:p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
              "bg-primary-foreground/15 text-lg font-bold",
            )}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                {customer.tradeName}
              </h2>
              <p className="text-sm opacity-90">
                #{customer.customerCode} · {customer.city}/{customer.state}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground"
              >
                {formatOverviewBranchIndicator(customer.branchIndicator)}
              </Badge>
              {customer.segment ? (
                <Badge
                  variant="outline"
                  className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground"
                >
                  {customer.segment}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 md:min-w-[280px]">
          <SignalItem
            label="Margem"
            value={formatOverviewPercent(commercialSignals.marginPercentWeightedByRevenue)}
          />
          <SignalItem
            label="Frequência"
            value={formatNullableDays(commercialSignals.purchaseFrequencyDays)}
          />
          <SignalItem
            label="Recência"
            value={formatNullableDays(commercialSignals.daysSinceLastPurchase)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 bg-primary-foreground/10 px-4 py-3 text-xs md:grid-cols-2 lg:grid-cols-4">
        <p>
          <span className="opacity-75">Documento: </span>
          <span className="font-medium">{customer.document}</span>
        </p>
        <p>
          <span className="opacity-75">Representante: </span>
          <span className="font-medium">{customer.primaryCodRep ?? "Não informado"}</span>
        </p>
        <p>
          <span className="opacity-75">Primeira compra: </span>
          <span className="font-medium">
            {customer.firstInvoicedPurchaseAt ?? "Não informado"}
          </span>
        </p>
        <p>
          <span className="opacity-75">Última compra: </span>
          <span className="font-medium">
            {customer.lastInvoicedPurchaseAt ?? "Não informado"}
          </span>
        </p>
      </div>
    </section>
  );
}
