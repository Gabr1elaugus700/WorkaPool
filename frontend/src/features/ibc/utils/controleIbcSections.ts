import type { UserRole } from "@/features/users/types/user.types";
import { filterIbcPageTabs, type IbcPageTab } from "./filterIbcPageTabs";
import { ibcEmprestimoAtrasadoPermissions } from "./ibcEmprestimoAtrasadoPermissions";

const AVISOS_ROLES = ["VENDAS", "ADMIN"] as const satisfies readonly UserRole[];

const TABS = [
  {
    id: "avisos",
    to: "/controle-ibc",
    label: "Avisos",
    allowedRoles: AVISOS_ROLES,
  },
  {
    id: "emprestimos",
    to: "/controle-ibc/emprestimos",
    label: "Empréstimos em atraso",
    allowedRoles: ibcEmprestimoAtrasadoPermissions.roles,
  },
] as const satisfies readonly IbcPageTab[];

export type ControleIbcSection = (typeof TABS)[number]["id"];

export type ControleIbcAccess =
  | { status: "ok" }
  | { status: "redirect"; to: string }
  | { status: "denied" };

/** Abas do Controle IBC e a primeira aba que o papel ainda pode ver. */
export const controleIbcSections = {
  tabs: TABS,
  roles: ["ADMIN", "VENDAS", "LOGISTICA", "GERENTE_DPTO"] as const satisfies readonly UserRole[],
  resolve(role: string | undefined, section: ControleIbcSection): ControleIbcAccess {
    const visible = filterIbcPageTabs(TABS, role);
    if (visible.length === 0) return { status: "denied" };
    if (visible.some((tab) => tab.id === section)) return { status: "ok" };
    return { status: "redirect", to: visible[0].to };
  },
};
