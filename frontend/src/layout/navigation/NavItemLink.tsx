import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { NavItem } from "./navItems";

type NavItemLinkProps = {
  item: NavItem;
  isActive: boolean;
};

export function NavItemLink({ item, isActive }: NavItemLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
        isActive
          ? "bg-primary-foreground/15 text-primary-foreground"
          : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
      {isActive ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-3 -bottom-[10px] h-0.5 rounded-full bg-primary-foreground"
        />
      ) : null}
    </Link>
  );
}
