import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapFleetTruckResponse } from "./fleetMappers.ts";

describe("fleetService", () => {
  it("mapFleetTruckResponse returns typed truck from API payload", () => {
    const truck = mapFleetTruckResponse({
      id: "truck-1",
      name: "Volvo FH",
      capacity: 25000,
      plate: "ABC1D23",
      type: "Cavalo",
      axles: 6,
      active: true,
      createdAt: "2026-09-01T12:00:00.000Z",
      codRep: 0,
    });

    assert.strictEqual(truck.id, "truck-1");
    assert.strictEqual(truck.plate, "ABC1D23");
    assert.strictEqual(truck.active, true);
  });
});
