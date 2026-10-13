import { formatIsoDateLabel } from "@/utils/formatDate";
import type { ItemAvisoRepresentante } from "../types/avisoRepresentante.types";

function diaCalendario(value: string | null): string | null {
  if (!value) return null;
  const dia = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : null;
}

/** Rótulos do card: empréstimo é obrigação de devolução; venda é saída definitiva. */
export const avisoRepresentanteLabels = {
  modalidade(item: ItemAvisoRepresentante): string {
    if (item.modalidade === "VENDA") return "Venda — saída definitiva";
    const data = formatIsoDateLabel(diaCalendario(item.emprestimoVenceEm));
    return `Empréstimo — obrigação de devolução até ${data}`;
  },

  lidoEm(value: string): string {
    return `Lido em ${formatIsoDateLabel(diaCalendario(value))}`;
  },
};
