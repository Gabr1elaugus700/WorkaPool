import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { CreateTruckUseCase } from "../../../../src/features/trucks/useCases/CreateTruckUseCase";
import { ITrucksRepository } from "../../../../src/features/trucks/repositories/ITrucksRepository";
import { AppError } from "../../../../src/utils/AppError";

describe("CreateTruckUseCase", () => {
  it("rejeita placa duplicada antes de persistir", async () => {
    const create = mock.fn(async () => {
      throw new Error("create não deve ser chamado");
    });
    const repository = {
      findByPlate: mock.fn(async () => ({
        id: "existing",
        name: "Truck",
        capacity: 1000,
        plate: "ABC1D23",
        type: null,
        axles: null,
        active: true,
        createdAt: new Date(),
        codRep: 0,
      })),
      create,
    } as unknown as ITrucksRepository;

    const useCase = new CreateTruckUseCase(repository);

    await assert.rejects(
      async () =>
        useCase.execute({
          name: "Volvo",
          capacity: 25000,
          plate: "ABC1D23",
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.statusCode, 409);
        assert.strictEqual(error.code, "TRUCK_PLATE_CONFLICT");
        return true;
      },
    );

    assert.strictEqual(create.mock.calls.length, 0);
  });

  it("cria caminhão quando placa está disponível", async () => {
    const createdAt = new Date("2026-09-01T12:00:00.000Z");
    const create = mock.fn(async () => ({
      id: "truck-1",
      name: "Volvo FH",
      capacity: 25000,
      plate: "ABC1D23",
      type: "Cavalo",
      axles: 6,
      active: true,
      createdAt,
      codRep: 0,
    }));
    const repository = {
      findByPlate: mock.fn(async () => null),
      create,
    } as unknown as ITrucksRepository;

    const useCase = new CreateTruckUseCase(repository);
    const result = await useCase.execute({
      name: "Volvo FH",
      capacity: 25000,
      plate: "ABC1D23",
      type: "Cavalo",
      axles: 6,
    });

    assert.strictEqual(result.id, "truck-1");
    assert.strictEqual(create.mock.calls.length, 1);
  });
});
