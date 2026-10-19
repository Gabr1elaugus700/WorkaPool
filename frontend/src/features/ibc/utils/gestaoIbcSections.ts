import type { IbcPageTab } from "./filterIbcPageTabs";
import { IBC_CADASTRO_VIEW_ROLES, IBC_CADASTRO_WRITE_ROLES } from "./ibcCadastroPermissions";

const tabs = [
  {
    id: "containers",
    to: "/gestao-ibc/containers",
    label: "Containers",
    legacyPath: "/cadastro-ibc",
    allowedRoles: IBC_CADASTRO_VIEW_ROLES,
  },
  {
    id: "checklists",
    to: "/gestao-ibc/checklists",
    label: "Checklists",
    legacyPath: "/checklists-ibc",
    allowedRoles: IBC_CADASTRO_WRITE_ROLES,
  },
  {
    id: "conciliacao",
    to: "/gestao-ibc/conciliacao",
    label: "Conciliação ERP",
    legacyPath: "/conciliacao-ibc",
    allowedRoles: IBC_CADASTRO_VIEW_ROLES,
  },
] as const satisfies readonly (IbcPageTab & { readonly legacyPath: string })[];

export type GestaoIbcSectionId = (typeof tabs)[number]["id"];

function path(id: GestaoIbcSectionId): string {
  for (const tab of tabs) {
    if (tab.id === id) return tab.to;
  }
  return tabs[0].to;
}

function legacyTarget(pathname: string, search: string): string | null {
  for (const tab of tabs) {
    if (tab.legacyPath === pathname) return `${tab.to}${search}`;
  }
  return null;
}

export const gestaoIbcSections = {
  tabs,
  path,
  legacyTarget,
};
