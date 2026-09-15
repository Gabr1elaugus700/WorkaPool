export type BranchIndicator = "MGA" | "CTB" | "BOTH";

export type OverviewCustomerIdentity = {
  customerCode: number;
  tradeName: string;
  document: string;
  city: string;
  state: string;
  segment: string | null;
  registrationDate: string | null;
  primaryCodRep: number | null;
  firstInvoicedPurchaseAt: string | null;
  lastInvoicedPurchaseAt: string | null;
  branchIndicator: BranchIndicator;
};

export type OverviewCustomerIdentitySnapshot = {
  customers: Record<string, OverviewCustomerIdentity>;
};
