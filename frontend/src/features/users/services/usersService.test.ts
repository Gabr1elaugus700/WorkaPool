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

describe("usersService list query", () => {
  beforeEach(() => {
    stubLocalStorage();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
    mock.restoreAll();
  });

  it("GET /api/users sends search and includeInactive query params", async () => {
    let requestedUrl = "";
    globalThis.fetch = mock.fn(async (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return jsonResponse([]);
    }) as typeof fetch;

    const { usersService } = await import("./usersService.ts");
    await usersService.getAll({ search: "Maria", includeInactive: true });

    assert.match(requestedUrl, /\/api\/users\?/);
    assert.match(requestedUrl, /search=Maria/);
    assert.match(requestedUrl, /includeInactive=true/);
  });

  it("POST /api/users/:id/reset-password sends the new password", async () => {
    let requestedUrl = "";
    let requestedMethod = "";
    let requestedBody = "";
    globalThis.fetch = mock.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requestedUrl = String(input);
      requestedMethod = init?.method ?? "";
      requestedBody = String(init?.body ?? "");
      return jsonResponse({ id: "user-1", isActive: true });
    }) as typeof fetch;

    const { usersService } = await import("./usersService.ts");
    await usersService.resetPassword("user-1", {
      password: "novaSenha1",
      mustChangePassword: true,
    });

    assert.match(requestedUrl, /\/api\/users\/user-1\/reset-password$/);
    assert.equal(requestedMethod, "POST");
    assert.equal(
      requestedBody,
      JSON.stringify({ password: "novaSenha1", mustChangePassword: true }),
    );
  });

  it("POST /api/users/:id/deactivate inactivates the user", async () => {
    let requestedUrl = "";
    let requestedMethod = "";
    globalThis.fetch = mock.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requestedUrl = String(input);
      requestedMethod = init?.method ?? "";
      return jsonResponse({ id: "user-1", isActive: false });
    }) as typeof fetch;

    const { usersService } = await import("./usersService.ts");
    const result = await usersService.deactivate("user-1");

    assert.match(requestedUrl, /\/api\/users\/user-1\/deactivate$/);
    assert.equal(requestedMethod, "POST");
    assert.equal(result.isActive, false);
  });

  it("POST /api/users/:id/reactivate restores the user", async () => {
    let requestedUrl = "";
    let requestedMethod = "";
    globalThis.fetch = mock.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requestedUrl = String(input);
      requestedMethod = init?.method ?? "";
      return jsonResponse({ id: "user-1", isActive: true });
    }) as typeof fetch;

    const { usersService } = await import("./usersService.ts");
    const result = await usersService.reactivate("user-1");

    assert.match(requestedUrl, /\/api\/users\/user-1\/reactivate$/);
    assert.equal(requestedMethod, "POST");
    assert.equal(result.isActive, true);
  });
});
