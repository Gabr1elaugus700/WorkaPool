import { IbcProdutoListItem, IbcProdutoRecord } from "../types/IbcCadastro.types";

export type CreateIbcProdutoData = {
  nome: string;
  abreviacao: string;
};

export type UpdateIbcProdutoData = {
  nome?: string;
  abreviacao?: string;
};

export interface IIbcProdutoRepository {
  create(data: CreateIbcProdutoData): Promise<IbcProdutoRecord>;
  list(): Promise<IbcProdutoListItem[]>;
  findById(id: string): Promise<IbcProdutoRecord | null>;
  hasIbcs(produtoId: string): Promise<boolean>;
  updateById(id: string, data: UpdateIbcProdutoData): Promise<IbcProdutoRecord>;
}
