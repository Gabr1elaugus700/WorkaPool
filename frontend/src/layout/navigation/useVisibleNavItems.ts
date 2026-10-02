import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { HOME_NAV_ITEM, NAV_ITEMS, type NavItem } from "./navItems";
import { filterNavItems, isNavPathActive } from "./navItems.utils";

const MOBILE_NAV_LIMIT = 4;

export function useVisibleNavItems() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const role = user?.role;

  const mainItems = useMemo(() => filterNavItems(NAV_ITEMS, role, "main"), [role]);
  const adminItems = useMemo(() => filterNavItems(NAV_ITEMS, role, "admin"), [role]);
  const mobileItems = useMemo<NavItem[]>(
    () =>
      [HOME_NAV_ITEM, ...mainItems, ...adminItems]
        .filter((item) => item.showOnMobile)
        .slice(0, MOBILE_NAV_LIMIT),
    [mainItems, adminItems],
  );

  const isActive = useCallback((path: string) => isNavPathActive(path, pathname), [pathname]);

  return { mainItems, adminItems, mobileItems, isActive, userName: user?.name ?? user?.user };
}
