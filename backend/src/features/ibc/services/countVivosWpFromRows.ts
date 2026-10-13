/**
 * Pure definition of vivos WP for soft ERP warning.
 * Counts units still in the active pool: not soft-deleted and not replaced
 * (`convertedToContainerId` set). A missing link counts as not replaced.
 */
export type VivosWpRow = {
  baixadoEm: Date | null;
  custodia: "PATIO" | "EM_VIAGEM" | string;
  convertedToContainerId?: string | null;
};

export function countVivosWpFromRows(rows: VivosWpRow[]): number {
  return rows.filter(
    (row) => row.baixadoEm == null && row.convertedToContainerId == null,
  ).length;
}
