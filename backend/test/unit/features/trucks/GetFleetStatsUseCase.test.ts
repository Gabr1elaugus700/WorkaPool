import test from "node:test";
import assert from "node:assert/strict";
import { GetFleetStatsUseCase } from "../../../../src/features/trucks/useCases/GetFleetStatsUseCase";
import { ITrucksRepository } from "../../../../src/features/trucks/repositories/ITrucksRepository";
import { TruckRecord } from "../../../../src/features/trucks/types/Truck.types";

class StubTrucksRepository implements ITrucksRepository {
  async getFleetStats() {
    return { trucksOnTrip: 2 };
  }

  async create() {
    throw new Error("not implemented");
  }

  async findById(): Promise<TruckRecord | null> {
    throw new Error("not implemented");
  }

  async findByPlate(): Promise<TruckRecord | null> {
    throw new Error("not implemented");
  }

  async list(): Promise<TruckRecord[]> {
    throw new Error("not implemented");
  }

  async update(): Promise<TruckRecord> {
    throw new Error("not implemented");
  }
}

test("GetFleetStatsUseCase returns trucks on trip count", async () => {
  const useCase = new GetFleetStatsUseCase(new StubTrucksRepository());
  const stats = await useCase.execute();
  assert.equal(stats.trucksOnTrip, 2);
});
