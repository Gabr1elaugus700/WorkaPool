import type {
  IbcAlocacaoAberta,
  IbcInspecaoHistoricoDto,
  IbcInspecaoReprovadaVigente,
} from "../types/IbcInspecao.types";

export interface IIbcInspecaoLeituraRepository {
  /** Mais recente primeiro; respostas com os valores do snapshot. */
  listByIbc(ibcId: string): Promise<IbcInspecaoHistoricoDto[]>;
  /** Em lote: por IBC, as últimas inspeções reprovadas dos checklists ainda vinculados. */
  listUltimasReprovadas(ibcIds: string[]): Promise<IbcInspecaoReprovadaVigente[]>;
  /** Em lote: alocação aberta (sem expedição) por `ibcId`. */
  listAlocacoesAbertas(ibcIds: string[]): Promise<Map<string, IbcAlocacaoAberta>>;
}
