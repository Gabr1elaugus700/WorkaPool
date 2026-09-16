import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";
import type {
  OverviewCustomerMonthlyEvolutionRowSeed,
  OverviewCustomerMonthlyEvolutionSeed,
} from "./materializeOverviewCustomerMonthlyEvolution";

type SeniorMonthlyEvolutionRecord = {
  customerCode: number;
  month: string | null;
  revenue: number;
  volume: number;
  orderCount: number;
  marginPercent: number | null;
};

const DEFAULT_CUTOFF_DATE = "2024-01-01";

export class OverviewCustomerMonthlyEvolutionSeniorQuery {
  async fetchSeed(): Promise<OverviewCustomerMonthlyEvolutionSeed> {
    await sqlPoolConnect;

    const request = sqlPool.request();
    request.input("cutoffDate", DEFAULT_CUTOFF_DATE);
    const result = await request.query<SeniorMonthlyEvolutionRecord>(`
      SELECT
        nfv.codcli AS customerCode,
        CONVERT(VARCHAR(7), nfv.datemi, 23) AS month,
        SUM((ipv.qtdfat - ipv.qtddev) * ipv.preuni) AS revenue,
        SUM(
          CASE
            WHEN CAST(ipv.codpro AS VARCHAR(32)) = '101072'
              THEN (ipv.qtdfat - ipv.qtddev) / 2.0
            ELSE (ipv.qtdfat - ipv.qtddev)
          END
        ) AS volume,
        COUNT(DISTINCT ipv.numped) AS orderCount,
        CASE
          WHEN SUM((ipv.qtdfat - ipv.qtddev) * ipv.preuni) > 0
            THEN SUM(((ipv.qtdfat - ipv.qtddev) * ipv.preuni) * ISNULL(ipd.usu_mgmluc, 0))
              / SUM((ipv.qtdfat - ipv.qtddev) * ipv.preuni)
          ELSE NULL
        END AS marginPercent
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
      GROUP BY
        nfv.codcli,
        CONVERT(VARCHAR(7), nfv.datemi, 23)
    `);

    return {
      rows: this.mapRows(result.recordset),
    };
  }

  private mapRows(records: SeniorMonthlyEvolutionRecord[]): OverviewCustomerMonthlyEvolutionRowSeed[] {
    return records
      .filter(
        (record) =>
          Number.isInteger(record.customerCode) &&
          record.customerCode > 0 &&
          typeof record.month === "string" &&
          record.month.length === 7,
      )
      .map((record) => ({
        customerCode: record.customerCode,
        month: record.month as string,
        revenue: Number(record.revenue),
        volume: Number(record.volume),
        orderCount: Number(record.orderCount),
        marginPercent: record.marginPercent === null ? null : Number(record.marginPercent),
      }));
  }
}
