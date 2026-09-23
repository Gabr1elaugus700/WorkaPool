import type { OverviewCustomerRecentInvoicedOrder } from "../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerDetailMotionPanel } from "./detail/OverviewCustomerDetailMotionPanel";

type Props = {
  lastInvoicedPurchaseAt: string | null;
  lastLostOrderAt: string | null;
  lastCommercialMovementAt: string | null;
  invoicedCountLast12Months: number | null;
  lostCountLast12Months: number | null;
  recentInvoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  isLoadingInvoiced: boolean;
  isErrorInvoiced: boolean;
};

export function OverviewCustomerRecentCommercialMotionSection(props: Props) {
  return <OverviewCustomerDetailMotionPanel {...props} />;
}
