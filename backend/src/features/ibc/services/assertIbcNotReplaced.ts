import { AppError } from "../../../utils/AppError";

type IbcReplacementSource = {
  identificador: string;
  convertedToContainerId?: string | null;
};

const IBC_JA_SUBSTITUIDO_MESSAGE =
  "IBC já foi substituído por conversão ou mudança de produto";

const IBC_SUBSTITUIDO_MESSAGE =
  "Este IBC foi substituído e não pode ser alocado. Use o identificador do IBC novo.";

export function ibcJaSubstituidoError(details: Record<string, unknown>): AppError {
  return new AppError({
    message: IBC_JA_SUBSTITUIDO_MESSAGE,
    statusCode: 409,
    code: "IBC_JA_SUBSTITUIDO",
    details,
  });
}

/**
 * Bloqueia origem já vinculada. Conversão/mudança de produto usa
 * `IBC_JA_SUBSTITUIDO`; alocação usa `IBC_SUBSTITUIDO`.
 */
export function assertIbcNotReplaced(
  source: IbcReplacementSource,
  code: "IBC_JA_SUBSTITUIDO" | "IBC_SUBSTITUIDO" = "IBC_JA_SUBSTITUIDO",
): void {
  if (!source.convertedToContainerId) return;

  const details = {
    identificador: source.identificador,
    convertedToContainerId: source.convertedToContainerId,
  };
  if (code === "IBC_SUBSTITUIDO") {
    throw new AppError({
      message: IBC_SUBSTITUIDO_MESSAGE,
      statusCode: 409,
      code,
      details,
    });
  }
  throw ibcJaSubstituidoError(details);
}
