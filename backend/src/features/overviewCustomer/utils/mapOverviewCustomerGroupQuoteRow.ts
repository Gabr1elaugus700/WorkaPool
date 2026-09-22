import type { OverviewCustomerGroupQuoteSeniorLine } from "../sync/OverviewCustomerGroupQuotesSeniorQuery";

export type OverviewCustomerGroupQuoteOutcome = "ganha" | "perdida";

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

export type MapOverviewCustomerGroupQuoteRowExtras = {
  sellerName: string | null;
  lossReason: string | null;
  openCustomerCode: number;
};

export function mapOverviewCustomerGroupQuoteRow(
  line: OverviewCustomerGroupQuoteSeniorLine,
  extras: MapOverviewCustomerGroupQuoteRowExtras,
): OverviewCustomerGroupQuoteRow {
  const otherCustomer = line.codcli !== extras.openCustomerCode;

  return {
    orderNumber: line.numped,
    issuedAt: line.datemi,
    outcome: line.sitped === 9 ? "ganha" : "perdida",
    situation: line.sitped,
    productCode: line.codpro,
    productName: line.productName,
    quantity: line.qtdped,
    unitPrice: line.preuni,
    lineAmount: line.vlrfinal,
    marginPercent: line.margem,
    ipiAmount: line.ipi,
    icmsAmount: line.icm,
    icmsPercent: line.icmsPercent,
    costPrice: line.preCusto,
    freightAmount: line.frete,
    carrierCode: line.transportadora,
    freightIncluded: line.freteIncluso,
    codRep: line.codRep,
    sellerName: extras.sellerName,
    lossReason: extras.lossReason,
    otherCustomer,
    customerTradeName: otherCustomer ? line.apecli : null,
    repShortName: line.aperep,
  };
}
