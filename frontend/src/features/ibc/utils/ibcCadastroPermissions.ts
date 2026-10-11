import type { UserRole } from "@/features/users/types/user.types";

/** Espelha `ibcReadRoles` do backend: veem pool, alertas, histórico e inspeções (#313). */
export const IBC_CADASTRO_VIEW_ROLES: readonly UserRole[] = [
  "ADMIN",
  "ALMOX",
  "LOGISTICA",
  "GERENTE_DPTO",
];

/** Espelha `ibcWriteRoles` do backend: cadastram, convertem, inspecionam e gerenciam checklists. */
export const IBC_CADASTRO_WRITE_ROLES: readonly UserRole[] = ["ADMIN", "ALMOX"];

function hasRole(roles: readonly UserRole[], role: string | undefined): boolean {
  return roles.some((allowed) => allowed === role);
}

export function canViewIbcCadastro(role: string | undefined): boolean {
  return hasRole(IBC_CADASTRO_VIEW_ROLES, role);
}

export function canWriteIbcCadastro(role: string | undefined): boolean {
  return hasRole(IBC_CADASTRO_WRITE_ROLES, role);
}
