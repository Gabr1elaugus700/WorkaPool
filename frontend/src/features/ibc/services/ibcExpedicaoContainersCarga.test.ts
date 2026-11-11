import { afterEach, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { ibcExpedicaoService } from "./ibcExpedicaoService";

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("ibcExpedicaoService.getContainersCarga", () => {
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

  it("busca os containers da carga", async () => {
    const corpo = { grupos: [], vinculados: [], disponiveis: [] };
    let url = "";
    globalThis.fetch = mock.fn(async (input: RequestInfo | URL) => {
      url = String(input);
      return jsonResponse(corpo);
    });

    const data = await ibcExpedicaoService.getContainersCarga(90210);
    assert.equal(url.endsWith("/api/ibc/cargas-expedicao/90210/containers"), true);
    assert.deepEqual(data, corpo);
  });
});
