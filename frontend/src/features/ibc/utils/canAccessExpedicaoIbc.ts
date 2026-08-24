/**
 * ALMOX e ADMIN acessam a UI de expedição IBC (#59–#61).
 */
export function canAccessExpedicaoIbc(role: string | undefined): boolean {
  if (!role) return false;
  return role === "ALMOX" || role === "ADMIN";
}
