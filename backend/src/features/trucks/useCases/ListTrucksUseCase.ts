import { ITrucksRepository } from "../repositories/ITrucksRepository";
import { PrismaTrucksRepository } from "../repositories/PrismaTrucksRepository";
import { ListTrucksFilter, TruckRecord } from "../types/Truck.types";

export class ListTrucksUseCase {
  constructor(
    private readonly trucksRepository: ITrucksRepository = new PrismaTrucksRepository(),
  ) {}

  async execute(filter?: ListTrucksFilter): Promise<TruckRecord[]> {
    return this.trucksRepository.list(filter);
  }
}
