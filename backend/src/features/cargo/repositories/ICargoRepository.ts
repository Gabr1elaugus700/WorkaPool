import { Carga, SituacaoCarga } from "../entities/Carga";
import { Pedido } from "../entities/Pedido";

export interface ICargoRepository {
  createCarga(carga: Carga): Promise<Carga>;
  getCargaById(id: string): Promise<Carga | null>;
  updateCarga(id: string, carga: Carga): Promise<Carga>;
  deleteCarga(id: string): Promise<void>;
  getPedidosPorCarga(codCar: number): Promise<Pedido[]>;
  updatePedidoCarga(numPed: number, codCar: number, posCar: number): Promise<void>;
  listarAbertas(): Promise<Carga[]>;
  getPedidosFechadosPorVendedor(codRep: number): Promise<Pedido[]>;
  getMaxCodCar(): Promise<number>;
  updateSituacaoCarga(codCar: number, situacao: SituacaoCarga): Promise<Carga>;

}