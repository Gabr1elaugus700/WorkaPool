import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { UpdateTruckUseCase } from "../../../../src/features/trucks/useCases/UpdateTruckUseCase";
import { ITrucksRepository } from "../../../../src/features/trucks/repositories/ITrucksRepository";

describe("UpdateTruckUseCase", () => {
  it("deactivates an active truck", async () => {
    const truckId = "550e8400-e29b-41d4-a716-446655440001";
    const update = mock.fn(async () => ({
      id: truckId,
      name: "Volvo FH",
      capacity: 25000,
      plate: "ABC1D23",
      type: "Cavalo",
      axles: 6,
      active: false,
      createdAt: new Date("2026-09-01T12:00:00.000Z"),
      codRep: 0,
    }));

    const repository = {
      findById: mock.fn(async () => ({
        id: truckId,
        name: "Volvo FH",
        capacity: 25000,
        plate: "ABC1D23",
        type: "Cavalo",
        axles: 6,
        active: true,
        createdAt: new Date("2026-09-01T12:00:00.000Z"),
        codRep: 0,
      })),
      findByPlate: mock.fn(async () => null),
      update,
    } as unknown as ITrucksRepository;

    const useCase = new UpdateTruckUseCase(repository);
    const result = await useCase.execute({ id: truckId, active: false });

    assert.equal(result.active, false);
    assert.equal(update.mock.calls.length, 1);
    assert.deepEqual(update.mock.calls[0]?.arguments[0], {
      id: truckId,
      active: false,
    });
  });
});
