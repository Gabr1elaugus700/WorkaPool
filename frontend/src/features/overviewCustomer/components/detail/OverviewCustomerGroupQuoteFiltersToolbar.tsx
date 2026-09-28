import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  OverviewCustomerGroupQuoteFilters,
  OverviewCustomerGroupQuoteSellerOption,
  OverviewCustomerGroupQuoteStatusCounts,
  OverviewCustomerGroupQuoteStatusFilter,
} from "../../utils/overviewCustomerGroupQuotesFilter.utils";

export const OVERVIEW_CUSTOMER_GROUP_QUOTES_SEARCH_PLACEHOLDER =
  "Buscar cotação #...";
export const OVERVIEW_CUSTOMER_GROUP_QUOTES_ALL_SELLERS = "Todos os Vendedores";

const ALL_SELLERS_VALUE = "all";

const STATUS_OPTIONS: { value: OverviewCustomerGroupQuoteStatusFilter; label: string }[] = [
  { value: "todas", label: "Todos" },
  { value: "ganhas", label: "Ganhas" },
  { value: "perdidas", label: "Perdidas" },
  { value: "outros", label: "Outros vendedores" },
];

export type OverviewCustomerGroupQuoteFiltersToolbarProps = {
  filters: OverviewCustomerGroupQuoteFilters;
  sellerOptions: OverviewCustomerGroupQuoteSellerOption[];
  counts: OverviewCustomerGroupQuoteStatusCounts;
  outrosEnabled: boolean;
  onFiltersChange: (patch: Partial<OverviewCustomerGroupQuoteFilters>) => void;
};

export function OverviewCustomerGroupQuoteFiltersToolbar({
  filters,
  sellerOptions,
  counts,
  outrosEnabled,
  onFiltersChange,
}: OverviewCustomerGroupQuoteFiltersToolbarProps) {
  const selectedSeller =
    sellerOptions.find((option) => option.codRep === filters.codRep) ?? null;
  const statusLabel =
    STATUS_OPTIONS.find((option) => option.value === filters.status)?.label ?? "";

  return (
    <div
      className="flex flex-wrap items-center gap-2 sm:justify-end"
      role="search"
      aria-label="Filtros das cotações"
    >
      <div className="relative w-full sm:w-52">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={filters.search}
          placeholder={OVERVIEW_CUSTOMER_GROUP_QUOTES_SEARCH_PLACEHOLDER}
          aria-label="Buscar cotação pelo número do pedido"
          className="h-9 pl-8"
          onChange={(event) => {
            onFiltersChange({ search: event.target.value });
          }}
        />
      </div>

      <Select
        value={selectedSeller ? String(selectedSeller.codRep) : ALL_SELLERS_VALUE}
        onValueChange={(value) => {
          onFiltersChange({ codRep: value === ALL_SELLERS_VALUE ? null : Number(value) });
        }}
      >
        <SelectTrigger className="h-9 w-full sm:w-52" aria-label="Filtrar por vendedor">
          <SelectValue>
            {selectedSeller?.label ?? OVERVIEW_CUSTOMER_GROUP_QUOTES_ALL_SELLERS}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SELLERS_VALUE}>
            {OVERVIEW_CUSTOMER_GROUP_QUOTES_ALL_SELLERS}
          </SelectItem>
          {sellerOptions.map((option) => (
            <SelectItem key={option.codRep} value={String(option.codRep)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) => {
          const option = STATUS_OPTIONS.find((item) => item.value === value);
          if (option) {
            onFiltersChange({ status: option.value });
          }
        }}
      >
        <SelectTrigger className="h-9 w-full sm:w-36" aria-label="Filtrar por status">
          <SelectValue>{`Status: ${statusLabel}`}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.value === "outros" && !outrosEnabled}
            >
              {`${option.label} (${counts[option.value]})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
