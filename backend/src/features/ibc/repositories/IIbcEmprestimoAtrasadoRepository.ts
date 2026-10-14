import type { LinhaEmprestimoAtrasado } from "../types/EmprestimoAtrasado.types";

/** Porta de leitura. Não aplica escopo de representante. */
export interface IIbcEmprestimoAtrasadoRepository {
  listar(now: Date): Promise<LinhaEmprestimoAtrasado[]>;
}
