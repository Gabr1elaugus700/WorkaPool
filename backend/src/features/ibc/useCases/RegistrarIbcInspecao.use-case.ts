import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { assertCanManageIbcChecklists } from "../permissions/assertCanManageIbcChecklists";
import {
  IbcEstadoParaAptidao,
  IbcAptidaoAtualizacao,
  IIbcInspecaoRepository,
} from "../repositories/IIbcInspecaoRepository";
import { avaliarInspecaoIbc } from "../services/avaliarInspecaoIbc";
import { resolverAptidaoIbc } from "../services/resolverAptidaoIbc";
import {
  IbcChecklistParaInspecao,
  IbcInspecaoRespostaDto,
  IbcInspecaoResultado,
  RegistrarIbcInspecaoResult,
} from "../types/IbcInspecao.types";
import { isDataLimiteDue } from "../utils/ibcDataLimite";
import { assertIbcAtivo, IbcLookup } from "./findIbcOrThrow";

export type RegistrarIbcInspecaoInput = {
  actorRole: Role;
  actorId: string;
  ibcId: string;
  checklistModeloId: string;
  respostas: Array<{ checklistItemId: string; nota: number }>;
  observacao?: string | null;
};

function unprocessable(code: string, message: string, details: Record<string, unknown>): AppError {
  return new AppError({ message, statusCode: 422, code, details });
}

export class RegistrarIbcInspecaoUseCase {
  private readonly ibcs: IbcLookup;
  private readonly inspecoes: IIbcInspecaoRepository;
  private readonly now: () => Date;

  constructor(ibcs: IbcLookup, inspecoes: IIbcInspecaoRepository, now: () => Date = () => new Date()) {
    this.ibcs = ibcs;
    this.inspecoes = inspecoes;
    this.now = now;
  }

  async execute(input: RegistrarIbcInspecaoInput): Promise<RegistrarIbcInspecaoResult> {
    assertCanManageIbcChecklists(input.actorRole);
    await this.assertIbcInspecionavel(input.ibcId);
    const checklist = await this.findChecklistAtivo(input.ibcId, input.checklistModeloId);
    const respostas = montarRespostas(checklist, input.respostas);
    const { resultado, mediaObtida } = avaliarInspecaoIbc({
      respostas,
      notaMinimaCritico: checklist.notaMinimaCritico,
      mediaMinima: checklist.mediaMinima,
    });

    const inspecionadoEm = this.now();
    const registrada = await this.inspecoes.registrar(
      {
        ibcId: input.ibcId,
        checklistModeloId: input.checklistModeloId,
        resultado,
        mediaObtida,
        notaMinimaCritico: checklist.notaMinimaCritico,
        mediaMinima: checklist.mediaMinima,
        inspetorId: input.actorId,
        inspecionadoEm,
        observacao: input.observacao ?? null,
        respostas,
      },
      (estado) => recalcularAptidao(estado, resultado, inspecionadoEm),
    );

    if (resultado === "APROVADA") return registrada;
    const alocacao = await this.inspecoes.findAlocacaoAberta(input.ibcId);
    return alocacao ? { ...registrada, aviso: { code: "IBC_ALOCADO_INAPTO", ...alocacao } } : registrada;
  }

  private async assertIbcInspecionavel(ibcId: string): Promise<void> {
    const ibc = await assertIbcAtivo(this.ibcs, ibcId);
    if (ibc.custodia === "EM_VIAGEM") {
      throw new AppError({
        message: `IBC ${ibc.identificador} está Em viagem e não pode ser inspecionado`,
        statusCode: 409,
        code: "IBC_EM_VIAGEM",
        details: { id: ibcId, custodia: ibc.custodia },
      });
    }
  }

  private async findChecklistAtivo(ibcId: string, checklistModeloId: string): Promise<IbcChecklistParaInspecao> {
    const checklist = await this.inspecoes.findChecklistVinculado(ibcId, checklistModeloId);
    if (!checklist) {
      throw unprocessable("IBC_CHECKLIST_NAO_VINCULADO", "Checklist não está vinculado a este IBC", { checklistModeloId });
    }
    if (!checklist.ativo) {
      throw unprocessable("IBC_CHECKLIST_INATIVO", "Checklist inativo não pode ser usado na inspeção", { checklistModeloId });
    }
    return checklist;
  }
}

function montarRespostas(
  checklist: IbcChecklistParaInspecao,
  respostas: RegistrarIbcInspecaoInput["respostas"],
): IbcInspecaoRespostaDto[] {
  const ids = respostas.map((r) => r.checklistItemId);
  const ativos = new Set(checklist.itensAtivos.map((item) => item.checklistItemId));
  const faltantes = [...ativos].filter((id) => !ids.includes(id));
  const estranhos = ids.filter((id) => !ativos.has(id));
  const duplicados = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (faltantes.length > 0 || estranhos.length > 0 || duplicados.length > 0) {
    throw unprocessable(
      "IBC_INSPECAO_RESPOSTAS_INCOMPLETAS",
      "A inspeção precisa de uma nota para cada item ativo do checklist",
      { faltantes, estranhos, duplicados },
    );
  }
  const notas = new Map(respostas.map((r) => [r.checklistItemId, r.nota]));
  return checklist.itensAtivos.map((item) => ({ ...item, nota: notas.get(item.checklistItemId) ?? 0 }));
}

function recalcularAptidao(
  estado: IbcEstadoParaAptidao,
  resultado: IbcInspecaoResultado,
  inspecionadoEm: Date,
): IbcAptidaoAtualizacao {
  const aptidao = resolverAptidaoIbc({
    motivoAtual: estado.motivoInaptidao,
    dataLimiteVencida: estado.dataLimite != null && isDataLimiteDue(estado.dataLimite, inspecionadoEm),
    ultimasPorChecklistVinculado: estado.ultimasPorChecklistVinculado,
  });
  const primeiraInspecaoEm =
    estado.primeiraInspecaoEm ?? (resultado === "APROVADA" ? inspecionadoEm : null);
  return { ...aptidao, primeiraInspecaoEm };
}
