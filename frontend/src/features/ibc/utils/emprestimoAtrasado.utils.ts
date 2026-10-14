import { formatIsoDateLabel } from "@/utils/formatDate";
import type { EmprestimoAtrasado } from "../types/emprestimoAtrasado.types";

function diaUtc(value: string): string | null {
  const dia = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : null;
}

/** Rótulos da tabela. A data é o dia UTC gravado, sem fuso local. */
export const emprestimoAtrasadoApresentacao = {
  cliente(item: EmprestimoAtrasado): string {
    return item.cliente ?? item.codCli ?? "Não informado";
  },
  representante(item: EmprestimoAtrasado): string {
    return item.codRep == null ? "Não informado" : String(item.codRep);
  },
  dataEsperada(item: EmprestimoAtrasado): string {
    return formatIsoDateLabel(diaUtc(item.emprestimoVenceEm));
  },
};
