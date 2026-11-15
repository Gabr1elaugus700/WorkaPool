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
  ItemAtivoParaInspecao,
  RegistrarIbcInspecaoResult,
} from "../types/IbcInspecao.types";
import { isDataLimiteDue } from "../utils/ibcDataLimite";
import { assertIbcAtivo, IbcLookup } from "./findIbcOrThrow";

export type RespostaInspecaoInput = {
  checklistItemId: string;
  nota?: number;
  resposta?: "SIM" | "NAO";
  observacao?: string;
};

export type RegistrarIbcInspecaoInput = {
  actorRole: Role;
  actorId: string;
  ibcId: string;
  checklistModeloId: string;
  respostas: RespostaInspecaoInput[];
  observacao?: string | null;
};

function unprocessable(code: string, message: string, details: Record<string, unknown>): AppError {
  return new AppError({ message, statusCode: 422, code, details });
}

function badRequest(code: string, message: string, details: Record<string, unknown>): AppError {
  return new AppError({ message, statusCode: 400, code, details });
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
    if (ibc.custodia === "CLIENTE") {
      throw new AppError({
        message: `IBC ${ibc.identificador} está no cliente e não pode ser inspecionado`,
        statusCode: 409,
        code: "IBC_NO_CLIENTE",
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
    const temNumericoAtivo = checklist.itensAtivos.some((item) => item.tipo === "NUMERICO");
    if (
      temNumericoAtivo &&
      (checklist.notaMinimaCritico === null || checklist.mediaMinima === null)
    ) {
      throw unprocessable(
        "IBC_INSPECAO_CHECKLIST_SEM_MINIMAS",
        "O checklist tem item numérico ativo sem nota mínima e média mínima configuradas",
        { checklistModeloId },
      );
    }
    return checklist;
  }
}

function montarRespostas(
  checklist: IbcChecklistParaInspecao,
  respostas: RegistrarIbcInspecaoInput["respostas"],
): IbcInspecaoRespostaDto[] {
  const byId = new Map(respostas.map((r) => [r.checklistItemId, r]));
  const ids = respostas.map((r) => r.checklistItemId);
  const ativos = new Set(checklist.itensAtivos.map((item) => item.checklistItemId));
  const faltantes = [...ativos].filter((id) => !ids.includes(id));
  const estranhos = ids.filter((id) => !ativos.has(id));
  const duplicados = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (faltantes.length > 0 || estranhos.length > 0 || duplicados.length > 0) {
    throw unprocessable(
      "IBC_INSPECAO_RESPOSTAS_INCOMPLETAS",
      "A inspeção precisa de uma resposta para cada item ativo do checklist",
      { faltantes, estranhos, duplicados },
    );
  }

  const itensById = new Map(checklist.itensAtivos.map((item) => [item.checklistItemId, item]));

  return checklist.itensAtivos.map((item) => snapshotResposta(item, byId.get(item.checklistItemId)));
}

function snapshotResposta(
  item: ItemAtivoParaInspecao,
  enviada: RespostaInspecaoInput | undefined,
): IbcInspecaoRespostaDto {
  if (!enviada) {
    throw unprocessable("IBC_INSPECAO_RESPOSTAS_INCOMPLETAS", "Resposta ausente para item ativo", {
      checklistItemId: item.checklistItemId,
    });
  }

  if (item.tipo === "NUMERICO") {
    if (enviada.resposta !== undefined) {
      throw badRequest(
        "IBC_INSPECAO_INVALID_BODY",
        "Item numérico não aceita resposta sim/não",
        { checklistItemId: item.checklistItemId },
      );
    }
    if (enviada.observacao !== undefined) {
      throw badRequest(
        "IBC_INSPECAO_INVALID_BODY",
        "Item numérico não aceita observação por item",
        { checklistItemId: item.checklistItemId },
      );
    }
    if (enviada.nota === undefined) {
      throw unprocessable("IBC_INSPECAO_RESPOSTAS_INCOMPLETAS", "Item numérico exige nota", {
        checklistItemId: item.checklistItemId,
      });
    }
    return {
      checklistItemId: item.checklistItemId,
      descricao: item.descricao,
      tipo: "NUMERICO",
      critico: item.critico,
      nota: enviada.nota,
      resposta: null,
      respostaEsperada: null,
      bloqueante: null,
      observacao: null,
    };
  }

  if (enviada.nota !== undefined) {
    throw badRequest("IBC_INSPECAO_INVALID_BODY", "Item sim/não não aceita nota", {
      checklistItemId: item.checklistItemId,
    });
  }
  if (enviada.resposta === undefined) {
    throw unprocessable("IBC_INSPECAO_RESPOSTAS_INCOMPLETAS", "Item sim/não exige resposta SIM ou NAO", {
      checklistItemId: item.checklistItemId,
    });
  }

  const observacao =
    enviada.observacao === undefined || enviada.observacao.trim() === ""
      ? null
      : enviada.observacao.trim();

  return {
    checklistItemId: item.checklistItemId,
    descricao: item.descricao,
    tipo: "SIM_NAO",
    critico: false,
    nota: null,
    resposta: enviada.resposta,
    respostaEsperada: item.respostaEsperada,
    bloqueante: item.bloqueante,
    observacao,
  };
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