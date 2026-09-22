import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import type { OverviewCustomerOrderLossLookup } from "../repositories/OverviewCustomerOrderLossRepository";
import type { OverviewCustomerSellerNameLookup } from "../repositories/OverviewCustomerSellerNameRepository";
import { extractOverviewCustomerIdentitySnapshot } from "../sync/extractOverviewCustomerIdentitySnapshot";
import type {
  OverviewCustomerGroupQuoteSeniorLine,
  OverviewCustomerGroupQuotesSeniorReader,
} from "../sync/OverviewCustomerGroupQuotesSeniorQuery";
import type { OverviewCustomerSyncStore } from "../sync/ports";
import { buildOverviewCustomerGroupQuoteWindow } from "../utils/buildOverviewCustomerGroupQuoteWindow";
import { filterOverviewCustomerGroupQuoteLines } from "../utils/filterOverviewCustomerGroupQuoteLines";
import {
  mapOverviewCustomerGroupQuoteRow,
  type OverviewCustomerGroupQuoteRow,
} from "../utils/mapOverviewCustomerGroupQuoteRow";
import {
  selectOverviewCustomerGroupQuoteProducts,
  type OverviewCustomerGroupQuoteProductOption,
} from "../utils/selectOverviewCustomerGroupQuoteProducts";
import { sortOverviewCustomerGroupQuoteLines } from "../utils/sortOverviewCustomerGroupQuoteLines";
import { OVERVIEW_CUSTOMER_UNMATCHED_LOSS_MOTIVO } from "./GetOverviewCustomerGroupAnaliseUseCase";

export type GetOverviewCustomerGroupQuotesInput = {
  customerCode: number;
  grupoCodigo: string;
  productCode?: string;
  role: Role;
  codRep?: number;
};

export type GetOverviewCustomerGroupQuotesResult = {
  customerCode: number;
  grupoCodigo: string;
  products: OverviewCustomerGroupQuoteProductOption[];
  selectedProductCode: string | null;
  rows: OverviewCustomerGroupQuoteRow[];
};

const OVERVIEW_ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.GERENTE_DPTO, Role.VENDAS];

export class GetOverviewCustomerGroupQuotesUseCase {
  constructor(
    private readonly store: OverviewCustomerSyncStore,
    private readonly quotes: OverviewCustomerGroupQuotesSeniorReader,
    private readonly orderLoss: OverviewCustomerOrderLossLookup,
    private readonly sellers: OverviewCustomerSellerNameLookup,
  ) {}

  async execute(
    input: GetOverviewCustomerGroupQuotesInput,
  ): Promise<GetOverviewCustomerGroupQuotesResult> {
    if (!OVERVIEW_ALLOWED_ROLES.includes(input.role)) {
      throw this.forbidden();
    }

    const snapshot = await this.store.getServedSnapshot();
    if (!snapshot) {
      throw this.notFound(input.customerCode);
    }

    const identitySnapshot = extractOverviewCustomerIdentitySnapshot(snapshot.payload);
    const customer = identitySnapshot?.customers[String(input.customerCode)] ?? null;
    if (!customer) {
      throw this.notFound(input.customerCode);
    }

    if (input.role === Role.VENDAS && customer.primaryCodRep !== input.codRep) {
      throw this.forbidden();
    }

    const window = buildOverviewCustomerGroupQuoteWindow();
    const lines = await this.quotes.fetchLines({
      grpPro: input.grupoCodigo,
      dataInicio: window.dataInicio,
      dataFimExclusiva: window.dataFimExclusiva,
    });

    const products = selectOverviewCustomerGroupQuoteProducts(
      lines,
      input.customerCode,
    );
    const selectedProductCode = resolveSelectedProductCode(
      products,
      input.productCode,
    );

    if (selectedProductCode === null) {
      return {
        customerCode: input.customerCode,
        grupoCodigo: input.grupoCodigo,
        products,
        selectedProductCode: null,
        rows: [],
      };
    }

    const filtered = sortOverviewCustomerGroupQuoteLines(
      filterOverviewCustomerGroupQuoteLines(
        lines,
        input.customerCode,
        selectedProductCode,
      ),
    );

    const lossReasonByOrder = await this.resolveLossReasons(filtered);
    const sellerNameByCodRep = await this.resolveSellerNames(filtered);

    return {
      customerCode: input.customerCode,
      grupoCodigo: input.grupoCodigo,
      products,
      selectedProductCode,
      rows: filtered.map((line) =>
        mapOverviewCustomerGroupQuoteRow(line, {
          sellerName: sellerNameByCodRep.get(line.codRep) ?? null,
          lossReason:
            line.sitped === 5
              ? (lossReasonByOrder.get(line.numped) ??
                OVERVIEW_CUSTOMER_UNMATCHED_LOSS_MOTIVO)
              : null,
        }),
      ),
    };
  }

  private async resolveLossReasons(
    lines: OverviewCustomerGroupQuoteSeniorLine[],
  ): Promise<Map<number, string>> {
    const lostOrderNumbers = [
      ...new Set(
        lines.filter((line) => line.sitped === 5).map((line) => line.numped),
      ),
    ];
    if (lostOrderNumbers.length === 0) {
      return new Map();
    }

    const reasons =
      await this.orderLoss.findLossReasonsByOrderNumbers(lostOrderNumbers);
    return new Map(
      reasons.map((reason) => [reason.orderNumber, reason.description]),
    );
  }

  private async resolveSellerNames(
    lines: OverviewCustomerGroupQuoteSeniorLine[],
  ): Promise<Map<number, string>> {
    const codReps = [...new Set(lines.map((line) => line.codRep))];
    try {
      const matches = await this.sellers.findNamesByCodReps(codReps);
      return new Map(matches.map((match) => [match.codRep, match.name]));
    } catch {
      return new Map();
    }
  }

  private forbidden(): AppError {
    return new AppError({
      message: "Acesso negado",
      statusCode: 403,
      code: "OVERVIEW_CUSTOMER_FORBIDDEN",
    });
  }

  private notFound(customerCode: number): AppError {
    return new AppError({
      message: `Overview customer ${customerCode} not found`,
      statusCode: 404,
      code: "OVERVIEW_CUSTOMER_NOT_FOUND",
    });
  }
}

function resolveSelectedProductCode(
  products: OverviewCustomerGroupQuoteProductOption[],
  requestedProductCode: string | undefined,
): string | null {
  if (products.length === 0) {
    return null;
  }
  if (
    requestedProductCode !== undefined &&
    products.some((product) => product.productCode === requestedProductCode)
  ) {
    return requestedProductCode;
  }
  return products[0]?.productCode ?? null;
}
