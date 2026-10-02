import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { NavItem } from "./navItems";

type MobileBottomNavProps = {
  items: NavItem[];
  isActive: (path: string) => boolean;
};

export function MobileBottomNav({ items, isActive }: MobileBottomNavProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 md:hidden"
    >
      <ul className="flex justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className={cn("text-xs", active ? "font-semibold" : "font-medium")}>
                  {item.mobileLabel ?? item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
