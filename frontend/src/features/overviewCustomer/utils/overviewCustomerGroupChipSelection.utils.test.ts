import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveGroupAnalysisErrorMessage,
  selectDefaultGrupoCodigo,
  shouldFetchAbcGroups,
} from "./overviewCustomerGroupChipSelection.utils";

describe("overviewCustomerGroupChipSelection.utils", () => {
  it("selects the first grupo as default (highest share from API order)", () => {
    const grupos = [
      { grupoCodigo: "G01", grupoDescricao: "Grupo A", revenueShare: 42 },
      { grupoCodigo: "OUTROS", grupoDescricao: "OUTROS PRODUTOS", revenueShare: 18 },
    ];

    assert.equal(selectDefaultGrupoCodigo(grupos), "G01");
  });

  it("fetches ABC groups only on the overview tab", () => {
    assert.equal(shouldFetchAbcGroups("overview"), true);
    assert.equal(shouldFetchAbcGroups("history"), false);
    assert.equal(shouldFetchAbcGroups("products"), false);
    assert.equal(shouldFetchAbcGroups("motion"), false);
  });

  it("surfaces Acesso negado from API errors for parent compose", () => {
    const message = resolveGroupAnalysisErrorMessage(new Error("Acesso negado"));
    assert.match(message, /Acesso negado/);
  });
});
