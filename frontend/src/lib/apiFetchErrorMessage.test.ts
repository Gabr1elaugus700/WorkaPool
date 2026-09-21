import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fallbackApiErrorMessage, parseApiErrorBody } from "./apiFetchErrorMessage";

describe("apiFetchErrorMessage", () => {
  it("maps Express HTML 404 pages to a friendly message", () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head><title>Error</title></head>
<body><pre>Cannot GET /api/overview/customers/1905/grupos</pre></body>
</html>`;

    assert.equal(parseApiErrorBody(html, 404), "Recurso não encontrado.");
  });

  it("keeps plain-text API errors", () => {
    assert.equal(parseApiErrorBody("Acesso negado ao cliente.", 403), "Acesso negado ao cliente.");
  });

  it("returns status fallback for empty bodies", () => {
    assert.equal(parseApiErrorBody("   ", 502), "Erro no servidor. Tente novamente em instantes.");
  });

  it("provides pt-BR defaults per status", () => {
    assert.equal(fallbackApiErrorMessage(401), "Sessão expirada ou não autenticada.");
    assert.equal(fallbackApiErrorMessage(404), "Recurso não encontrado.");
  });
});
