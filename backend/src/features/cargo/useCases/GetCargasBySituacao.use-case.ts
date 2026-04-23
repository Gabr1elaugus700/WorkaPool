import { SituacaoCarga } from "../entities/Carga";
import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { paginateArray, PaginationParams } from "../../../utils/Paginate";

export class GetCargasBySituacaoUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(new PedidosRepository()),
  ) { }

  async execute(situacao: SituacaoCarga, params?: PaginationParams) {
    const cargas = await this.cargoRepository.getCargas(situacao);
    return paginateArray(cargas, params);
  }
}