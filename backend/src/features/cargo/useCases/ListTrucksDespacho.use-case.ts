import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoTruckRef } from "../types/CargaDespacho.types";

export class ListTrucksDespachoUseCase {
  private readonly cargoRepository: ICargoRepository;

  constructor(cargoRepository?: ICargoRepository) {
    this.cargoRepository = cargoRepository ?? this.createDefaultRepository();
  }

  private createDefaultRepository(): ICargoRepository {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CargoRepository } = require("../repositories/CargoRepository");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PedidosRepository } = require("../../pedidos/repositories/PedidosRepository");
    return new CargoRepository(new PedidosRepository());
  }

  async execute(): Promise<CargoTruckRef[]> {
    return this.cargoRepository.listTrucks();
  }
}
