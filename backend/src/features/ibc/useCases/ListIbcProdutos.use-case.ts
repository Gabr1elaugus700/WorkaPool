import { IIbcProdutoRepository } from "../repositories/IIbcProdutoRepository";
import { IbcProdutoRecord } from "../types/IbcCadastro.types";

export class ListIbcProdutosUseCase {
  private readonly repository: IIbcProdutoRepository;

  constructor(repository: IIbcProdutoRepository) {
    this.repository = repository;
  }

  execute(): Promise<IbcProdutoRecord[]> {
    return this.repository.list();
  }
}
