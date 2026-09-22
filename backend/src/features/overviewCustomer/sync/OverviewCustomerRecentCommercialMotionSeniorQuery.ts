import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";
import type {
  OverviewCustomerInvoicedOrderRow,
  OverviewCustomerLostOrderRow,
  OverviewCustomerRecentCommercialMotionSeed,
} from "./materializeOverviewCustomerRecentCommercialMotion";

type SeniorInvoicedRow = {
  customerCode: number;
  orderNumber: number;
  invoiceDate: string | null;
  codRep: number | null;
  branchCode: number | null;
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
    const invoicedResult = await invoicedRequest.query<SeniorInvoicedRow>(`
      SELECT
        nfv.codcli AS customerCode,
        ipd.numped AS orderNumber,
        CONVERT(VARCHAR(10), nfv.datemi, 23) AS invoiceDate,
        ped.codven AS codRep,
        ipv.codfil AS branchCode
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
      invoicedOrders: this.mapInvoicedOrders(invoicedResult.recordset),
      lostOrders: this.mapLostOrders(lostResult.recordset),
    };
  }

  private mapInvoicedOrders(records: SeniorInvoicedRow[]): OverviewCustomerInvoicedOrderRow[] {
    return records
      .filter(
        (record) =>
          Number.isInteger(record.customerCode) &&
          record.customerCode > 0 &&
          Number.isInteger(record.orderNumber) &&
          record.orderNumber > 0 &&
          typeof record.invoiceDate === "string" &&
          record.invoiceDate.length > 0,
      )
      .map((record) => ({
        customerCode: record.customerCode,
        orderNumber: record.orderNumber,
        invoiceDate: record.invoiceDate as string,
        codRep: record.codRep,
        branchCode: record.branchCode,
      }));
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
