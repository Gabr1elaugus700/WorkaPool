import type { IbcMotivoInaptidao } from "../types/IbcCadastro.types";
import type {
  IbcAlocacaoAberta,
  IbcAptidao,
  IbcAptidaoSnapshot,
  IbcChecklistParaInspecao,
  IbcInspecaoDto,
  IbcInspecaoRespostaDto,
  IbcInspecaoResultado,
} from "../types/IbcInspecao.types";

export type CreateIbcInspecaoData = {
  ibcId: string;
  checklistModeloId: string;
  resultado: IbcInspecaoResultado;
  mediaObtida: number | null;
  notaMinimaCritico: number;
  mediaMinima: number;
  inspetorId: string;
  inspecionadoEm: Date;
  observacao: string | null;
  respostas: IbcInspecaoRespostaDto[];
};

/** Estado do IBC lido com a linha travada, já incluindo a inspeção recém-gravada. */
export type IbcEstadoParaAptidao = {
  motivoInaptidao: IbcMotivoInaptidao | null;
  dataLimite: Date | null;
  primeiraInspecaoEm: Date | null;
  ultimasPorChecklistVinculado: IbcInspecaoResultado[];
};

export type IbcAptidaoAtualizacao = IbcAptidao & { primeiraInspecaoEm: Date | null };

export type RecalcularAptidaoIbc = (estado: IbcEstadoParaAptidao) => IbcAptidaoAtualizacao;

export interface IIbcInspecaoRepository {
  /** Retorna `null` quando o checklist não está vinculado ao IBC. */
  findChecklistVinculado(ibcId: string, checklistModeloId: string): Promise<IbcChecklistParaInspecao | null>;
  findAlocacaoAberta(ibcId: string): Promise<IbcAlocacaoAberta | null>;
  /**
   * Numa única transação, com `SELECT ... FOR UPDATE` na linha do `Ibc`: grava a inspeção,
   * chama `recalcular` com o estado travado e persiste a aptidão retornada.
   */
  registrar(
    data: CreateIbcInspecaoData,
    recalcular: RecalcularAptidaoIbc,
  ): Promise<{ inspecao: IbcInspecaoDto; ibc: IbcAptidaoSnapshot }>;
}
