import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { AppError } from "../../../utils/AppError";


export class GetPedidosCargaUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(new PedidosRepository()),
  ) {}
    async execute(codCar: number) {
    if (codCar == null) {
      throw new AppError({
        message: "Código da carga é obrigatório",
        statusCode: 400,
        code: "CARGO_COD_CAR_REQUIRED",
        details: { codCar },
      });
    }
    const pedidos = await this.cargoRepository.getPedidosPorCarga(codCar);
    return pedidos
  }
}