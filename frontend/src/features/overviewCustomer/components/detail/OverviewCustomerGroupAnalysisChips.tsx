import { cn } from "@/lib/utils";
import React from "react";
import type { OverviewCustomerAbcGroup } from "../../types/overviewCustomerAbcGroups.types";

type OverviewCustomerGroupAnalysisChipsProps = {
  grupos: OverviewCustomerAbcGroup[];
  selectedGrupoCodigo: string;
  onSelect: (grupoCodigo: string) => void;
};

export function OverviewCustomerGroupAnalysisChips({
  grupos,
  selectedGrupoCodigo,
  onSelect,
}: OverviewCustomerGroupAnalysisChipsProps) {
  return (
    <div
      role="tablist"
      aria-label="Grupos ABC para análise comercial"
      className="flex flex-wrap gap-2"
    >
      {grupos.map((grupo) => {
        const isSelected = selectedGrupoCodigo === grupo.grupoCodigo;

        return (
          <button
            key={grupo.grupoCodigo}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
            onClick={() => onSelect(grupo.grupoCodigo)}
          >
            {grupo.grupoDescricao}
          </button>
        );
      })}
    </div>
  );
}
