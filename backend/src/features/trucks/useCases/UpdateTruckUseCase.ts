import { AppError } from "../../../utils/AppError";
import { ITrucksRepository } from "../repositories/ITrucksRepository";
import { PrismaTrucksRepository } from "../repositories/PrismaTrucksRepository";
import { TruckRecord, UpdateTruckInput } from "../types/Truck.types";

export class UpdateTruckUseCase {
  constructor(
    private readonly trucksRepository: ITrucksRepository = new PrismaTrucksRepository(),
  ) {}

  async execute(input: UpdateTruckInput): Promise<TruckRecord> {
    const existing = await this.trucksRepository.findById(input.id);
    if (!existing) {
      throw new AppError({
        message: `Caminhão ${input.id} não encontrado`,
        statusCode: 404,
        code: "TRUCK_NOT_FOUND",
        details: { id: input.id },
      });
    }

    if (input.plate && input.plate.toUpperCase() !== existing.plate) {
      const plateTaken = await this.trucksRepository.findByPlate(input.plate);
      if (plateTaken && plateTaken.id !== input.id) {
        throw new AppError({
          message: "Já existe um caminhão com esta placa",
          statusCode: 409,
          code: "TRUCK_PLATE_CONFLICT",
          details: { plate: input.plate },
        });
      }
    }

    return this.trucksRepository.update(input);
  }
}
