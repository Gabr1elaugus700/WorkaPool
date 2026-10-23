import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { ISaldoIbcErp } from "../ports/ISaldoIbcErp";
import {
  IbcCadastroRecord,
  IbcLoteRecord,
} from "../types/IbcCadastro.types";
import { AppError } from "../../../utils/AppError";
import {
  CatalogoCadastroLookup,
  ProdutoCadastroLookup,
  ProdutoCadastroResolvido,
  resolverProdutoCadastroIbc,
} from "../services/resolverProdutoCadastroIbc";

export const IBC_LOTE_QUANTIDADE_BOUNDS = {
  min: 1,
  max: 200,
} as const;

export type CreateLoteIbcInput = {
  quantidade: number;
  dataLimite: Date;
  numeroNf?: string | null;
  homologado: boolean;
  grupoCodigo?: string | null;
};

export type LoteSaldoWarning =
  | {
      code: "OVER_SALDO";
      vivos: number;
      quantidade: number;
      saldo: number;
    }
  | {
      code: "SALDO_UNAVAILABLE";
      vivos: number;
      quantidade: number;
    };

export type CreateLoteIbcResult = {
  items: IbcCadastroRecord[];
  lote: IbcLoteRecord;
  warning?: LoteSaldoWarning;
};

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function normalizeNumeroNf(numeroNf: string | null | undefined): string | null {
  if (numeroNf == null) return null;
  const trimmed = numeroNf.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function comPlaca(item: IbcCadastroRecord, produto: ProdutoCadastroResolvido): IbcCadastroRecord {
  return {
    ...item,
    corHex: produto.corHex,
    universal: produto.universal,
    homologado: produto.homologado,
  };
}

export class CreateLoteIbcUseCase {
  constructor(
    private readonly repository: IIbcCadastroRepository,
    private readonly produtos: ProdutoCadastroLookup,
    private readonly catalogo: CatalogoCadastroLookup,
    private readonly saldoPort: ISaldoIbcErp | null = null,
  ) {}

  async execute(input: CreateLoteIbcInput): Promise<CreateLoteIbcResult> {
    const { quantidade, dataLimite } = input;
    const numeroNf = normalizeNumeroNf(input.numeroNf);

    if (
      !Number.isInteger(quantidade) ||
      quantidade < IBC_LOTE_QUANTIDADE_BOUNDS.min ||
      quantidade > IBC_LOTE_QUANTIDADE_BOUNDS.max
    ) {
      throw new AppError({
        message: `Quantidade do lote deve ser entre ${IBC_LOTE_QUANTIDADE_BOUNDS.min} e ${IBC_LOTE_QUANTIDADE_BOUNDS.max}`,
        statusCode: 400,
        code: "IBC_LOTE_QUANTIDADE_INVALIDA",
        details: { quantidade },
      });
    }

    const today = startOfUtcDay(new Date());
    const dataLimiteDay = startOfUtcDay(dataLimite);
    if (dataLimiteDay < today) {
      throw new AppError({
        message: "Data limite deve ser hoje ou uma data futura",
        statusCode: 400,
        code: "IBC_DATA_LIMITE_INVALIDA",
        details: { dataLimite },
      });
    }

    const warning = await this.buildWarning(quantidade);
    const produto = await resolverProdutoCadastroIbc(input, this.produtos, this.catalogo);

    const lote = await this.repository.createIbcLote({
      numeroNf,
      dataLimite,
    });

    const items = (
      await this.repository.createNovoIbcs(
        {
          prefixo: produto.prefixo,
          tipoCadastro: "NOVO",
          aptidao: "APTO",
          motivoInaptidao: null,
          custodia: "PATIO",
          dataLimite,
          primeiraInspecaoEm: null,
          loteId: lote.id,
          produtoId: produto.produtoId,
        },
        quantidade,
      )
    ).map((item) => comPlaca(item, produto));

    return warning ? { items, lote, warning } : { items, lote };
  }

  private async buildWarning(
    quantidade: number,
  ): Promise<LoteSaldoWarning | undefined> {
    if (!this.saldoPort) {
      return undefined;
    }

    const vivos = await this.repository.countVivosWp();
    const saldoResult = await this.saldoPort.getSaldo();

    if (saldoResult.status === "unavailable") {
      return {
        code: "SALDO_UNAVAILABLE",
        vivos,
        quantidade,
      };
    }

    if (vivos + quantidade > saldoResult.quantity) {
      return {
        code: "OVER_SALDO",
        vivos,
        quantidade,
        saldo: saldoResult.quantity,
      };
    }

    return undefined;
  }
}
