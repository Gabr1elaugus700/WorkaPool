export type OverviewCustomerGroupQuoteOutcome = "ganha" | "perdida";

export type OverviewCustomerGroupQuoteProductOption = {
  productCode: string;
  productName: string | null;
};

export type OverviewCustomerGroupQuoteRow = {
  orderNumber: number;
  issuedAt: string;
  outcome: OverviewCustomerGroupQuoteOutcome;
  situation: number;
  productCode: string;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  marginPercent: number | null;
  ipiAmount: number | null;
  icmsAmount: number | null;
  icmsPercent: number | null;
  costPrice: number | null;
  freightAmount: number | null;
  carrierCode: number | null;
  freightIncluded: boolean | null;
  codRep: number;
  sellerName: string | null;
  lossReason: string | null;
  otherCustomer: boolean;
  customerTradeName: string | null;
  repShortName: string | null;
};

export type OverviewCustomerGroupQuotesResponse = {
  customerCode: number;
  grupoCodigo: string;
  products: OverviewCustomerGroupQuoteProductOption[];
  selectedProductCode: string | null;
  rows: OverviewCustomerGroupQuoteRow[];
};

export type OverviewCustomerGroupQuotesQuery = {
  productCode?: string;
  reveal?: boolean;
};
