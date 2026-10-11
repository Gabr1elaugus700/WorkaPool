import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NAV_ITEMS } from "./navItems";
import { filterNavItems, isNavPathActive } from "./navItems.utils";

function labels(role: string | undefined, group: "main" | "admin"): string[] {
  return filterNavItems(NAV_ITEMS, role, group).map((item) => item.label);
}

describe("navItems.utils", () => {
  it("shows CRM and Cargas to VENDAS, without admin items", () => {
    assert.deepEqual(labels("VENDAS", "main"), ["CRM", "Cargas"]);
    assert.deepEqual(labels("VENDAS", "admin"), []);
  });

  it("shows every main and admin item to ADMIN", () => {
    assert.deepEqual(labels("ADMIN", "main"), [
      "CRM",
      "Pedidos Perdidos",
      "Cargas",
      "Cadastro IBC",
      "Checklists de IBC",
      "Expedição IBC",
    ]);
    assert.deepEqual(labels("ADMIN", "admin"), ["Usuários", "Sync do Overview"]);
  });

  it("shows IBC items to ALMOX with Cargas", () => {
    assert.deepEqual(labels("ALMOX", "main"), [
      "Cargas",
      "Cadastro IBC",
      "Checklists de IBC",
      "Expedição IBC",
    ]);
  });

  it("shows Cadastro IBC read-only to LOGISTICA, without CRM or IBC write items", () => {
    assert.deepEqual(labels("LOGISTICA", "main"), ["Cargas", "Cadastro IBC"]);
  });

  it("shows Cadastro IBC read-only to GERENTE_DPTO, without IBC write items", () => {
    assert.deepEqual(labels("GERENTE_DPTO", "main"), [
      "CRM",
      "Pedidos Perdidos",
      "Cargas",
      "Cadastro IBC",
    ]);
  });

  it("hides role-restricted items when there is no role", () => {
    assert.deepEqual(labels(undefined, "main"), []);
  });

  it("matches active paths by segment, not by prefix", () => {
    assert.equal(isNavPathActive("/", "/"), true);
    assert.equal(isNavPathActive("/", "/crm"), false);
    assert.equal(isNavPathActive("/crm", "/crm/4821"), true);
    assert.equal(isNavPathActive("/crm", "/crmx"), false);
    assert.equal(isNavPathActive("/users", "/Users"), true);
  });
});
