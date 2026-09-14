import { allocateNextIbcIdentifier } from "../services/allocateNextIbcIdentifier";
import { IIbcCadastroRepository } from "../repositories/IIbcCadastroRepository";
import { ISaldoIbcErp } from "../ports/ISaldoIbcErp";
import {
  IbcCadastroRecord,
  IbcLoteRecord,
} from "../types/IbcCadastro.types";
import { AppError } from "../../../utils/AppError";

export const IBC_LOTE_QUANTIDADE_BOUNDS = {
  min: 1,
  max: 200,
} as const;

export type CreateLoteIbcInput = {
  quantidade: number;
  dataLimite: Date;
  numeroNf?: string | null;
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

export class CreateLoteIbcUseCase {
  private readonly repository: IIbcCadastroRepository;
  private readonly saldoPort: ISaldoIbcErp | null;

  constructor(
    repository: IIbcCadastroRepository,
    saldoPort: ISaldoIbcErp | null = null,
  ) {
    this.repository = repository;
    this.saldoPort = saldoPort;
  }

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

    const lote = await this.repository.createIbcLote({
      numeroNf,
      dataLimite,
    });

    let highest = await this.repository.findHighestIdentificador();
    const items: IbcCadastroRecord[] = [];

    for (let i = 0; i < quantidade; i += 1) {
      const identificador = highest
        ? allocateNextIbcIdentifier(highest)
        : "HM0001";
      highest = identificador;

      const created = await this.repository.createNovoIbc({
        identificador,
        tipoCadastro: "NOVO",
        aptidao: "INAPTO",
        motivoInaptidao: "AGUARDANDO_INSPECAO",
        custodia: "PATIO",
        dataLimite,
        loteId: lote.id,
      });
      items.push(created);
    }

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
