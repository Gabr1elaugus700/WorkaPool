import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { paginateArray, PaginationParams } from "../../../utils/Paginate";

export class GetCargasFechadasUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(new PedidosRepository()),
  ) {}

  async execute(params?: PaginationParams) {
    const cargasFechadas = await this.cargoRepository.getCargasFechadas();
    return paginateArray(cargasFechadas, params);
  }
}
