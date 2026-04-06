import { Carga, SituacaoCarga } from "../entities/Carga";
import { Pedido } from "../entities/Pedido";

export interface ICargoRepository {
  createCarga(carga: Carga): Promise<Carga>;
  getCargaById(id: string): Promise<Carga | null>;
  updateCarga(id: string, carga: Carga): Promise<Carga>;
  closeCarga(codCar: number): Promise<{ carga: Carga; pedidosSalvos: number }>;
  deleteCarga(id: string): Promise<void>;
  getPedidosPorCarga(codCar: number): Promise<Pedido[]>;
  updatePedidoCarga(numPed: number, codCar: number, posCar: number): Promise<void>;
  getCargas(situacao?: SituacaoCarga ): Promise<Carga[]>;
  getMaxCodCar(): Promise<number>
  updateSituacaoCarga(codCar: number, situacao: SituacaoCarga): Promise<Carga>;
  getCargaByCodCar(codCar: number): Promise<Carga | null>;
  getCargasFechadas(): Promise<any[]>;
}