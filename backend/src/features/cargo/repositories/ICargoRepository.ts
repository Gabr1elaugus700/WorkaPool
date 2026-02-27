import { Carga } from "../entities/Carga";
import { Pedido } from "../entities/Pedido";

export interface ICargoRepository {
  createCarga(carga: Carga): Promise<void>;
  getCargaById(id: number): Promise<Carga | null>;
  updateCarga(carga: Carga): Promise<void>;
  deleteCarga(id: number): Promise<void>;
  getPedidosPorCarga(codCar: number): Promise<Pedido[]>;
}