import { Role } from "@prisma/client";
import { assertCanLerEmprestimosAtrasados } from "../permissions/assertCanLerEmprestimosAtrasados";
import type { IIbcEmprestimoAtrasadoRepository } from "../repositories/IIbcEmprestimoAtrasadoRepository";
import { selecionarEmprestimosAtrasados } from "../services/selecionarEmprestimosAtrasados";
import type { EmprestimoAtrasado } from "../types/EmprestimoAtrasado.types";

export type ListEmprestimosAtrasadosInput = {
  role: Role;
  codRep?: number;
  /** Relógio da leitura. O default é o instante real. */
  now?: Date;
};

/**
 * Lista empréstimos cujo prazo gravado já venceu e o IBC segue no cliente.
 * Não grava custódia e não recalcula os 90 dias.
 */
export class ListEmprestimosAtrasadosUseCase {
  constructor(private readonly emprestimos: IIbcEmprestimoAtrasadoRepository) {}

  async execute(input: ListEmprestimosAtrasadosInput): Promise<{ itens: EmprestimoAtrasado[] }> {
    const escopo = assertCanLerEmprestimosAtrasados(input.role, input.codRep);
    const now = input.now ?? new Date();
    const linhas = escopo.tipo === "nenhum" ? [] : await this.emprestimos.listar(now);
    return { itens: selecionarEmprestimosAtrasados(linhas, now, escopo) };
  }
}
