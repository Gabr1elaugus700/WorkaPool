import type { Prisma, Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { assertCanOperarEntradaPatio } from "../permissions/assertCanOperarEntradaPatio";
import { IIbcEntradaPatioRepository } from "../repositories/IIbcEntradaPatioRepository";
import {
  AbrirEntradaPersistencia,
  EntradaPatioAberta,
  EntradaPatioOrigem,
  IbcParaAbrirEntrada,
} from "../types/IbcEntradaPatio.types";
import { isDataLimiteDue } from "../utils/ibcDataLimite";

export type AbrirEntradaPatioInput = {
  actorRole: Role;
  actorId: string;
  ibcId: string;
  origem: EntradaPatioOrigem;
};

export class AbrirEntradaPatioUseCase {
  private readonly entradas: IIbcEntradaPatioRepository;
  private readonly now: () => Date;

  constructor(entradas: IIbcEntradaPatioRepository, now: () => Date = () => new Date()) {
    this.entradas = entradas;
    this.now = now;
  }

  /**
   * Abre a entrada no pátio. Passe `db` para participar da transação do Fechar Viagem (#38):
   * IBCs com destino RETORNOU (`origem: RETORNO`) e o `#in` da Troca (`origem: TROCA`).
   */
  async execute(input: AbrirEntradaPatioInput, db?: Prisma.TransactionClient): Promise<EntradaPatioAberta> {
    assertCanOperarEntradaPatio(input.actorRole);
    const abertoEm = this.now();
    return this.entradas.abrir(
      input.ibcId,
      (ibc, jaPendente) => this.decidir(input, ibc, jaPendente, abertoEm),
      db,
    );
  }

  private decidir(
    input: AbrirEntradaPatioInput,
    ibc: IbcParaAbrirEntrada | null,
    jaPendente: boolean,
    abertoEm: Date,
  ): AbrirEntradaPersistencia {
    if (!ibc || ibc.baixadoEm != null) {
      throw new AppError({
        message: "IBC não encontrado",
        statusCode: 404,
        code: "IBC_NOT_FOUND",
        details: { id: input.ibcId },
      });
    }
    if (jaPendente) {
      throw new AppError({
        message: "Este IBC já tem entrada no pátio pendente",
        statusCode: 409,
        code: "IBC_ENTRADA_JA_ABERTA",
        details: { id: ibc.id },
      });
    }
    assertOrigemCompativel(ibc, input.origem);
    return {
      origem: input.origem,
      abertoPorId: input.actorId,
      abertoEm,
      motivoInaptidao: motivoNaAbertura(ibc, abertoEm),
    };
  }
}

function assertOrigemCompativel(ibc: IbcParaAbrirEntrada, origem: EntradaPatioOrigem): void {
  if (origem === "RETORNO") {
    if (ibc.custodia === "EM_VIAGEM") return;
    throw new AppError({
      message: `IBC ${ibc.identificador} não está Em viagem`,
      statusCode: 409,
      code: "IBC_NAO_EM_VIAGEM",
      details: { id: ibc.id, custodia: ibc.custodia },
    });
  }
  const troca = ibc.aquisicao === "TROCA" || ibc.tipoCadastro === "TROCA";
  if (!troca) {
    throw new AppError({
      message: `IBC ${ibc.identificador} não é uma Troca`,
      statusCode: 422,
      code: "IBC_ENTRADA_NAO_E_TROCA",
      details: { id: ibc.id, aquisicao: ibc.aquisicao, tipoCadastro: ibc.tipoCadastro },
    });
  }
  if (ibc.custodia === "PATIO") return;
  throw new AppError({
    message: `IBC ${ibc.identificador} não está no pátio para entrada de Troca`,
    statusCode: 409,
    code: "IBC_ENTRADA_CUSTODIA_INVALIDA",
    details: { id: ibc.id, custodia: ibc.custodia },
  });
}

function motivoNaAbertura(ibc: IbcParaAbrirEntrada, abertoEm: Date): AbrirEntradaPersistencia["motivoInaptidao"] {
  const vencida = ibc.dataLimite != null && isDataLimiteDue(ibc.dataLimite, abertoEm);
  if (ibc.motivoInaptidao === "DATA_LIMITE" || vencida) return "DATA_LIMITE";
  return "AGUARDANDO_INSPECAO";
}
