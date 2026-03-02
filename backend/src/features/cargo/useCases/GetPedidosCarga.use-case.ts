import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";


export class GetPedidosCargaUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}
    async execute(codCar: number) {
    if (codCar == null) {
      throw new Error("Código da carga é obrigatório");
    }
    const pedidos = await this.cargoRepository.getPedidosPorCarga(codCar);
    return pedidos
  }
}