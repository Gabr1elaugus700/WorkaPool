import { PedidoCargo } from "../../pedidos/types/PedidoCargo.types";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  CreateAlocacaoIbcData,
  ExpedicaoIbcRecord,
  FecharExpedicaoIbcData,
  IbcRecord,
} from "../types/IbcExpedicao.types";

export interface IIbcExpedicaoRepository {
  getCargaByCodCar(codCar: number): Promise<CargaExpedicaoRef | null>;
  listCargasAbertaOuFechada(): Promise<CargaExpedicaoRef[]>;
  getPedidosByCarga(codCar: number): Promise<PedidoCargo[]>;
  findIbcByIdentificador(identificador: string): Promise<IbcRecord | null>;
  findAlocacaoByIbcId(ibcId: string): Promise<AlocacaoIbcRecord | null>;
  findAlocacaoById(id: string): Promise<AlocacaoIbcRecord | null>;
  countAlocacoesByCargaAndNumPed(
    cargaId: string,
    numPed: string,
  ): Promise<number>;
  listAlocacoesByCargaId(cargaId: string): Promise<AlocacaoIbcRecord[]>;
  findExpedicaoByCargaId(cargaId: string): Promise<ExpedicaoIbcRecord | null>;
  createAlocacao(data: CreateAlocacaoIbcData): Promise<AlocacaoIbcRecord>;
  deleteAlocacao(id: string): Promise<void>;
  fecharExpedicao(data: FecharExpedicaoIbcData): Promise<ExpedicaoIbcRecord>;
}
