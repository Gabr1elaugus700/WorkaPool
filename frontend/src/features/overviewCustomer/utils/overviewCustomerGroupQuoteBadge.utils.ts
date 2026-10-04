export function isOverviewCustomerGroupQuotesRevealRole(
  role: string | null | undefined,
): boolean {
  return role === "ADMIN" || role === "GERENTE_DPTO";
}
