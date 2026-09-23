import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import type {
  OverviewCustomerIdentity,
  OverviewCustomerOrderCounts,
} from "../../types/overviewCustomerDetail.types";
import {
  deriveOverviewCustomerInitials,
  formatOverviewBranchIndicator,
} from "../../utils/overviewCustomerIdentity.utils";
import {
  estimateNextPurchaseDate,
  formatEstimatedDaysUntilNextPurchase,
  formatIsoDateLabel,
} from "@/utils/formatDate";
import {
  formatOverviewCurrency,
  formatOverviewNumber,
} from "../../utils/overviewCustomerFormatters";
import { OverviewCustomerHealthScoreMock } from "./OverviewCustomerHealthScoreMock";

export type OverviewCustomerDetailHeroCommercialSignals = {
  purchaseFrequencyDays: number | null;
  daysSinceLastPurchase: number | null;
};

export type OverviewCustomerDetailHeroBilling = {
  revenueLast30Days: number;
  volumeLast30Days: number;
  revenueLast12Months: number;
  volumeLast12Months: number;
};

type OverviewCustomerDetailHeroProps = {
  customer: OverviewCustomerIdentity;
  commercialSignals: OverviewCustomerDetailHeroCommercialSignals;
  billing: OverviewCustomerDetailHeroBilling;
  orderCounts?: OverviewCustomerOrderCounts | null;
};

type FooterItemProps = {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
};

function BillingColumn({ billing }: { billing: OverviewCustomerDetailHeroBilling }) {
  return (
    <div className="shrink-0 space-y-3 md:text-right">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-background/75">
          Faturamento · últimos 30 dias
        </p>
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-background">
          {formatOverviewCurrency(billing.revenueLast30Days)}
        </p>
        <p className="text-sm text-background/75">
          Volume{" "}
          <span className="font-semibold tabular-nums text-background">
            {formatOverviewNumber(billing.volumeLast30Days)}
          </span>
        </p>
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-wide text-background/75">
          Últimos 12 meses
        </p>
        <p className="text-base font-semibold tabular-nums text-background">
          {formatOverviewCurrency(billing.revenueLast12Months)}
        </p>
        <p className="text-sm text-background/75">
          Volume{" "}
          <span className="font-semibold tabular-nums text-background">
            {formatOverviewNumber(billing.volumeLast12Months)}
          </span>
        </p>
      </div>
    </div>
  );
}

function FooterItem({ label, value, valueClassName }: FooterItemProps) {
  return (
    <div className="space-y-1 px-4 py-3 md:border-r md:border-border/80 md:last:border-r-0">
      <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold tabular-nums", valueClassName)}>{value}</p>
    </div>
  );
}

export function OverviewCustomerDetailHero({
  customer,
  commercialSignals,
  billing,
  orderCounts,
}: OverviewCustomerDetailHeroProps) {
  const initials = deriveOverviewCustomerInitials(customer.tradeName);
  const estimatedNextPurchase = estimateNextPurchaseDate(
    customer.lastInvoicedPurchaseAt,
    commercialSignals.purchaseFrequencyDays,
  );
  const estimatedDaysLabel = formatEstimatedDaysUntilNextPurchase(
    customer.lastInvoicedPurchaseAt,
    commercialSignals.purchaseFrequencyDays,
  );
  const lastPurchaseIsToday = commercialSignals.daysSinceLastPurchase === 0;
  const lastPurchaseLabel = customer.lastInvoicedPurchaseAt
    ? `${formatIsoDateLabel(customer.lastInvoicedPurchaseAt)}${
        lastPurchaseIsToday ? " (Hoje)" : ""
      }`
    : "Não informado";

  return (
    <section className="overflow-hidden rounded-lg border border-border/80 bg-foreground text-background shadow-sm">
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between md:gap-8 md:p-6">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg",
              "bg-[hsl(var(--order-mine))] text-lg font-bold text-background",
            )}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 space-y-2">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                  {customer.tradeName}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-background/20 bg-background/10 text-background hover:bg-background/10"
                >
                  Filial: {formatOverviewBranchIndicator(customer.branchIndicator)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-background/20 bg-background/10 text-background hover:bg-background/10"
                >
                  Cód: #{customer.customerCode}
                </Badge>
              </div>
            </div>
            <div className="space-y-1 text-sm text-background/75">
              <p>
                <span className="text-background/55">CNPJ: </span>
                <span className="font-medium text-background">{customer.document}</span>
                {customer.segment ? (
                  <>
                    <span className="mx-2 text-background/35">·</span>
                    <span className="text-background/55">Segmento: </span>
                    <span className="font-medium text-background">{customer.segment}</span>
                  </>
                ) : null}
              </p>
              <p className="flex flex-wrap items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-background/55" aria-hidden="true" />
                <span>
                  {customer.city}/{customer.state}
                </span>
              </p>
            </div>
          </div>
        </div>
        <BillingColumn billing={billing} />
      </div>
      <OverviewCustomerHealthScoreMock
        daysSinceLastPurchase={commercialSignals.daysSinceLastPurchase}
        purchaseFrequencyDays={commercialSignals.purchaseFrequencyDays}
        orderCounts={orderCounts}
      />
      <div className="grid grid-cols-1 border-t border-border/80 bg-card text-card-foreground sm:grid-cols-2 lg:grid-cols-5">
        <FooterItem
          label="Vendedor responsável"
          value={
            customer.primaryCodRep != null ? `Rep. #${customer.primaryCodRep}` : "Não informado"
          }
        />
        <FooterItem
          label="Data de cadastro"
          value={formatIsoDateLabel(customer.registrationDate)}
        />
        <FooterItem
          label="Primeira compra"
          value={formatIsoDateLabel(customer.firstInvoicedPurchaseAt)}
        />
        <FooterItem
          label="Última compra realizada"
          value={lastPurchaseLabel}
          valueClassName={lastPurchaseIsToday ? "text-[hsl(var(--order-mine))]" : undefined}
        />
        <FooterItem
          label="Próx. compra estimada"
          value={
            estimatedNextPurchase
              ? `${formatIsoDateLabel(estimatedNextPurchase)}${
                  estimatedDaysLabel ? ` (${estimatedDaysLabel})` : ""
                }`
              : "Não informado"
          }
          valueClassName={
            estimatedNextPurchase ? "text-[hsl(var(--order-nostock))]" : undefined
          }
        />
      </div>
    </section>
  );
}
