import { AppError } from "../../../utils/AppError";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { assertIbcNotReplaced } from "../services/assertIbcNotReplaced";
import {
  isHomologadoPrefixo,
  isNaoHomologadoPrefixo,
  resolveIbcPrefixo,
  toNaoHomologadoPrefixo,
} from "../services/getIbcIdentifierPrefix";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";

export type ConvertIbcHomologacaoInput = {
  sourceIbcId: string;
  actorId: string;
  observation?: string | null;
};

function toTargetPrefixo(source: IbcCadastroRecord): string {
  const sourcePrefixo = resolveIbcPrefixo(source);
  if (!sourcePrefixo) {
    throw new AppError({
      message: `Identificador inválido para conversão: ${source.identificador}`,
      statusCode: 409,
      code: "IBC_IDENTIFICADOR_INVALIDO",
      details: { identificador: source.identificador },
    });
  }

  if (isNaoHomologadoPrefixo(sourcePrefixo)) {
    throw new AppError({
      message: "IBC já está não homologado",
      statusCode: 409,
      code: "IBC_ALREADY_NON_HOMOLOGATED",
      details: { identificador: source.identificador },
    });
  }

  if (!isHomologadoPrefixo(sourcePrefixo)) {
    throw new AppError({
      message: "Conversão exige prefixo homologado iniciado por HM",
      statusCode: 409,
      code: "IBC_PREFIXO_HOMOLOGADO_INVALIDO",
      details: { identificador: source.identificador, prefixo: sourcePrefixo },
    });
  }

  return toNaoHomologadoPrefixo(sourcePrefixo);
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
    assertIbcNotReplaced(source);

    return this.repository.createDerivedIbcFromSource({
      sourceIbcId: source.id,
      prefixo: toTargetPrefixo(source),
      produtoId: source.produtoId ?? null,
      changeType: "conversion",
      actorId: input.actorId,
      observation: input.observation?.trim() || null,
    });
  }
}
