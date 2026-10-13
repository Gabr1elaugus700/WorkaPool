import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";

export function assertCanOperarEntradaPatio(role: Role): void {
  if (role === Role.ADMIN || role === Role.ALMOX) return;
  throw new AppError({
    message: "Apenas ADMIN e ALMOX podem operar a entrada no pátio",
    statusCode: 403,
    code: "IBC_ENTRADA_FORBIDDEN",
  });
}
