import { AppError } from "../../../utils/AppError";
import {
  IIbcProdutoRepository,
} from "../repositories/IIbcProdutoRepository";
import { normalizeIbcProdutoAbreviacao } from "../services/normalizeIbcProdutoAbreviacao";
import { IbcProdutoRecord } from "../types/IbcCadastro.types";

export type CreateIbcProdutoInput = {
  nome: string;
  abreviacao: string;
};

export class CreateIbcProdutoUseCase {
  private readonly repository: IIbcProdutoRepository;

  constructor(repository: IIbcProdutoRepository) {
    this.repository = repository;
  }

  async execute(input: CreateIbcProdutoInput): Promise<IbcProdutoRecord> {
    const nome = input.nome.trim();
    if (!nome) {
      throw new AppError({
        message: "Nome do produto é obrigatório",
        statusCode: 400,
        code: "IBC_PRODUTO_NOME_REQUIRED",
      });
    }
    const abreviacao = normalizeIbcProdutoAbreviacao(input.abreviacao);
    return this.repository.create({ nome, abreviacao });
  }
}
