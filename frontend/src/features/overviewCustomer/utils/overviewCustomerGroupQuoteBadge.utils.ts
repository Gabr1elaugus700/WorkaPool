export function formatOverviewCustomerGroupQuoteSellerBadge(input: {
  codRep: number;
  sellerName: string | null;
  repShortName: string | null;
}): string {
  const sellerName = input.sellerName?.trim() ?? "";
  if (sellerName.length > 0) {
    return `${input.codRep} ${sellerName}`;
  }

  const repShortName = input.repShortName?.trim() ?? "";
  if (repShortName.length > 0) {
    return `${input.codRep} ${repShortName}`;
  }

  return String(input.codRep);
}

export function isOverviewCustomerGroupQuotesRevealRole(
  role: string | null | undefined,
): boolean {
  return role === "ADMIN" || role === "GERENTE_DPTO";
}
