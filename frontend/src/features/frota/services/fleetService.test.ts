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

describe("fleetService adapter", () => {
  beforeEach(() => {
    stubLocalStorage();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
    mock.restoreAll();
  });

  it("maps create-truck API response to FleetTruck", async () => {
    globalThis.fetch = mock.fn(async () =>
      jsonResponse(
        {
          id: "truck-1",
          name: "Volvo FH",
          capacity: 25000,
          plate: "ABC1D23",
          type: "Cavalo",
          axles: 6,
          active: true,
          createdAt: "2026-09-01T12:00:00.000Z",
          codRep: 0,
        },
        201,
      ),
    ) as typeof fetch;

    const { fleetService } = await import("./fleetService.ts");
    const truck = await fleetService.createTruck({
      name: "Volvo FH",
      capacity: 25000,
      plate: "ABC1D23",
      type: "Cavalo",
      axles: 6,
      active: true,
    });

    assert.equal(truck.id, "truck-1");
    assert.equal(truck.plate, "ABC1D23");
    assert.equal(truck.capacity, 25000);
    assert.equal(truck.active, true);
  });

  it("surfaces API validation errors from POST /api/trucks", async () => {
    globalThis.fetch = mock.fn(async () =>
      jsonResponse({ error: "Placa é obrigatória" }, 400),
    ) as typeof fetch;

    const { fleetService } = await import("./fleetService.ts");

    await assert.rejects(
      () =>
        fleetService.createTruck({
          name: "Volvo FH",
          capacity: 25000,
          plate: "",
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "Placa é obrigatória");
        return true;
      },
    );
  });
});
