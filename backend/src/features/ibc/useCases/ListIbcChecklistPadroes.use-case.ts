import { IIbcChecklistPadraoRepository } from "../repositories/IIbcChecklistPadraoRepository";
import { IIbcProdutoRepository } from "../repositories/IIbcProdutoRepository";
import { IbcChecklistPadraoDto } from "../types/IbcChecklist.types";
import { findIbcProdutoOrThrow } from "./findIbcProdutoOrThrow";

export class ListIbcChecklistPadroesUseCase {
  private readonly produtos: Pick<IIbcProdutoRepository, "findById">;
  private readonly padroes: IIbcChecklistPadraoRepository;

  constructor(produtos: Pick<IIbcProdutoRepository, "findById">, padroes: IIbcChecklistPadraoRepository) {
    this.produtos = produtos;
    this.padroes = padroes;
  }

  async execute(produtoId: string): Promise<IbcChecklistPadraoDto[]> {
    await findIbcProdutoOrThrow(this.produtos, produtoId);
    return this.padroes.listByProduto(produtoId);
  }
}
