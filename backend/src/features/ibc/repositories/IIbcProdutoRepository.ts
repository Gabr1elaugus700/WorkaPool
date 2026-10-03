import { IbcProdutoRecord } from "../types/IbcCadastro.types";

export type CreateIbcProdutoData = {
  nome: string;
  abreviacao: string;
};

export interface IIbcProdutoRepository {
  create(data: CreateIbcProdutoData): Promise<IbcProdutoRecord>;
  list(): Promise<IbcProdutoRecord[]>;
  findById(id: string): Promise<IbcProdutoRecord | null>;
}
