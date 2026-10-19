import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HOME_NAV_ITEM, NAV_ITEMS } from "./navItems";
import { filterNavItems, isNavPathActive, selectMobileNavItems } from "./navItems.utils";

const IBC_LABELS = ["Expedição IBC", "Gestão de IBC", "Controle IBC"] as const;

const LEGACY_IBC_PATHS = [
  "/avisos-ibc",
  "/emprestimos-ibc",
  "/cadastro-ibc",
  "/conciliacao-ibc",
  "/checklists-ibc",
] as const;

function labels(role: string | undefined, group: "main" | "admin"): string[] {
  return filterNavItems(NAV_ITEMS, role, group).map((item) => item.label);
}

function mobileLabels(role: string | undefined): string[] {
  return selectMobileNavItems(
    filterNavItems(NAV_ITEMS, role, "main"),
    filterNavItems(NAV_ITEMS, role, "admin"),
    HOME_NAV_ITEM,
  ).map((item) => item.mobileLabel ?? item.label);
}

describe("navItems.utils", () => {
  it("shows CRM, Cargas and Controle IBC to VENDAS, without admin items", () => {
    assert.deepEqual(labels("VENDAS", "main"), ["CRM", "Cargas", "Controle IBC"]);
    assert.deepEqual(labels("VENDAS", "admin"), []);
  });

  it("shows every main and admin item to ADMIN", () => {
    assert.deepEqual(labels("ADMIN", "main"), [
      "CRM",
      "Pedidos Perdidos",
      "Cargas",
      "Expedição IBC",
      "Gestão de IBC",
      "Controle IBC",
    ]);
    assert.deepEqual(labels("ADMIN", "admin"), ["Usuários", "Sync do Overview"]);
  });

  it("shows Expedição and Gestão to ALMOX with Cargas, without Controle", () => {
    assert.deepEqual(labels("ALMOX", "main"), ["Cargas", "Expedição IBC", "Gestão de IBC"]);
  });

  it("shows Gestão and Controle to LOGISTICA, without CRM or Expedição", () => {
    assert.deepEqual(labels("LOGISTICA", "main"), ["Cargas", "Gestão de IBC", "Controle IBC"]);
  });

  it("shows Gestão and Controle to GERENTE_DPTO, without Expedição", () => {
    assert.deepEqual(labels("GERENTE_DPTO", "main"), [
      "CRM",
      "Pedidos Perdidos",
      "Cargas",
      "Gestão de IBC",
      "Controle IBC",
    ]);
  });

  it("keeps at most three IBC items and points them at the new surfaces", () => {
    for (const role of ["ADMIN", "ALMOX", "LOGISTICA", "GERENTE_DPTO", "VENDAS", "USER", "MOTORISTA", undefined]) {
      const visible = labels(role, "main").filter((label) =>
        (IBC_LABELS as readonly string[]).includes(label),
      );
      assert.ok(visible.length <= 3, String(role));
    }
    for (const role of ["USER", "MOTORISTA", undefined]) {
      assert.deepEqual(
        labels(role, "main").filter((label) => (IBC_LABELS as readonly string[]).includes(label)),
        [],
        String(role),
      );
    }

    const ibcItems = NAV_ITEMS.filter((item) =>
      (IBC_LABELS as readonly string[]).includes(item.label),
    );
    assert.deepEqual(
      ibcItems.map((item) => [item.label, item.to, item.mobileLabel, item.showOnMobile]),
      [
        ["Expedição IBC", "/expedicao-ibc", "Exp. IBC", true],
        ["Gestão de IBC", "/gestao-ibc", "Gest. IBC", true],
        ["Controle IBC", "/controle-ibc", "Ctrl. IBC", true],
      ],
    );
    assert.equal(
      NAV_ITEMS.some((item) => (LEGACY_IBC_PATHS as readonly string[]).includes(item.to)),
      false,
    );
  });

  it("hides role-restricted items when there is no role", () => {
    assert.deepEqual(labels(undefined, "main"), []);
  });

  it("matches active paths by segment, including every tab of an IBC surface", () => {
    assert.equal(isNavPathActive("/", "/"), true);
    assert.equal(isNavPathActive("/", "/crm"), false);
    assert.equal(isNavPathActive("/crm", "/crm/4821"), true);
    assert.equal(isNavPathActive("/crm", "/crmx"), false);
    assert.equal(isNavPathActive("/users", "/Users"), true);
    assert.equal(isNavPathActive("/gestao-ibc", "/gestao-ibc/containers"), true);
    assert.equal(isNavPathActive("/gestao-ibc", "/gestao-ibc/checklists"), true);
    assert.equal(isNavPathActive("/gestao-ibc", "/gestao-ibc/conciliacao"), true);
    assert.equal(isNavPathActive("/controle-ibc", "/controle-ibc/emprestimos"), true);
    assert.equal(isNavPathActive("/expedicao-ibc", "/expedicao-ibc/10/fechar-viagem"), true);
    assert.equal(isNavPathActive("/gestao-ibc", "/controle-ibc"), false);
    assert.equal(isNavPathActive("/gestao-ibc", "/gestao-ibcx"), false);
  });

  it("keeps the three IBC shortcuts on the mobile bar when the role can open them", () => {
    assert.deepEqual(mobileLabels("ADMIN"), [
      "Início",
      "CRM",
      "Perdidos",
      "Cargas",
      "Exp. IBC",
      "Gest. IBC",
      "Ctrl. IBC",
    ]);
    assert.deepEqual(mobileLabels("ALMOX"), ["Início", "Cargas", "Exp. IBC", "Gest. IBC"]);
    assert.deepEqual(mobileLabels("VENDAS"), ["Início", "CRM", "Cargas", "Ctrl. IBC"]);
    assert.deepEqual(mobileLabels("LOGISTICA"), ["Início", "Cargas", "Gest. IBC", "Ctrl. IBC"]);
  });
});
