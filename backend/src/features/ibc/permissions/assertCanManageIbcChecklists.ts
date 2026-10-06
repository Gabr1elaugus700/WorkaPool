import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";

export function assertCanManageIbcChecklists(role: Role): void {
  if (role !== Role.ADMIN && role !== Role.ALMOX) {
    throw new AppError({
      message: "Apenas ADMIN e ALMOX podem gerenciar checklists de IBC",
      statusCode: 403,
      code: "IBC_CHECKLIST_FORBIDDEN",
    });
  }
}
