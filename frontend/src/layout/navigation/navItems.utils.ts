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

export function isNavPathActive(itemPath: string, pathname: string): boolean {
  if (itemPath === "/") {
    return pathname === "/";
  }
  const normalized = pathname.toLowerCase();
  const target = itemPath.toLowerCase();
  return normalized === target || normalized.startsWith(`${target}/`);
}
