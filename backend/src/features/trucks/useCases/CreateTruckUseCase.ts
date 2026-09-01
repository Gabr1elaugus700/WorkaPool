import { AppError } from "../../../utils/AppError";
import { ITrucksRepository } from "../repositories/ITrucksRepository";
import { PrismaTrucksRepository } from "../repositories/PrismaTrucksRepository";
import { CreateTruckInput, TruckRecord } from "../types/Truck.types";

export class CreateTruckUseCase {
  constructor(
    private readonly trucksRepository: ITrucksRepository = new PrismaTrucksRepository(),
  ) {}

  async execute(input: CreateTruckInput): Promise<TruckRecord> {
    const existing = await this.trucksRepository.findByPlate(input.plate);
    if (existing) {
      throw new AppError({
        message: "Já existe um caminhão com esta placa",
        statusCode: 409,
        code: "TRUCK_PLATE_CONFLICT",
        details: { plate: input.plate },
      });
    }

    return this.trucksRepository.create(input);
  }
}
