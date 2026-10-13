import type { Prisma, Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { assertCanOperarEntradaPatio } from "../permissions/assertCanOperarEntradaPatio";
import { IIbcEntradaPatioRepository } from "../repositories/IIbcEntradaPatioRepository";
import { resolverAptidaoIbc } from "../services/resolverAptidaoIbc";
import {
  ConclusaoEntradaPersistencia,
  EntradaParaConcluir,
  EntradaPatioConcluida,
  InspecaoDaEntrada,
} from "../types/IbcEntradaPatio.types";
import type { IbcInspecaoResultado } from "../types/IbcInspecao.types";
import { isDataLimiteDue } from "../utils/ibcDataLimite";

export type ConcluirEntradaPatioInput = {
  actorRole: Role;
  actorId: string;
  ibcId: string;
};

export class ConcluirEntradaPatioUseCase {
  private readonly entradas: IIbcEntradaPatioRepository;
  private readonly now: () => Date;

  constructor(entradas: IIbcEntradaPatioRepository, now: () => Date = () => new Date()) {
    this.entradas = entradas;
    this.now = now;
  }

  async execute(input: ConcluirEntradaPatioInput, db?: Prisma.TransactionClient): Promise<EntradaPatioConcluida> {
    assertCanOperarEntradaPatio(input.actorRole);
    const concluidoEm = this.now();
    return this.entradas.concluir(
      input.ibcId,
      (entrada) => this.decidir(input, entrada, concluidoEm),
      db,
    );
  }

  private decidir(
    input: ConcluirEntradaPatioInput,
    entrada: EntradaParaConcluir | null,
    concluidoEm: Date,
  ): ConclusaoEntradaPersistencia {
    if (!entrada) {
      throw new AppError({
        message: "Este IBC não tem entrada no pátio pendente",
        statusCode: 404,
        code: "IBC_ENTRADA_NAO_ENCONTRADA",
        details: { id: input.ibcId },
      });
    }
    if (entrada.baixadoEm != null) {
      throw new AppError({
        message: "IBC não encontrado",
        statusCode: 404,
        code: "IBC_NOT_FOUND",
        details: { id: input.ibcId },
      });
    }
    if (entrada.checklistsAtivos.length === 0) {
      throw new AppError({
        message: "Vincule ao menos um checklist ativo antes de concluir a entrada",
        statusCode: 422,
        code: "IBC_ENTRADA_SEM_CHECKLIST",
        details: { id: entrada.ibcId },
      });
    }
    const ultimas = ultimasInspecoes(entrada.inspecoes);
    const faltantes = entrada.checklistsAtivos.filter((checklist) => !ultimas.has(checklist.checklistModeloId));
    if (faltantes.length > 0) {
      throw new AppError({
        message: "Cada checklist ativo precisa de inspeção depois da abertura da entrada",
        statusCode: 422,
        code: "IBC_ENTRADA_INSPECAO_PENDENTE",
        details: { id: entrada.ibcId, faltantes },
      });
    }
    const aptidao = resolverAptidaoIbc({
      motivoAtual: entrada.motivoInaptidao,
      dataLimiteVencida: entrada.dataLimite != null && isDataLimiteDue(entrada.dataLimite, concluidoEm),
      ultimasPorChecklistVinculado: entrada.checklistsAtivos.map(
        (checklist) => ultimas.get(checklist.checklistModeloId) ?? "REPROVADA",
      ),
    });
    return { entradaId: entrada.id, concluidoPorId: input.actorId, concluidoEm, ...aptidao };
  }
}

function ultimasInspecoes(inspecoes: InspecaoDaEntrada[]): Map<string, IbcInspecaoResultado> {
  const ordered = [...inspecoes].sort((a, b) => b.inspecionadoEm.getTime() - a.inspecionadoEm.getTime());
  const ultimas = new Map<string, IbcInspecaoResultado>();
  for (const inspecao of ordered) {
    if (!ultimas.has(inspecao.checklistModeloId)) ultimas.set(inspecao.checklistModeloId, inspecao.resultado);
  }
  return ultimas;
}
