import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";
import type { OverviewCustomerGroupPerdidoLine } from "../utils/aggregateOverviewCustomerGroupPerdidos";
import { OVERVIEW_CUSTOMER_GROUP_PERDIDOS_SQL } from "./overviewCustomerGroupPerdidos.sql";

export type OverviewCustomerGroupPerdidosQueryInput = {
  customerCode: number;
  grupoCodigo: string;
};

export type OverviewCustomerGroupPerdidosSeniorReader = {
  fetchLines(
    input: OverviewCustomerGroupPerdidosQueryInput,
  ): Promise<OverviewCustomerGroupPerdidoLine[]>;
};

type SeniorPerdidoRecord = {
  DATA: string | Date | null;
  NUMPED: number;
  QTDPED: number;
  PREUNI: number;
  VLRFINAL: number;
  MARGEM_LUCRO: number | null;
};

export class OverviewCustomerGroupPerdidosSeniorQuery
  implements OverviewCustomerGroupPerdidosSeniorReader
{
  async fetchLines(
    input: OverviewCustomerGroupPerdidosQueryInput,
  ): Promise<OverviewCustomerGroupPerdidoLine[]> {
    await sqlPoolConnect;
    const request = sqlPool.request();
    request.input("codCli", input.customerCode);
    request.input("codGrp", input.grupoCodigo);
    const result = await request.query<SeniorPerdidoRecord>(
      OVERVIEW_CUSTOMER_GROUP_PERDIDOS_SQL,
    );
    return this.mapLines(result.recordset);
  }

  private mapLines(records: SeniorPerdidoRecord[]): OverviewCustomerGroupPerdidoLine[] {
    const lines: OverviewCustomerGroupPerdidoLine[] = [];
    for (const record of records) {
      const datemi = toIsoDate(record.DATA);
      const numped = Number(record.NUMPED);
      const qtdped = Number(record.QTDPED);
      const preuni = Number(record.PREUNI);
      const vlrfinal = Number(record.VLRFINAL);
      if (
        datemi === null ||
        !Number.isInteger(numped) ||
        numped <= 0 ||
        !Number.isFinite(qtdped) ||
        !Number.isFinite(preuni) ||
        !Number.isFinite(vlrfinal)
      ) {
        continue;
      }
      lines.push({
        numped,
        datemi,
        qtdped,
        preuni,
        vlrfinal,
        margem:
          record.MARGEM_LUCRO === null || record.MARGEM_LUCRO === undefined
            ? null
            : Number(record.MARGEM_LUCRO),
      });
    }
    return lines;
  }
}

function toIsoDate(value: string | Date | null): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.length >= 10) {
    return value.slice(0, 10);
  }
  return null;
}
