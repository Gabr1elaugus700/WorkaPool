import React from "react";
import type {
  OverviewCustomerRecentInvoicedOrder,
  OverviewCustomerRecentLostOrder,
} from "../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerDetailMotionPanel } from "./detail/OverviewCustomerDetailMotionPanel";

type Props = {
  customerCode: number;
  lastInvoicedPurchaseAt: string | null;
  lastLostOrderAt: string | null;
  lastCommercialMovementAt: string | null;
  invoicedCountLast12Months: number | null;
  lostCountLast12Months: number | null;
  recentInvoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  recentLostOrders: OverviewCustomerRecentLostOrder[];
  isLoadingInvoiced: boolean;
  isLoadingLost: boolean;
  isErrorInvoiced: boolean;
  isErrorLost: boolean;
};

export function OverviewCustomerRecentCommercialMotionSection(props: Props) {
  return <OverviewCustomerDetailMotionPanel {...props} />;
}
