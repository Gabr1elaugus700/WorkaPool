import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminNavMenu } from "./AdminNavMenu";
import { NavItemLink } from "./NavItemLink";
import type { NavItem } from "./navItems";

type AppTopNavProps = {
  mainItems: NavItem[];
  adminItems: NavItem[];
  isActive: (path: string) => boolean;
  userName?: string;
  onLogout: () => void;
};

export function AppTopNav({ mainItems, adminItems, isActive, userName, onLogout }: AppTopNavProps) {
  return (
    <header className="hidden bg-primary text-primary-foreground shadow-sm md:block">
      <div className="container mx-auto flex h-14 items-center gap-6 px-4">
        <Link
          to="/"
          className="rounded-md text-lg font-bold tracking-tight text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          WorkaPool
        </Link>

        <nav aria-label="Navegação principal" className="flex flex-1 items-center gap-1">
          {mainItems.map((item) => (
            <NavItemLink key={item.to} item={item} isActive={isActive(item.to)} />
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <AdminNavMenu items={adminItems} isActive={isActive} />
          <span aria-hidden="true" className="mx-2 h-6 w-px bg-primary-foreground/25" />
          {userName ? (
            <span className="max-w-[12rem] truncate px-2 text-sm text-primary-foreground/80">
              {userName}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-primary-foreground/80 transition-colors duration-150 hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
