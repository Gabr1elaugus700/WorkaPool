import { z } from "zod";
import { AppError } from "../../../utils/AppError";
import { IIbcProdutoRepository } from "../repositories/IIbcProdutoRepository";

const uuid = z.string().uuid();

export function ibcProdutoNotFound(id: string): AppError {
  return new AppError({
    message: "Produto de container não encontrado",
    statusCode: 404,
    code: "IBC_PRODUTO_NOT_FOUND",
    details: { id },
  });
}

export async function findIbcProdutoOrThrow(
  produtos: Pick<IIbcProdutoRepository, "findById">,
  produtoId: string,
): Promise<void> {
  if (!uuid.safeParse(produtoId).success) throw ibcProdutoNotFound(produtoId);
  const produto = await produtos.findById(produtoId);
  if (!produto) throw ibcProdutoNotFound(produtoId);
}
