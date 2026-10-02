import type { UserRole } from "@/features/users/types/user.types";

export const CRM_PORTFOLIO_PATH = "/crm";

export const CRM_ACCESS_ROLES: readonly UserRole[] = ["ADMIN", "GERENTE_DPTO", "VENDAS"];

export function buildCrmCustomerHref(customerCode: number | string): string {
  return `${CRM_PORTFOLIO_PATH}/${encodeURIComponent(String(customerCode))}`;
}
