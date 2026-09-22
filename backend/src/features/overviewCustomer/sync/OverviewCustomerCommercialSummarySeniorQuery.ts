import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";
import type {
  OverviewCustomerCommercialLine,
  OverviewCustomerCommercialSummarySeed,
} from "./materializeOverviewCustomerCommercialSummary";

type SeniorCommercialSummaryRecord = {
  customerCode: number;
  orderId: number;
  issuedAt: string | null;
  productCode: string | null;
  quantityInvoiced: number;
  quantityReturned: number;
  unitPrice: number;
  lineMarginPercent: number | null;
};

const DEFAULT_CUTOFF_DATE = "2024-01-01";

export class OverviewCustomerCommercialSummarySeniorQuery {
  async fetchSeed(): Promise<OverviewCustomerCommercialSummarySeed> {
    await sqlPoolConnect;

    const request = sqlPool.request();
    request.input("cutoffDate", DEFAULT_CUTOFF_DATE);
    const result = await request.query<SeniorCommercialSummaryRecord>(`
      SELECT
        nfv.codcli AS customerCode,
        ipv.numped AS orderId,
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
      lines: this.mapLines(result.recordset),
    };
  }

  private mapLines(records: SeniorCommercialSummaryRecord[]): OverviewCustomerCommercialLine[] {
    return records
      .filter(
        (record) =>
          Number.isInteger(record.customerCode) &&
          record.customerCode > 0 &&
          Number.isInteger(record.orderId) &&
          record.orderId > 0 &&
          typeof record.issuedAt === "string" &&
          record.issuedAt.length > 0 &&
          typeof record.productCode === "string" &&
          record.productCode.length > 0,
      )
      .map((record) => ({
        customerCode: record.customerCode,
        orderId: record.orderId,
        issuedAt: record.issuedAt as string,
        productCode: record.productCode as string,
        quantityInvoiced: Number(record.quantityInvoiced),
        quantityReturned: Number(record.quantityReturned),
        unitPrice: Number(record.unitPrice),
        lineMarginPercent:
          record.lineMarginPercent === null ? null : Number(record.lineMarginPercent),
      }));
  }
}
