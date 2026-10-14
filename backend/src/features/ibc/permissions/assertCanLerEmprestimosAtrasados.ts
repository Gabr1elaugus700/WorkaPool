import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import type { EscopoLeituraEmprestimosAtrasados } from "../types/EmprestimoAtrasado.types";

const PAPEIS_COM_LISTA_COMPLETA: readonly Role[] = [
  Role.ADMIN,
  Role.LOGISTICA,
  Role.GERENTE_DPTO,
];

/**
 * ADMIN, LOGISTICA e GERENTE_DPTO leem todos. VENDAS lê o próprio `codRep`.
 * 999 no JWT é um codRep concreto, não o curinga "todos".
 */
export function assertCanLerEmprestimosAtrasados(
  role: Role,
  codRep: number | undefined,
): EscopoLeituraEmprestimosAtrasados {
  if (PAPEIS_COM_LISTA_COMPLETA.includes(role)) return { tipo: "todas" };
  if (role !== Role.VENDAS) {
    throw new AppError({
      message: "Sem permissão para ler empréstimos em atraso",
      statusCode: 403,
      code: "IBC_EMPRESTIMO_ATRASADO_FORBIDDEN",
    });
  }
  if (typeof codRep === "number" && Number.isInteger(codRep) && codRep > 0) {
    return { tipo: "codRep", codRep };
  }
  return { tipo: "nenhum" };
}
