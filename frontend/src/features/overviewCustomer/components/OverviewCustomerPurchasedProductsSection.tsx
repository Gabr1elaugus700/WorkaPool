import type { OverviewCustomerPurchasedProduct } from "../types/overviewCustomerPurchasedProducts.types";
import { OverviewCustomerDetailProductsPanel } from "./detail/OverviewCustomerDetailProductsPanel";

type Props = {
  rows: OverviewCustomerPurchasedProduct[];
  isLoading: boolean;
  isError: boolean;
};

export function OverviewCustomerPurchasedProductsSection({
  rows,
  isLoading,
  isError,
}: Props) {
  return (
    <OverviewCustomerDetailProductsPanel rows={rows} isLoading={isLoading} isError={isError} />
  );
}
