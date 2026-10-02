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
    assert.deepEqual(labels("ADMIN", "main"), ["CRM", "Pedidos Perdidos", "Cargas"]);
    assert.deepEqual(labels("ADMIN", "admin"), ["Usuários", "Sync do Overview"]);
  });

  it("hides CRM from LOGISTICA", () => {
    assert.deepEqual(labels("LOGISTICA", "main"), ["Cargas"]);
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
