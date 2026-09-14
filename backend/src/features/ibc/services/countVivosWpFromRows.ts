/**
 * Pure definition of vivos WP for soft ERP warning.
 * Counts units still in the company pool (not soft-deleted / sold-baixas).
 */
export type VivosWpRow = {
  baixadoEm: Date | null;
  custodia: "PATIO" | "EM_VIAGEM" | string;
};

export function countVivosWpFromRows(rows: VivosWpRow[]): number {
  return rows.filter((row) => row.baixadoEm == null).length;
}
