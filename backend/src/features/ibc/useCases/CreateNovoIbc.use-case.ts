import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../types/IbcCadastro.types";
import { AppError } from "../../../utils/AppError";
import {
  CatalogoCadastroLookup,
  ProdutoCadastroLookup,
  ProdutoCadastroResolvido,
  resolverProdutoCadastroIbc,
} from "../services/resolverProdutoCadastroIbc";

export type CreateNovoIbcInput = {
  dataLimite: Date;
  homologado: boolean;
  grupoCodigo?: string | null;
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function comPlaca(item: IbcCadastroRecord, produto: ProdutoCadastroResolvido): IbcCadastroRecord {
  return {
    ...item,
    corHex: produto.corHex,
    universal: produto.universal,
    homologado: produto.homologado,
  };
}

export class CreateNovoIbcUseCase {
  constructor(
    private readonly repository: IIbcCadastroRepository,
    private readonly produtos: ProdutoCadastroLookup,
    private readonly catalogo: CatalogoCadastroLookup,
  ) {}

  async execute(input: CreateNovoIbcInput): Promise<IbcCadastroRecord> {
    const today = startOfUtcDay(new Date());
    const dataLimiteDay = startOfUtcDay(input.dataLimite);
    if (dataLimiteDay < today) {
      throw new AppError({
        message: "Data limite deve ser hoje ou uma data futura",
        statusCode: 400,
        code: "IBC_DATA_LIMITE_INVALIDA",
        details: { dataLimite: input.dataLimite },
      });
    }

    const produto = await resolverProdutoCadastroIbc(input, this.produtos, this.catalogo);
    const [created] = await this.repository.createNovoIbcs(
      {
        prefixo: produto.prefixo,
        tipoCadastro: "NOVO",
        aptidao: "APTO",
        motivoInaptidao: null,
        custodia: "PATIO",
        dataLimite: input.dataLimite,
        primeiraInspecaoEm: null,
        produtoId: produto.produtoId,
      },
      1,
    );
    return comPlaca(created, produto);
  }
}
