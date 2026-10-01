import { Role } from "@prisma/client";

/** Ready for custody routes (#37): only MOTORISTA may confirm Custódia no Cliente. */
export function canConfirmCustodia(role: Role): boolean {
  return role === Role.MOTORISTA;
}
