import { ibcProdutoCompatibilidade } from "./ibcProdutoCompatibilidade";

const IBC_SUBSTITUIDO_CODE = "IBC_SUBSTITUIDO";
const IBC_SUBSTITUIDO_TITLE = "IBC substituído";
const IBC_SUBSTITUIDO_MESSAGE =
  "Este identificador foi trocado numa conversão ou mudança de produto. Vincule o código novo — o de origem não entra na expedição.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Falha de vinculação de IBC. `IBC_SUBSTITUIDO` e `IBC_PRODUTO_INCOMPATIVEL`
 * viram orientação na tela; os demais códigos preservam a mensagem da API.
 */
export class IbcAlocacaoRequestError extends Error {
  readonly code: string | null;
  readonly title: string | null;

  constructor(message: string, code: string | null, title: string | null) {
    super(message);
    this.name = "IbcAlocacaoRequestError";
    this.code = code;
    this.title = title;
  }

  get substituido(): boolean {
    return this.code === IBC_SUBSTITUIDO_CODE;
  }

  static fromBody(body: unknown, fallback: string): IbcAlocacaoRequestError {
    const record = isRecord(body) ? body : {};
    const code = typeof record.code === "string" ? record.code : null;
    if (code === IBC_SUBSTITUIDO_CODE) {
      return new IbcAlocacaoRequestError(
        IBC_SUBSTITUIDO_MESSAGE,
        code,
        IBC_SUBSTITUIDO_TITLE,
      );
    }
    const conflito = ibcProdutoCompatibilidade.mensagemConflito(record, "carga");
    if (conflito) {
      return new IbcAlocacaoRequestError(conflito, code, ibcProdutoCompatibilidade.tituloIncompativel);
    }
    const message =
      typeof record.error === "string"
        ? record.error
        : typeof record.message === "string"
          ? record.message
          : fallback;
    return new IbcAlocacaoRequestError(message, code, null);
  }

  static async fromResponse(res: Response): Promise<IbcAlocacaoRequestError> {
    const fallback = "Não foi possível vincular o IBC.";
    const contentType = res.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return IbcAlocacaoRequestError.fromBody(null, fallback);
    }
    try {
      return IbcAlocacaoRequestError.fromBody(await res.json(), fallback);
    } catch {
      return IbcAlocacaoRequestError.fromBody(null, fallback);
    }
  }
}
