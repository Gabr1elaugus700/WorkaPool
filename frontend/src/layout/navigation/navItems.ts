import type { LucideIcon } from "lucide-react";
import {
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
    label: "Cadastro IBC",
    mobileLabel: "Cad. IBC",
    to: "/cadastro-ibc",
    icon: Container,
    group: "main",
    allowedRoles: ["ALMOX", "ADMIN"],
    showOnMobile: true,
  },
  {
    label: "Expedição IBC",
    mobileLabel: "Exp. IBC",
    to: "/expedicao-ibc",
    icon: Package,
    group: "main",
    allowedRoles: ["ALMOX", "ADMIN"],
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
