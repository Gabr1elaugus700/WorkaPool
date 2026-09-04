import { afterEach, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubLocalStorage(): void {
  globalThis.localStorage = {
    getItem: () => "test-token",
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
  } as Storage;
}

describe("cargoService close adapter", () => {
  beforeEach(() => {
    stubLocalStorage();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
    mock.restoreAll();
  });

  it("sends close-carga body with codCar and caminhaoId only", async () => {
    const fetchMock = mock.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      assert.equal(body.codCar, 1234);
      assert.equal(body.caminhaoId, "550e8400-e29b-41d4-a716-446655440000");
      assert.equal("motoristaId" in body, false);
      return jsonResponse({ message: "ok", pedidosSalvos: 1 });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const { cargoService } = await import("./cargoService.ts");
    await cargoService.closeCarga(1234, {
      caminhaoId: "550e8400-e29b-41d4-a716-446655440000",
    });

    assert.equal(fetchMock.mock.calls.length, 1);
  });
});
