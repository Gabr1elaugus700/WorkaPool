import { AppError } from "../../../utils/AppError";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";

export type ConvertIbcHomologacaoInput = {
  sourceIbcId: string;
  actorId: string;
  observation?: string | null;
};

function nextIdentifier(currentHighest: string): string {
  const match = /^([A-Z]+)(\d{5})$/.exec(currentHighest);
  if (!match) {
    throw new AppError({
      message: `Identificador inválido para conversão: ${currentHighest}`,
      statusCode: 409,
      code: "IBC_IDENTIFICADOR_INVALIDO",
      details: { identificador: currentHighest },
    });
  }

  const prefix = match[1];
  const next = Number(match[2]) + 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

function toNonHomologatedPrefix(sourceIdentifier: string): string {
  const match = /^([A-Z]+)(\d{5})$/.exec(sourceIdentifier);
  if (!match) {
    throw new AppError({
      message: `Identificador inválido para conversão: ${sourceIdentifier}`,
      statusCode: 409,
      code: "IBC_IDENTIFICADOR_INVALIDO",
      details: { identificador: sourceIdentifier },
    });
  }

  const sourcePrefix = match[1];
  if (sourcePrefix.startsWith("NHM")) {
    throw new AppError({
      message: "IBC já está não homologado",
      statusCode: 409,
      code: "IBC_ALREADY_NON_HOMOLOGATED",
      details: { identificador: sourceIdentifier },
    });
  }

  if (!sourcePrefix.startsWith("HM")) {
    throw new AppError({
      message: "Conversão exige prefixo homologado iniciado por HM",
      statusCode: 409,
      code: "IBC_PREFIXO_HOMOLOGADO_INVALIDO",
      details: { identificador: sourceIdentifier, prefixo: sourcePrefix },
    });
  }

  return `N${sourcePrefix}`;
}

export class ConvertIbcHomologacaoUseCase {
  private readonly repository: IIbcCadastroRepository;

  constructor(repository: IIbcCadastroRepository) {
    this.repository = repository;
  }

  async execute(input: ConvertIbcHomologacaoInput): Promise<IbcCadastroRecord> {
    const source = await this.repository.findById(input.sourceIbcId);
    if (!source) {
      throw new AppError({
        message: "IBC não encontrado",
        statusCode: 404,
        code: "IBC_NOT_FOUND",
        details: { id: input.sourceIbcId },
      });
    }

    const targetPrefix = toNonHomologatedPrefix(source.identificador);
    const highest = await this.repository.findHighestIdentificadorByPrefix(targetPrefix);
    const identificador = highest
      ? nextIdentifier(highest)
      : `${targetPrefix}00001`;

    return this.repository.createDerivedIbcFromSource({
      sourceIbcId: source.id,
      identificador,
      produtoId: source.produtoId ?? null,
      changeType: "conversion",
      actorId: input.actorId,
      observation: input.observation?.trim() || null,
    });
  }
}
