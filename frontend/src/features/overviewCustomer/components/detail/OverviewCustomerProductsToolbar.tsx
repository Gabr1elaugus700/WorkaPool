import { Input } from "@/components/ui/input";
import { formatOverviewNumber } from "../../utils/overviewCustomerFormatters";

type OverviewCustomerProductsToolbarProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  productCount: number;
};

export function OverviewCustomerProductsToolbar({
  searchTerm,
  onSearchTermChange,
  productCount,
}: OverviewCustomerProductsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {formatOverviewNumber(productCount)} produto{productCount === 1 ? "" : "s"} no mix
      </p>
      <Input
        type="search"
        placeholder="Buscar por nome ou código"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        className="max-w-sm"
        aria-label="Buscar produtos por nome ou código"
      />
    </div>
  );
}
