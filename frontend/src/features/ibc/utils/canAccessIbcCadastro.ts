/** ALMOX e ADMIN acessam a UI de cadastro IBC (#32). */
export function canAccessIbcCadastro(role: string | undefined): boolean {
  if (!role) return false;
  return role === "ALMOX" || role === "ADMIN";
}
