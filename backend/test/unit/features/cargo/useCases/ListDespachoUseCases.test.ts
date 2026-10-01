import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { ListTrucksDespachoUseCase } from "../../../../../src/features/cargo/useCases/ListTrucksDespacho.use-case";
import { ICargoRepository } from "../../../../../src/features/cargo/repositories/ICargoRepository";

describe("Listagens para CargaDespacho", () => {
  it("listTrucks retorna caminhões da tabela Trucks", async () => {
    const listTrucks = mock.fn(async () => [
      { id: "t1", name: "Truck A", plate: "ABC1D23", active: true },
      { id: "t2", name: "Truck B", plate: "DEF4G56", active: true },
    ]);
    const useCase = new ListTrucksDespachoUseCase({
      listTrucks,
    } as unknown as ICargoRepository);

    const result = await useCase.execute();

    assert.deepStrictEqual(result, [
      { id: "t1", name: "Truck A", plate: "ABC1D23", active: true },
      { id: "t2", name: "Truck B", plate: "DEF4G56", active: true },
    ]);
    assert.strictEqual(listTrucks.mock.calls.length, 1);
  });
});
