import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";

export type EscopoLeituraAvisos =
  | { tipo: "todas" }
  | { tipo: "codRep"; codRep: number }
  | { tipo: "nenhum" };

export function assertCanLerAvisosRepresentante(
  role: Role,
  codRep: number | undefined,
): EscopoLeituraAvisos {
  if (role === Role.ADMIN) return { tipo: "todas" };
  if (role !== Role.VENDAS) {
    throw new AppError({
      message: "Apenas VENDAS e ADMIN podem ler avisos do representante",
      statusCode: 403,
      code: "IBC_AVISO_FORBIDDEN",
    });
  }
  // 999 no JWT é um codRep concreto, não o curinga "todos" dos pedidos.
  if (typeof codRep === "number" && Number.isInteger(codRep) && codRep > 0) {
    return { tipo: "codRep", codRep };
  }
  return { tipo: "nenhum" };
}
