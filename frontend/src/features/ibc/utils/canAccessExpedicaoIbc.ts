import type { UserRole } from "@/features/users/types/user.types";

export const IBC_EXPEDICAO_ROLES = ["ALMOX", "ADMIN"] as const satisfies readonly UserRole[];

export function canAccessExpedicaoIbc(role: string | undefined): boolean {
  return IBC_EXPEDICAO_ROLES.some((allowed) => allowed === role);
}
