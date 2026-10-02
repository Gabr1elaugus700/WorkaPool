import { ChevronDown, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { NavItem } from "./navItems";

type AdminNavMenuProps = {
  items: NavItem[];
  isActive: (path: string) => boolean;
};

export function AdminNavMenu({ items, isActive }: AdminNavMenuProps) {
  if (items.length === 0) {
    return null;
  }

  const hasActiveItem = items.some((item) => isActive(item.to));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
          "data-[state=open]:bg-primary-foreground/15 data-[state=open]:text-primary-foreground",
          hasActiveItem
            ? "bg-primary-foreground/15 text-primary-foreground"
            : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
        )}
      >
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Administração</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <DropdownMenuItem key={item.to} asChild className="cursor-pointer">
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(active && "bg-accent font-semibold text-foreground")}
              >
                <Icon className="text-muted-foreground" aria-hidden="true" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
