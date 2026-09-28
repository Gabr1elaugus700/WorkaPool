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
  OverviewCustomerGroupQuoteSellerOption,
  OverviewCustomerGroupQuoteStatusCounts,
  OverviewCustomerGroupQuoteStatusFilter,
} from "../../utils/overviewCustomerGroupQuotesFilter.utils";

export const OVERVIEW_CUSTOMER_GROUP_QUOTES_SEARCH_PLACEHOLDER =
  "Buscar cotação #...";
export const OVERVIEW_CUSTOMER_GROUP_QUOTES_ALL_SELLERS = "Todos os Vendedores";

const ALL_SELLERS_VALUE = "all";

const STATUS_LABELS: Record<OverviewCustomerGroupQuoteStatusFilter, string> = {
  todas: "Todos",
  ganhas: "Ganhas",
  perdidas: "Perdidas",
  outros: "Outros vendedores",
};

const STATUS_ORDER: OverviewCustomerGroupQuoteStatusFilter[] = [
  "todas",
  "ganhas",
  "perdidas",
  "outros",
];

function isStatusFilter(
  value: string,
): value is OverviewCustomerGroupQuoteStatusFilter {
  return (STATUS_ORDER as string[]).includes(value);
}

export type OverviewCustomerGroupQuoteFiltersToolbarProps = {
  search: string;
  codRep: number | null;
  status: OverviewCustomerGroupQuoteStatusFilter;
  sellerOptions: OverviewCustomerGroupQuoteSellerOption[];
  counts: OverviewCustomerGroupQuoteStatusCounts;
  outrosEnabled: boolean;
  onSearchChange: (search: string) => void;
  onSellerChange: (codRep: number | null) => void;
  onStatusChange: (status: OverviewCustomerGroupQuoteStatusFilter) => void;
};

export function OverviewCustomerGroupQuoteFiltersToolbar({
  search,
  codRep,
  status,
  sellerOptions,
  counts,
  outrosEnabled,
  onSearchChange,
  onSellerChange,
  onStatusChange,
}: OverviewCustomerGroupQuoteFiltersToolbarProps) {
  const selectedSeller =
    sellerOptions.find((option) => option.codRep === codRep) ?? null;

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
          value={search}
          placeholder={OVERVIEW_CUSTOMER_GROUP_QUOTES_SEARCH_PLACEHOLDER}
          aria-label="Buscar cotação pelo número do pedido"
          className="h-9 pl-8"
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
        />
      </div>

      <Select
        value={selectedSeller ? String(selectedSeller.codRep) : ALL_SELLERS_VALUE}
        onValueChange={(value) => {
          onSellerChange(value === ALL_SELLERS_VALUE ? null : Number(value));
        }}
      >
        <SelectTrigger
          className="h-9 w-full sm:w-52"
          aria-label="Filtrar por vendedor"
        >
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
        value={status}
        onValueChange={(value) => {
          if (isStatusFilter(value)) {
            onStatusChange(value);
          }
        }}
      >
        <SelectTrigger
          className="h-9 w-full sm:w-36"
          aria-label="Filtrar por status"
        >
          <SelectValue>{`Status: ${STATUS_LABELS[status]}`}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {STATUS_ORDER.map((option) => (
            <SelectItem
              key={option}
              value={option}
              disabled={option === "outros" && !outrosEnabled}
            >
              {`${STATUS_LABELS[option]} (${counts[option]})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
