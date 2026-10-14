import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";

/** Leitura do pool: ADMIN, ALMOX, LOGISTICA e GERENTE_DPTO. Sem escopo de `codRep`. */
export function assertCanLerConciliacaoErp(role: Role): void {
  if (
    role === Role.ADMIN ||
    role === Role.ALMOX ||
    role === Role.LOGISTICA ||
    role === Role.GERENTE_DPTO
  ) {
    return;
  }
  throw new AppError({
    message: "Sem permissão para ler a conciliação ERP",
    statusCode: 403,
    code: "IBC_CONCILIACAO_ERP_FORBIDDEN",
  });
}
