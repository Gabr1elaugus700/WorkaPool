import { AppError } from "../../../utils/AppError";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";

export function ibcJaSubstituidoError(details: Record<string, unknown>): AppError {
  return new AppError({
    message: "IBC já foi substituído por conversão ou mudança de produto",
    statusCode: 409,
    code: "IBC_JA_SUBSTITUIDO",
    details,
  });
}

export function assertIbcNotReplaced(source: IbcCadastroRecord): void {
  if (source.convertedToContainerId) {
    throw ibcJaSubstituidoError({
      identificador: source.identificador,
      convertedToContainerId: source.convertedToContainerId,
    });
  }
}
