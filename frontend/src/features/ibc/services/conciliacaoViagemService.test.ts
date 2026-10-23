import { afterEach, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { conciliacaoViagemService } from "./conciliacaoViagemService";

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("conciliacaoViagemService compatibilidade", () => {
  beforeEach(() => {
    globalThis.localStorage = {
      getItem: () => "test-token",
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } as Storage;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
    mock.restoreAll();
  });

  it("mostra o 409 do PUT com os grupos do pedido e envia retornou como veio", async () => {
    let enviado: unknown;
    globalThis.fetch = mock.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      enviado = JSON.parse(String(init?.body ?? "{}"));
      return jsonResponse({
        code: "IBC_PRODUTO_INCOMPATIVEL",
        error: "IBC NHCL1 não é compatível com o produto do pedido 10",
        details: { identificador: "NHCL1", grupoContainer: "CLORO", gruposPermitidos: ["SODA"] },
      }, 409);
    }) as typeof fetch;

    await assert.rejects(
      () => conciliacaoViagemService.salvar(7, {
        itens: [
          { alocacaoIbcId: "ficou", destino: "FICOU", numPed: "10" },
          { alocacaoIbcId: "voltou", destino: "RETORNOU" },
        ],
      }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(
          error.message,
          "O container NHCL1 é de outro produto (grupo CLORO). Este pedido aceita SODA.",
        );
        return true;
      },
    );
    assert.deepEqual(enviado, {
      itens: [
        { alocacaoIbcId: "ficou", destino: "FICOU", numPed: "10" },
        { alocacaoIbcId: "voltou", destino: "RETORNOU" },
      ],
    });
  });

  it("repete a frase no fechar viagem e preserva os outros conflitos", async () => {
    globalThis.fetch = mock.fn(async () => jsonResponse({
      code: "IBC_PRODUTO_INCOMPATIVEL",
      error: "cru",
      details: { identificador: "HM4", grupoContainer: null, gruposPermitidos: ["SODA"] },
    }, 409)) as typeof fetch;

    await assert.rejects(
      () => conciliacaoViagemService.fechar(7),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /HM4 é de outro produto e não tem grupo na placa/);
        assert.match(error.message, /Este pedido aceita SODA/);
        return true;
      },
    );

    globalThis.fetch = mock.fn(async () =>
      jsonResponse({ error: "A viagem já foi fechada", code: "IBC_VIAGEM_JA_FECHADA" }, 409),
    ) as typeof fetch;

    await assert.rejects(
      () => conciliacaoViagemService.fechar(7),
      (error: unknown) => error instanceof Error && error.message === "A viagem já foi fechada",
    );
  });
});
