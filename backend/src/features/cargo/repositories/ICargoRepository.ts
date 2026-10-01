import { Carga, SituacaoCarga } from "../entities/Carga";
import { Pedido } from "../entities/Pedido";
import {
  CargaDespachoRecord,
  CargoTruckRef,
  CargoUserRef,
  CloseCargaDespachoInput,
} from "../types/CargaDespacho.types";

export interface ICargoRepository {
  createCarga(carga: Carga): Promise<Carga>;
  getCargaById(id: string): Promise<Carga | null>;
  updateCarga(id: string, carga: Carga): Promise<Carga>;
  closeCarga(
    input: CloseCargaDespachoInput,
  ): Promise<{ carga: Carga; pedidosSalvos: number; despacho: CargaDespachoRecord }>;
  deleteCarga(id: string): Promise<void>;
  getPedidosPorCarga(codCar: number): Promise<Pedido[]>;
  updatePedidoCarga(numPed: number, codCar: number, posCar: number): Promise<void>;
  getCargas(situacao?: SituacaoCarga): Promise<Carga[]>;
  getMaxCodCar(): Promise<number>;
  updateSituacaoCarga(codCar: number, situacao: SituacaoCarga): Promise<Carga>;
  getCargaByCodCar(codCar: number): Promise<Carga | null>;
  getCargasFechadas(): Promise<
    Array<{
      id: string;
      cargaId: string;
      createdAt: Date;
      carga: {
        id: string;
        codCar: number;
        destino: string;
        pesoMaximo: number;
        situacao: string;
        previsaoSaida: Date;
        closedAt: Date | null;
      };
      pedidos: unknown;
    }>
  >;
  validarCargaSapiens(numPed: number): Promise<boolean>;
  findUserById(id: string): Promise<CargoUserRef | null>;
  findTruckById(id: string): Promise<CargoTruckRef | null>;
  findDespachoByCargaId(cargaId: string): Promise<CargaDespachoRecord | null>;
  listMotoristas(): Promise<CargoUserRef[]>;
  listTrucks(): Promise<CargoTruckRef[]>;
}
