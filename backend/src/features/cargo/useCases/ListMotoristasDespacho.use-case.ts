import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { CargoUserRef } from "../types/CargaDespacho.types";

export class ListMotoristasDespachoUseCase {
  private readonly cargoRepository: ICargoRepository;

  constructor(cargoRepository?: ICargoRepository) {
    this.cargoRepository = cargoRepository ?? this.createDefaultRepository();
  }

  private createDefaultRepository(): ICargoRepository {
    return new CargoRepository(new PedidosRepository());
  }

  async execute(): Promise<CargoUserRef[]> {
    return this.cargoRepository.listMotoristas();
  }
}
