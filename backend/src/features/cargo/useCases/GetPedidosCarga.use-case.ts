import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";


export class GetPedidosCargaUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(new PedidosRepository()),
  ) {}
    async execute(codCar: number) {
    if (codCar == null) {
      throw new Error("Código da carga é obrigatório");
    }
    const pedidos = await this.cargoRepository.getPedidosPorCarga(codCar);
    return pedidos
  }
}