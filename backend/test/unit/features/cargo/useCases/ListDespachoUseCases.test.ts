import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { ListMotoristasDespachoUseCase } from "../../../../../src/features/cargo/useCases/ListMotoristasDespacho.use-case";
import { ListTrucksDespachoUseCase } from "../../../../../src/features/cargo/useCases/ListTrucksDespacho.use-case";
import { ICargoRepository } from "../../../../../src/features/cargo/repositories/ICargoRepository";

describe("Listagens para CargaDespacho", () => {
  it("listMotoristas retorna apenas usuários com role MOTORISTA", async () => {
    const listMotoristas = mock.fn(async () => [
      { id: "m1", role: Role.MOTORISTA, name: "João" },
      { id: "m2", role: Role.MOTORISTA, name: "Maria" },
    ]);
    const useCase = new ListMotoristasDespachoUseCase({
      listMotoristas,
    } as unknown as ICargoRepository);

    const result = await useCase.execute();

    assert.strictEqual(result.length, 2);
    assert.ok(result.every((user) => user.role === Role.MOTORISTA));
    assert.strictEqual(listMotoristas.mock.calls.length, 1);
  });

  it("listTrucks retorna caminhões da tabela Trucks", async () => {
    const listTrucks = mock.fn(async () => [
      { id: "t1", name: "Truck A" },
      { id: "t2", name: "Truck B" },
    ]);
    const useCase = new ListTrucksDespachoUseCase({
      listTrucks,
    } as unknown as ICargoRepository);

    const result = await useCase.execute();

    assert.deepStrictEqual(result, [
      { id: "t1", name: "Truck A" },
      { id: "t2", name: "Truck B" },
    ]);
    assert.strictEqual(listTrucks.mock.calls.length, 1);
  });
});
