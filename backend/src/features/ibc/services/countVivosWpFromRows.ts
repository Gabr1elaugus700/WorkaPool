/**
 * Pure definition of vivos WP for soft ERP warning.
 * Counts units still in the active pool: not soft-deleted, not baixa de viagem
 * (`motivoBaixa`) and not replaced (`convertedToContainerId` set).
 */
export type VivosWpRow = {
  baixadoEm: Date | null;
  custodia: "PATIO" | "EM_VIAGEM" | "CLIENTE" | string;
  convertedToContainerId?: string | null;
  /** Baixa de Fechar Viagem (VENDA/TROCA). Não é o soft delete `baixadoEm`. */
  motivoBaixa?: "VENDA" | "TROCA" | null;
};

export function countVivosWpFromRows(rows: VivosWpRow[]): number {
  return rows.filter(
    (row) =>
      row.baixadoEm == null &&
      row.convertedToContainerId == null &&
      row.motivoBaixa == null,
  ).length;
}
