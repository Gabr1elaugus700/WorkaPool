import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterIbcPageTabs } from "./filterIbcPageTabs";
import { gestaoIbcSections } from "./gestaoIbcSections";

describe("gestaoIbcSections", () => {
  it("mostra Containers, Checklists e Conciliação ERP para quem escreve", () => {
    for (const role of ["ADMIN", "ALMOX"]) {
      const labels = filterIbcPageTabs(gestaoIbcSections.tabs, role).map((tab) => tab.label);
      assert.deepEqual(labels, ["Containers", "Produtos", "Checklists", "Conciliação ERP"], role);
    }
  });

  it("esconde Checklists de quem só consulta o parque", () => {
    for (const role of ["LOGISTICA", "GERENTE_DPTO"]) {
      const ids = filterIbcPageTabs(gestaoIbcSections.tabs, role).map((tab) => tab.id);
      assert.deepEqual(ids, ["containers", "produtos", "conciliacao"], role);
    }
  });

  it("não mostra aba da Gestão para quem não via cadastro nem conciliação", () => {
    assert.deepEqual(filterIbcPageTabs(gestaoIbcSections.tabs, "VENDAS"), []);
    assert.deepEqual(filterIbcPageTabs(gestaoIbcSections.tabs, undefined), []);
  });

  it("redireciona a rota antiga preservando a query, inclusive ?bucket=", () => {
    assert.equal(
      gestaoIbcSections.legacyTarget("/conciliacao-ibc", "?bucket=PATIO"),
      "/gestao-ibc/conciliacao?bucket=PATIO",
    );
    assert.equal(
      gestaoIbcSections.legacyTarget("/cadastro-ibc", ""),
      "/gestao-ibc/containers",
    );
    assert.equal(
      gestaoIbcSections.legacyTarget("/checklists-ibc", "?origem=vinculo"),
      "/gestao-ibc/checklists?origem=vinculo",
    );
    assert.equal(gestaoIbcSections.legacyTarget("/expedicao-ibc", "?bucket=PATIO"), null);
  });

  it("aponta o vínculo de checklist para a aba Checklists", () => {
    assert.equal(gestaoIbcSections.path("checklists"), "/gestao-ibc/checklists");
  });
});
