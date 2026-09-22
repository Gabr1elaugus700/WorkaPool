import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";
import type {
  OverviewCustomerWinsByGroupLine,
  OverviewCustomerWinsByGroupSeed,
} from "./materializeOverviewCustomerWinsByGroup";

type SeniorWinsByGroupRecord = {
  customerCode: number;
  orderId: number;
  invoiceNumber: number;
  issuedAt: string | null;
  productCode: string | number | null;
  quantityInvoiced: number;
  quantityReturned: number;
  unitPrice: number;
  lineMarginPercent: number | null;
};

const DEFAULT_CUTOFF_DATE = "2024-01-01";

export class OverviewCustomerWinsByGroupSeniorQuery {
  async fetchSeed(): Promise<Pick<OverviewCustomerWinsByGroupSeed, "lines">> {
    await sqlPoolConnect;

    const request = sqlPool.request();
    request.input("cutoffDate", DEFAULT_CUTOFF_DATE);
    const result = await request.query<SeniorWinsByGroupRecord>(`
      SELECT
        nfv.codcli AS customerCode,
        ipv.numped AS orderId,
        nfv.numnfv AS invoiceNumber,
        CONVERT(VARCHAR(10), nfv.datemi, 23) AS issuedAt,
        CAST(ipv.codpro AS VARCHAR(32)) AS productCode,
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

    return {
      lines: this.mapRows(result.recordset),
    };
  }

  private mapRows(records: SeniorWinsByGroupRecord[]): OverviewCustomerWinsByGroupLine[] {
    return records
      .filter(
        (record) =>
          Number.isInteger(record.customerCode) &&
          record.customerCode > 0 &&
          Number.isInteger(record.orderId) &&
          record.orderId > 0 &&
          Number.isInteger(record.invoiceNumber) &&
          record.invoiceNumber > 0 &&
          typeof record.issuedAt === "string" &&
          record.issuedAt.length === 10 &&
          record.productCode !== null,
      )
      .map((record) => ({
        customerCode: record.customerCode,
        orderId: record.orderId,
        invoiceNumber: record.invoiceNumber,
        issuedAt: record.issuedAt as string,
        productCode: String(record.productCode),
        quantityInvoiced: Number(record.quantityInvoiced),
        quantityReturned: Number(record.quantityReturned),
        unitPrice: Number(record.unitPrice),
        lineMarginPercent:
          record.lineMarginPercent === null ? null : Number(record.lineMarginPercent),
      }));
  }
}
