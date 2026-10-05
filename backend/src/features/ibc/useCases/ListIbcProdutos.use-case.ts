import { IIbcProdutoRepository } from "../repositories/IIbcProdutoRepository";
import { IbcProdutoListItem } from "../types/IbcCadastro.types";

export class ListIbcProdutosUseCase {
  private readonly repository: IIbcProdutoRepository;

  constructor(repository: IIbcProdutoRepository) {
    this.repository = repository;
  }

  execute(): Promise<IbcProdutoListItem[]> {
    return this.repository.list();
  }
}
