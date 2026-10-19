import type { NavItem, NavItemGroup } from "./navItems";

export function canSeeNavItem(item: NavItem, role: string | undefined): boolean {
  if (!item.allowedRoles || item.allowedRoles.length === 0) {
    return true;
  }
  if (!role) {
    return false;
  }
  return (item.allowedRoles as readonly string[]).includes(role);
}

export function filterNavItems(
  items: readonly NavItem[],
  role: string | undefined,
  group: NavItemGroup,
): NavItem[] {
  return items.filter((item) => item.group === group && canSeeNavItem(item, role));
}

/** Início mais os atalhos. 7 cabe CRM, Perdidos, Cargas e as três superfícies do IBC. */
const MOBILE_NAV_LIMIT = 7;

export function selectMobileNavItems(
  mainItems: readonly NavItem[],
  adminItems: readonly NavItem[],
  home: NavItem,
): NavItem[] {
  return [home, ...mainItems, ...adminItems]
    .filter((item) => item.showOnMobile)
    .slice(0, MOBILE_NAV_LIMIT);
}

export function isNavPathActive(itemPath: string, pathname: string): boolean {
  if (itemPath === "/") {
    return pathname === "/";
  }
  const normalized = pathname.toLowerCase();
  const target = itemPath.toLowerCase();
  return normalized === target || normalized.startsWith(`${target}/`);
}
