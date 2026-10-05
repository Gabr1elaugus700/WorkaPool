import { AppError } from "../../../utils/AppError";
import { IIbcProdutoRepository } from "../repositories/IIbcProdutoRepository";
import { normalizeIbcProdutoAbreviacao } from "../services/normalizeIbcProdutoAbreviacao";
import { IbcProdutoRecord } from "../types/IbcCadastro.types";

export type UpdateIbcProdutoInput = {
  id: string;
  nome: string;
  abreviacao: string;
};

export class UpdateIbcProdutoUseCase {
  private readonly repository: IIbcProdutoRepository;

  constructor(repository: IIbcProdutoRepository) {
    this.repository = repository;
  }

  async execute(input: UpdateIbcProdutoInput): Promise<IbcProdutoRecord> {
    const existing = await this.repository.findById(input.id);
    if (!existing) {
      throw new AppError({
        message: "Produto de container não encontrado",
        statusCode: 404,
        code: "IBC_PRODUTO_NOT_FOUND",
      });
    }

    const nome = input.nome.trim();
    if (!nome) {
      throw new AppError({
        message: "Nome do produto é obrigatório",
        statusCode: 400,
        code: "IBC_PRODUTO_NOME_REQUIRED",
      });
    }
    const abreviacao = normalizeIbcProdutoAbreviacao(input.abreviacao);

    if (abreviacao !== existing.abreviacao && (await this.repository.hasIbcs(input.id))) {
      throw new AppError({
        message:
          "Sigla não pode ser alterada: produto já possui containers vinculados. Cadastre um novo produto e use a mudança de produto.",
        statusCode: 409,
        code: "IBC_PRODUTO_ABREVIACAO_EM_USO",
        details: { abreviacaoAtual: existing.abreviacao },
      });
    }

    return this.repository.updateById(input.id, { nome, abreviacao });
  }
}
