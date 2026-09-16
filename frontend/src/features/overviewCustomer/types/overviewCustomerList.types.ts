import type { BranchIndicator } from "./overviewCustomerDetail.types";

export type OverviewCustomerListRow = {
  customerCode: number;
  tradeName: string;
  city: string;
  state: string;
  primaryCodRep: number | null;
  branchIndicator: BranchIndicator;
  lastPurchaseAt: string | null;
  orderCountLast12Months?: number;
  revenueLast12Months?: number;
  daysSinceLastPurchase: number | null;
};

export type OverviewCustomerListResponse = {
  items: OverviewCustomerListRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
  };
  sort: {
    field: "orderCountLast12Months" | "lastPurchase";
    direction: "desc";
  };
};
