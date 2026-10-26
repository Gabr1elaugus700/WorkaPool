import {
  AlocacaoIbcRecord,
  CargaEmViagem,
  CargaExpedicaoPendente,
  CargaExpedicaoRef,
  CargaPedidoIbcSnapshot,
  CreateAlocacaoIbcData,
  ExpedicaoIbcRecord,
  FecharExpedicaoIbcData,
  IbcParaCompatibilidade,
  IbcPlacaRecord,
  IbcRecord,
} from "../types/IbcExpedicao.types";

export interface IIbcExpedicaoRepository {
  getCargaByCodCar(codCar: number): Promise<CargaExpedicaoRef | null>;
  listCargasPendentesExpedicao(): Promise<CargaExpedicaoPendente[]>;
  listCargasEmViagem(): Promise<CargaEmViagem[]>;
  listPedidosIbcByCargaId(cargaId: string): Promise<CargaPedidoIbcSnapshot[]>;
  findIbcByIdentificador(identificador: string): Promise<IbcRecord | null>;
  markIbcDataLimite(ibcId: string): Promise<IbcRecord>;
  findAlocacaoByIbcId(ibcId: string): Promise<AlocacaoIbcRecord | null>;
  findAlocacaoById(id: string): Promise<AlocacaoIbcRecord | null>;
  listAlocacoesByCargaId(cargaId: string): Promise<AlocacaoIbcRecord[]>;
  listCompatibilidadePorIds(ids: readonly string[]): Promise<IbcParaCompatibilidade[]>;
  /** Ativos, aptos, no pátio, sem alocação aberta; universais ou de um dos grupos. */
  listIbcsLivresPorGrupos(grupos: readonly string[]): Promise<IbcPlacaRecord[]>;
  listPlacasPorIds(ids: readonly string[]): Promise<IbcPlacaRecord[]>;
  findExpedicaoByCargaId(cargaId: string): Promise<ExpedicaoIbcRecord | null>;
  findPlacaByCargaId(cargaId: string): Promise<string | null>;
  createAlocacao(data: CreateAlocacaoIbcData): Promise<AlocacaoIbcRecord>;
  deleteAlocacao(id: string): Promise<void>;
  fecharExpedicao(data: FecharExpedicaoIbcData): Promise<ExpedicaoIbcRecord>;
}
