import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";

export function assertCanFecharViagemIbc(role: Role): void {
  if (role === Role.ADMIN || role === Role.ALMOX) return;
  throw new AppError({
    message: "Apenas ADMIN e ALMOX podem conciliar a viagem",
    statusCode: 403,
    code: "IBC_VIAGEM_FORBIDDEN",
  });
}
