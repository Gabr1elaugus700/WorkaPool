import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveIbcTabStatus } from "./resolveIbcTabStatus";

const base = {
  isLoading: false,
  error: null,
  isEmpty: false,
  loadingLabel: "Carregando…",
  empty: { title: "Nada aqui.", nextStep: "Faça algo." },
};

describe("resolveIbcTabStatus", () => {
  it("prioriza o carregamento", () => {
    const status = resolveIbcTabStatus({ ...base, isLoading: true, error: new Error("x"), isEmpty: true });
    assert.deepEqual(status, { status: "loading", loadingLabel: "Carregando…" });
  });

  it("mostra o erro antes do vazio", () => {
    const status = resolveIbcTabStatus({ ...base, error: "falhou", isEmpty: true });
    assert.equal(status?.status, "error");
    assert.equal(status?.status === "error" ? status.error.message : null, "falhou");
  });

  it("mostra o vazio com o próximo passo", () => {
    const status = resolveIbcTabStatus({ ...base, isEmpty: true });
    assert.deepEqual(status, { status: "empty", title: "Nada aqui.", nextStep: "Faça algo." });
  });

  it("retorna null quando há itens", () => {
    assert.equal(resolveIbcTabStatus(base), null);
  });
});
