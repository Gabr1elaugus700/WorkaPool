import { AppError } from "../../../utils/AppError";
import { ITrucksRepository } from "../repositories/ITrucksRepository";
import { PrismaTrucksRepository } from "../repositories/PrismaTrucksRepository";
import { TruckRecord } from "../types/Truck.types";

export class GetTruckByIdUseCase {
  constructor(
    private readonly trucksRepository: ITrucksRepository = new PrismaTrucksRepository(),
  ) {}

  async execute(id: string): Promise<TruckRecord> {
    const truck = await this.trucksRepository.findById(id);
    if (!truck) {
      throw new AppError({
        message: `Caminhão ${id} não encontrado`,
        statusCode: 404,
        code: "TRUCK_NOT_FOUND",
        details: { id },
      });
    }
    return truck;
  }
}
