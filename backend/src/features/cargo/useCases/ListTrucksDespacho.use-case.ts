import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { CargoTruckRef } from "../types/CargaDespacho.types";

export class ListTrucksDespachoUseCase {
  private readonly cargoRepository: ICargoRepository;

  constructor(cargoRepository?: ICargoRepository) {
    this.cargoRepository = cargoRepository ?? this.createDefaultRepository();
  }

  private createDefaultRepository(): ICargoRepository {
    return new CargoRepository(new PedidosRepository());
  }

  async execute(): Promise<CargoTruckRef[]> {
    return this.cargoRepository.listTrucks();
  }
}
