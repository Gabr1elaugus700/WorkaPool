import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterIbcPageTabs, type IbcPageTab } from "./filterIbcPageTabs";

const TABS: readonly IbcPageTab[] = [
  { id: "avisos", to: "/controle-ibc", label: "Avisos" },
  {
    id: "emprestimos",
    to: "/controle-ibc/emprestimos",
    label: "Empréstimos em atraso",
    allowedRoles: ["ADMIN", "LOGISTICA", "GERENTE_DPTO", "VENDAS"],
  },
  {
    id: "checklists",
    to: "/gestao-ibc/checklists",
    label: "Checklists",
    allowedRoles: ["ADMIN", "ALMOX"],
  },
];

describe("filterIbcPageTabs", () => {
  it("mantém abas sem allowedRoles e as que incluem o role", () => {
    const ids = filterIbcPageTabs(TABS, "ADMIN").map((tab) => tab.id);
    assert.deepEqual(ids, ["avisos", "emprestimos", "checklists"]);
  });

  it("oculta a aba cujo allowedRoles não inclui o role", () => {
    const ids = filterIbcPageTabs(TABS, "VENDAS").map((tab) => tab.id);
    assert.deepEqual(ids, ["avisos", "emprestimos"]);
  });

  it("não deixa aba alguma quando o role não casa com nenhuma visível além das livres", () => {
    const onlyRestricted: readonly IbcPageTab[] = TABS.filter((tab) => tab.allowedRoles);
    assert.deepEqual(filterIbcPageTabs(onlyRestricted, "USER"), []);
  });
});
