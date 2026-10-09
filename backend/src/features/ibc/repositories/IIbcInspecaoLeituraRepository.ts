import type {
  IbcAlocacaoAberta,
  IbcInspecaoHistoricoDto,
  IbcInspecaoReprovadaVigente,
} from "../types/IbcInspecao.types";

export interface IIbcInspecaoLeituraRepository {
  /** Mais recente primeiro; respostas com os valores do snapshot. */
  listByIbc(ibcId: string): Promise<IbcInspecaoHistoricoDto[]>;
  /** Em lote: por IBC, a última inspeção de cada checklist ainda vinculado, quando ela está reprovada. */
  listUltimasReprovadasVinculadas(ibcIds: string[]): Promise<IbcInspecaoReprovadaVigente[]>;
  /** Em lote: alocação aberta (sem expedição) por `ibcId`. */
  listAlocacoesAbertas(ibcIds: string[]): Promise<Map<string, IbcAlocacaoAberta>>;
}
