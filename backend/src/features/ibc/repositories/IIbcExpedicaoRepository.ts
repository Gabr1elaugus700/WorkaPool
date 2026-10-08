import {
  AlocacaoIbcRecord,
  CargaExpedicaoPendente,
  CargaExpedicaoRef,
  CargaPedidoIbcSnapshot,
  CreateAlocacaoIbcData,
  ExpedicaoIbcRecord,
  FecharExpedicaoIbcData,
  IbcRecord,
} from "../types/IbcExpedicao.types";

export interface IIbcExpedicaoRepository {
  getCargaByCodCar(codCar: number): Promise<CargaExpedicaoRef | null>;
  listCargasPendentesExpedicao(): Promise<CargaExpedicaoPendente[]>;
  listPedidosIbcByCargaId(cargaId: string): Promise<CargaPedidoIbcSnapshot[]>;
  findIbcByIdentificador(identificador: string): Promise<IbcRecord | null>;
  markIbcDataLimite(ibcId: string): Promise<IbcRecord>;
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
