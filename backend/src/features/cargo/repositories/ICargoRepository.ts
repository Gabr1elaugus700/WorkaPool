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
  getPedidos(codRep?: number): Promise<Pedido[]>;
  getPedidosWeight(numPed?: number): Promise<{ numPed: number; peso: number }>;
  getMaxCodCar(): Promise<number>
  updateSituacaoCarga(codCar: number, situacao: SituacaoCarga): Promise<Carga>;
  getCargaByCodCar(codCar: number): Promise<Carga | null>;
  createHistoricoPesoPedido(numPed: number, cargaId: string, peso: number): Promise<void>;
  getLastHistoricoPesoPedido(numPed: number): Promise<{ peso: number; codCar: number; numPed: number; createdAt: Date } | null>;
  getCargasFechadas(): Promise<any[]>;
  getPedidoCargaSapiens(numPed: number): Promise<{ numPed: number; sitPed: number }>;
}