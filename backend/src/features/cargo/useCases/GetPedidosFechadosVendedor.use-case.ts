import { paginateArray, PaginationParams } from "../../../utils/Paginate";
import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";

export class GetPedidosFechadosVendedorUseCase {
  constructor(
    private readonly pedidosRepository: IPedidosRepository = new PedidosRepository(),
  ) {}

  async execute(codRep?: number, params?: PaginationParams) {
    const pedidos = await this.pedidosRepository.getPedidos(codRep);
    return paginateArray(pedidos, params);
  }
}
