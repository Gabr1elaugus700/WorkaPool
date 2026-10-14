import type { UserRole } from "@/features/users/types/user.types";

/** Leitura do painel. ALMOX fica de fora; VENDAS entra. Não é o papel do cadastro. */
export const ibcEmprestimoAtrasadoPermissions = {
  roles: ["ADMIN", "LOGISTICA", "GERENTE_DPTO", "VENDAS"] as const satisfies readonly UserRole[],
  canView(role: string | undefined): boolean {
    return (this.roles as readonly string[]).includes(role ?? "");
  },
};
