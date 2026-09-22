import type { OverviewCustomerWinsByGroupRow } from "../sync/materializeOverviewCustomerWinsByGroup";

export type OverviewCustomerGroupGanho = {
  numnfv: number;
  numped: number;
  datemi: string;
  vlrfinal: number;
  qtdped: number;
  preuni: number;
  margem: number | null;
};

const TOP_GANHOS = 5;

export function selectOverviewCustomerGroupGanhos(
  rows: OverviewCustomerWinsByGroupRow[],
  grupoCodigo: string,
): OverviewCustomerGroupGanho[] {
  return rows
    .filter((row) => row.grupoCodigo === grupoCodigo)
    .sort(compareGanhos)
    .slice(0, TOP_GANHOS)
    .map((row) => ({
      numnfv: row.numnfv,
      numped: row.numped,
      datemi: row.datemi,
      vlrfinal: row.vlrfinal,
      qtdped: row.qtdped,
      preuni: row.preuni,
      margem: row.margem,
    }));
}

function compareGanhos(
  left: OverviewCustomerWinsByGroupRow,
  right: OverviewCustomerWinsByGroupRow,
): number {
  if (left.datemi !== right.datemi) {
    return right.datemi.localeCompare(left.datemi);
  }
  return right.numped - left.numped;
}
