import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";
import type {
  OverviewCustomerIdentityBaseRow,
  OverviewCustomerInvoicedSaleRow,
  OverviewCustomerIdentitySeed,
} from "./materializeOverviewCustomerIdentity";

type SeniorIdentityBaseRecord = {
  customerCode: number;
  tradeName: string | null;
  document: string | null;
  city: string | null;
  state: string | null;
  segment: string | null;
  registrationDate: string | null;
};

type SeniorIdentitySaleRecord = {
  customerCode: number;
  codRep: number | null;
  invoiceDate: string | null;
  branchCode: number;
};

const DEFAULT_CUTOFF_DATE = "2024-01-01";

export class OverviewCustomerIdentitySeniorQuery {
  async fetchSeed(): Promise<OverviewCustomerIdentitySeed> {
    await sqlPoolConnect;

    const customersRequest = sqlPool.request();
    customersRequest.input("cutoffDate", DEFAULT_CUTOFF_DATE);
    const customersResult = await customersRequest.query<SeniorIdentityBaseRecord>(`
      WITH ClientesAtivos AS (
        SELECT DISTINCT nfv.codcli AS codcli
        FROM e140nfv nfv
        WHERE nfv.datemi >= @cutoffDate
      )
      SELECT
        cli.codcli AS customerCode,
        NULLIF(LTRIM(RTRIM(cli.apecli)), '') AS tradeName,
        NULLIF(LTRIM(RTRIM(cli.cgccpf)), '') AS document,
        NULLIF(LTRIM(RTRIM(cli.cidcli)), '') AS city,
        NULLIF(LTRIM(RTRIM(cli.sigufs)), '') AS state,
        NULLIF(LTRIM(RTRIM(ram.desram)), '') AS segment,
        CONVERT(VARCHAR(10), cli.datcad, 23) AS registrationDate
      FROM e085cli cli
      INNER JOIN ClientesAtivos ativos
        ON ativos.codcli = cli.codcli
      LEFT JOIN e026ram ram
        ON ram.codram = cli.codram
    `);

    const salesRequest = sqlPool.request();
    salesRequest.input("cutoffDate", DEFAULT_CUTOFF_DATE);
    const salesResult = await salesRequest.query<SeniorIdentitySaleRecord>(`
      SELECT
        nfv.codcli AS customerCode,
        ped.codven AS codRep,
        CONVERT(VARCHAR(10), nfv.datemi, 23) AS invoiceDate,
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

    return {
      customers: this.mapCustomers(customersResult.recordset),
      sales: this.mapSales(salesResult.recordset),
    };
  }

  private mapCustomers(records: SeniorIdentityBaseRecord[]): OverviewCustomerIdentityBaseRow[] {
    return records
      .filter((record) => Number.isInteger(record.customerCode) && record.customerCode > 0)
      .map((record) => ({
        customerCode: record.customerCode,
        tradeName: record.tradeName ?? "Sem nome",
        document: record.document ?? "N/A",
        city: record.city ?? "N/A",
        state: record.state ?? "N/A",
        segment: record.segment,
        registrationDate: record.registrationDate,
      }));
  }

  private mapSales(records: SeniorIdentitySaleRecord[]): OverviewCustomerInvoicedSaleRow[] {
    return records
      .filter(
        (record) =>
          Number.isInteger(record.customerCode) &&
          record.customerCode > 0 &&
          typeof record.invoiceDate === "string" &&
          record.invoiceDate.length > 0,
      )
      .map((record) => ({
        customerCode: record.customerCode,
        codRep: record.codRep,
        invoiceDate: record.invoiceDate as string,
        branchCode: record.branchCode,
        isInvoiced: true,
      }));
  }
}
