export const FROTA_ACCESS_ROLES = [
  "ADMIN",
  "LOGISTICA",
  "GERENTE_DPTO",
] as const;

export function canAccessFrota(role: string | undefined): boolean {
  if (!role) {
    return false;
  }
  return (FROTA_ACCESS_ROLES as readonly string[]).includes(role);
}
