import { IbcProdutoRecord } from "../types/IbcCadastro.types";

export interface IIbcProdutoRepository {
  findById(id: string): Promise<IbcProdutoRecord | null>;
}
