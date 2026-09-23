import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";
import type {
  OverviewCustomerInvoicedOrderLine,
  OverviewCustomerLostOrderRow,
  OverviewCustomerRecentCommercialMotionSeed,
} from "./materializeOverviewCustomerRecentCommercialMotion";

type SeniorInvoicedLine = {
  customerCode: number;
  orderNumber: number;
  invoiceDate: string | null;
  codRep: number | null;
  branchCode: number | null;
  productCode: string | number | null;
  productName: string | null;
  quantityInvoiced: number;
  quantityReturned: number;
  unitPrice: number;
  lineMarginPercent: number | null;
};

type SeniorLostRow = {
  customerCode: number;
  orderNumber: number;
  issueDate: string | null;
  sitped: number | null;
  codRep: number | null;
};

const DEFAULT_CUTOFF_DATE = "2024-01-01";

export class OverviewCustomerRecentCommercialMotionSeniorQuery {
  async fetchSeed(): Promise<OverviewCustomerRecentCommercialMotionSeed> {
    await sqlPoolConnect;

    const invoicedRequest = sqlPool.request();
    invoicedRequest.input("cutoffDate", DEFAULT_CUTOFF_DATE);
    const invoicedResult = await invoicedRequest.query<SeniorInvoicedLine>(`
      SELECT
        nfv.codcli AS customerCode,
        ipd.numped AS orderNumber,
        CONVERT(VARCHAR(10), nfv.datemi, 23) AS invoiceDate,
        ped.codven AS codRep,
        ipv.codfil AS branchCode,
        CAST(ipv.codpro AS VARCHAR(32)) AS productCode,
        COALESCE(NULLIF(ipv.cplipv, ''), CAST(ipv.codpro AS VARCHAR(32))) AS productName,
        ipv.qtdfat AS quantityInvoiced,
        ipv.qtddev AS quantityReturned,
        ipv.preuni AS unitPrice,
        ipd.usu_mgmluc AS lineMarginPercent
      FROM e140ipv ipv
      INNER JOIN e140nfv nfv
        ON nfv.numnfv = ipv.numnfv
        AND nfv.codemp = ipv.codemp
        AND nfv.codfil = ipv.codfil
        AND nfv.codsnf = ipv.codsnf
      INNER JOIN e120ipd ipd
        ON ipd.codemp = ipv.codemp
        AND ipd.codfil = ipv.codfil
        AND ipd.numped = ipv.numped
        AND ipd.seqipd = ipv.seqipd
      INNER JOIN e120ped ped
        ON ped.codemp = ipd.codemp
        AND ped.codfil = ipd.codfil
        AND ped.numped = ipd.numped
      INNER JOIN e001tns tns
        ON tns.codemp = ipv.codemp
        AND tns.codtns = ipv.tnspro
      WHERE
        ped.numped > 0
        AND nfv.sitnfv = 2
        AND tns.venfat = 'S'
        AND ipv.qtdfat > ipv.qtddev
        AND nfv.datemi >= @cutoffDate
        AND nfv.codcli IS NOT NULL
    `);

    const lostRequest = sqlPool.request();
    lostRequest.input("cutoffDate", DEFAULT_CUTOFF_DATE);
    const lostResult = await lostRequest.query<SeniorLostRow>(`
      SELECT
        ped.codcli AS customerCode,
        ped.numped AS orderNumber,
        CONVERT(VARCHAR(10), ped.datemi, 23) AS issueDate,
        ped.sitped AS sitped,
        ped.codven AS codRep
      FROM e120ped ped
      WHERE
        ped.datemi >= @cutoffDate
        AND ped.numped > 0
        AND ped.codcli IS NOT NULL
    `);

    return {
      invoicedLines: this.mapInvoicedLines(invoicedResult.recordset),
      lostOrders: this.mapLostOrders(lostResult.recordset),
    };
  }

  private mapInvoicedLines(records: SeniorInvoicedLine[]): OverviewCustomerInvoicedOrderLine[] {
    return records
      .filter(
        (record) =>
          Number.isInteger(record.customerCode) &&
          record.customerCode > 0 &&
          Number.isInteger(record.orderNumber) &&
          record.orderNumber > 0 &&
          typeof record.invoiceDate === "string" &&
          record.invoiceDate.length > 0 &&
          record.productCode != null &&
          String(record.productCode).length > 0,
      )
      .map((record) => {
        const productCode = String(record.productCode);
        const productName =
          typeof record.productName === "string" && record.productName.length > 0
            ? record.productName
            : productCode;
        return {
          customerCode: record.customerCode,
          orderNumber: record.orderNumber,
          invoiceDate: record.invoiceDate as string,
          codRep: record.codRep,
          branchCode: record.branchCode,
          productCode,
          productName,
          quantityInvoiced: Number(record.quantityInvoiced),
          quantityReturned: Number(record.quantityReturned),
          unitPrice: Number(record.unitPrice),
          lineMarginPercent:
            record.lineMarginPercent === null ? null : Number(record.lineMarginPercent),
        };
      });
  }

  private mapLostOrders(records: SeniorLostRow[]): OverviewCustomerLostOrderRow[] {
    return records
      .filter(
        (record) =>
          Number.isInteger(record.customerCode) &&
          record.customerCode > 0 &&
          Number.isInteger(record.orderNumber) &&
          record.orderNumber > 0 &&
          typeof record.issueDate === "string" &&
          record.issueDate.length > 0 &&
          Number.isInteger(record.sitped),
      )
      .map((record) => ({
        customerCode: record.customerCode,
        orderNumber: record.orderNumber,
        issueDate: record.issueDate as string,
        sitped: record.sitped as number,
        codRep: record.codRep,
      }));
  }
}
