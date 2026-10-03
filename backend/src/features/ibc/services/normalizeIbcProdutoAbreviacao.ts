import { AppError } from "../../../utils/AppError";

export function normalizeIbcProdutoAbreviacao(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (normalized.length < 1 || normalized.length > 2) {
    throw new AppError({
      message: "Abreviação deve ter de 1 a 2 caracteres",
      statusCode: 400,
      code: "IBC_PRODUTO_ABREVIACAO_INVALIDA",
      details: { abreviacao: value },
    });
  }

  if (!/^[A-Z]{1,2}$/.test(normalized)) {
    throw new AppError({
      message: "Abreviação deve conter apenas letras de A a Z",
      statusCode: 400,
      code: "IBC_PRODUTO_ABREVIACAO_INVALIDA",
      details: { abreviacao: value },
    });
  }

  return normalized;
}
