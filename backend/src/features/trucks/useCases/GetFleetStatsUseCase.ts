import { ITrucksRepository } from "../repositories/ITrucksRepository";
import { PrismaTrucksRepository } from "../repositories/PrismaTrucksRepository";
import { FleetStats } from "../types/Truck.types";

export class GetFleetStatsUseCase {
  constructor(
    private readonly trucksRepository: ITrucksRepository = new PrismaTrucksRepository(),
  ) {}

  async execute(): Promise<FleetStats> {
    return this.trucksRepository.getFleetStats();
  }
}
