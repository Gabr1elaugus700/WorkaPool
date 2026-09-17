import { Card, CardContent } from "@/components/ui/card";
import React from "react";

type OverviewCustomerKpiTileProps = {
  label: string;
  value: string;
  subLabel?: string;
};

export function OverviewCustomerKpiTile({
  label,
  value,
  subLabel,
}: OverviewCustomerKpiTileProps) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
        {subLabel ? <p className="text-xs text-muted-foreground">{subLabel}</p> : null}
      </CardContent>
    </Card>
  );
}
