import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Contact,
  Container,
  Home,
  Package,
  PackageX,
  RefreshCw,
  Truck,
  UserCog,
} from "lucide-react";
import type { UserRole } from "@/features/users/types/user.types";
import {
  CRM_ACCESS_ROLES,
  CRM_PORTFOLIO_PATH,
} from "@/features/overviewCustomer/utils/overviewCustomerRoutes.utils";
import { IBC_EXPEDICAO_ROLES } from "@/features/ibc/utils/canAccessExpedicaoIbc";
import { IBC_CADASTRO_VIEW_ROLES } from "@/features/ibc/utils/ibcCadastroPermissions";
import { controleIbcSections } from "@/features/ibc/utils/controleIbcSections";

export type NavItemGroup = "main" | "admin";

export type NavItem = {
  label: string;
  mobileLabel?: string;
  to: string;
  icon: LucideIcon;
  group: NavItemGroup;
  allowedRoles?: readonly UserRole[];
  showOnMobile?: boolean;
};

export const HOME_NAV_ITEM: NavItem = {
  label: "Início",
  to: "/",
  icon: Home,
  group: "main",
  showOnMobile: true,
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: "CRM",
    to: CRM_PORTFOLIO_PATH,
    icon: Contact,
    group: "main",
    allowedRoles: CRM_ACCESS_ROLES,
    showOnMobile: true,
  },
  {
    label: "Pedidos Perdidos",
    mobileLabel: "Perdidos",
    to: "/order-loss",
    icon: PackageX,
    group: "main",
    allowedRoles: ["ADMIN", "GERENTE_DPTO"],
    showOnMobile: true,
  },
  {
    label: "Cargas",
    to: "/cargas",
    icon: Truck,
    group: "main",
    allowedRoles: ["VENDAS", "LOGISTICA", "ADMIN", "ALMOX", "GERENTE_DPTO"],
    showOnMobile: true,
  },
  {
    label: "Expedição IBC",
    mobileLabel: "Exp. IBC",
    to: "/expedicao-ibc",
    icon: Package,
    group: "main",
    allowedRoles: IBC_EXPEDICAO_ROLES,
    showOnMobile: true,
  },
  {
    label: "Gestão de IBC",
    mobileLabel: "Gest. IBC",
    to: "/gestao-ibc",
    icon: Container,
    group: "main",
    // União das abas: Containers e Conciliação (leitura) já incluem Checklists (escrita).
    allowedRoles: IBC_CADASTRO_VIEW_ROLES,
    showOnMobile: true,
  },
  {
    label: "Controle IBC",
    mobileLabel: "Ctrl. IBC",
    to: "/controle-ibc",
    icon: ClipboardList,
    group: "main",
    // União das abas Avisos e Empréstimos em atraso.
    allowedRoles: controleIbcSections.roles,
    showOnMobile: true,
  },
  {
    label: "Usuários",
    to: "/users",
    icon: UserCog,
    group: "admin",
    allowedRoles: ["ADMIN"],
  },
  {
    label: "Sync do Overview",
    to: "/overview/sync",
    icon: RefreshCw,
    group: "admin",
    allowedRoles: ["ADMIN"],
  },
];
