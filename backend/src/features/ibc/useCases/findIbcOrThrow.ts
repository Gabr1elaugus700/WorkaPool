import { AppError } from "../../../utils/AppError";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";

export type IbcLookup = Pick<IIbcCadastroRepository, "findById">;

function ibcNotFound(id: string): AppError {
  return new AppError({
    message: "IBC não encontrado",
    statusCode: 404,
    code: "IBC_NOT_FOUND",
    details: { id },
  });
}

export async function findIbcOrThrow(ibcs: IbcLookup, id: string): Promise<IbcCadastroRecord> {
  const ibc = await ibcs.findById(id);
  if (!ibc) throw ibcNotFound(id);
  return ibc;
}

export async function assertIbcAtivo(ibcs: IbcLookup, id: string): Promise<void> {
  const ibc = await findIbcOrThrow(ibcs, id);
  if (ibc.baixadoEm != null) throw ibcNotFound(id);
}
