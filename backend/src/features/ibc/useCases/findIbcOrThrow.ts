import { AppError } from "../../../utils/AppError";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";

export type IbcLookup = Pick<IIbcCadastroRepository, "findById">;

export async function findIbcOrThrow(ibcs: IbcLookup, id: string): Promise<IbcCadastroRecord> {
  const ibc = await ibcs.findById(id);
  if (!ibc) {
    throw new AppError({
      message: "IBC não encontrado",
      statusCode: 404,
      code: "IBC_NOT_FOUND",
      details: { id },
    });
  }
  return ibc;
}
