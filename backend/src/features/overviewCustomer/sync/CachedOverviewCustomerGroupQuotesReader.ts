import { AppError } from "../../../utils/AppError";
import { buildOverviewCustomerGroupQuoteWindow } from "../utils/buildOverviewCustomerGroupQuoteWindow";
import type {
  OverviewCustomerGroupQuoteSeniorLine,
  OverviewCustomerGroupQuotesQueryInput,
  OverviewCustomerGroupQuotesSeniorReader,
} from "./OverviewCustomerGroupQuotesSeniorQuery";

export function buildOverviewCustomerGroupQuotesCacheKey(
  grpPro: string,
  dataInicio: string,
): string {
  return `${grpPro}:${dataInicio}`;
}

export class CachedOverviewCustomerGroupQuotesReader
  implements OverviewCustomerGroupQuotesSeniorReader
{
  private readonly cache = new Map<string, OverviewCustomerGroupQuoteSeniorLine[]>();
  private readonly inFlight = new Map<
    string,
    Promise<OverviewCustomerGroupQuoteSeniorLine[]>
  >();

  constructor(
    private readonly inner: OverviewCustomerGroupQuotesSeniorReader,
  ) {}

  async fetchLines(
    input: OverviewCustomerGroupQuotesQueryInput,
  ): Promise<OverviewCustomerGroupQuoteSeniorLine[]> {
    const cacheKey = buildOverviewCustomerGroupQuotesCacheKey(
      input.grpPro,
      input.dataInicio,
    );
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const pending = this.inFlight.get(cacheKey);
    if (pending !== undefined) {
      return pending;
    }

    const request = this.loadAndCache(cacheKey, input);
    this.inFlight.set(cacheKey, request);

    try {
      return await request;
    } finally {
      this.inFlight.delete(cacheKey);
    }
  }

  async fetchLinesForWindow(
    grpPro: string,
    now: Date = new Date(),
  ): Promise<OverviewCustomerGroupQuoteSeniorLine[]> {
    const window = buildOverviewCustomerGroupQuoteWindow(now);
    return this.fetchLines({
      grpPro,
      dataInicio: window.dataInicio,
      dataFimExclusiva: window.dataFimExclusiva,
    });
  }

  private async loadAndCache(
    cacheKey: string,
    input: OverviewCustomerGroupQuotesQueryInput,
  ): Promise<OverviewCustomerGroupQuoteSeniorLine[]> {
    try {
      const lines = await this.inner.fetchLines(input);
      this.cache.set(cacheKey, lines);
      return lines;
    } catch {
      throw new AppError({
        message: "Leitura de cotações do grupo indisponível",
        statusCode: 503,
        code: "OVERVIEW_CUSTOMER_GROUP_QUOTES_UNAVAILABLE",
      });
    }
  }
}
