import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { AppError } from "../../../utils/AppError";

export class GetCargaByIdUseCase {
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
    const carga = await this.cargoRepository.getCargaById(codCar.toString());
    if (!carga) {
      throw new AppError({
        message: `Carga ${codCar} não encontrada`,
        statusCode: 404,
        code: "CARGO_NOT_FOUND",
        details: { codCar },
      });
    }
    return carga;
  }
}
