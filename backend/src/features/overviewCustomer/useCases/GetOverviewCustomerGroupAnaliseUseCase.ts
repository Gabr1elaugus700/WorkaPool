import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { extractOverviewCustomerIdentitySnapshot } from "../sync/extractOverviewCustomerIdentitySnapshot";
import { extractOverviewCustomerWinsByGroupSnapshot } from "../sync/extractOverviewCustomerWinsByGroupSnapshot";
import type { OverviewCustomerGroupPerdidosSeniorReader } from "../sync/OverviewCustomerGroupPerdidosSeniorQuery";
import type { OverviewCustomerSyncStore } from "../sync/ports";
import type { OverviewCustomerOrderLossLookup } from "../repositories/OverviewCustomerOrderLossRepository";
import { aggregateOverviewCustomerGroupPerdidos } from "../utils/aggregateOverviewCustomerGroupPerdidos";
import {
  selectOverviewCustomerGroupGanhos,
  type OverviewCustomerGroupGanho,
} from "../utils/selectOverviewCustomerGroupGanhos";

export const OVERVIEW_CUSTOMER_UNMATCHED_LOSS_MOTIVO =
  "Sem justificativa registrada.";

export type GetOverviewCustomerGroupAnaliseInput = {
  customerCode: number;
  grupoCodigo: string;
  role: Role;
  codRep?: number;
};

export type OverviewCustomerGroupPerdido = {
  numped: number;
  datemi: string;
  vlrfinal: number;
  qtdped: number;
  preuni: number;
  margem: number | null;
  motivo: string;
};

export type GetOverviewCustomerGroupAnaliseResult = {
  customerCode: number;
  grupoCodigo: string;
  ganhos: OverviewCustomerGroupGanho[];
  perdidos: OverviewCustomerGroupPerdido[] | null;
  perdidosFailed: boolean;
};

const OVERVIEW_ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.GERENTE_DPTO, Role.VENDAS];

export class GetOverviewCustomerGroupAnaliseUseCase {
  constructor(
    private readonly store: OverviewCustomerSyncStore,
    private readonly senior: OverviewCustomerGroupPerdidosSeniorReader,
    private readonly orderLoss: OverviewCustomerOrderLossLookup,
  ) {}

  async execute(
    input: GetOverviewCustomerGroupAnaliseInput,
  ): Promise<GetOverviewCustomerGroupAnaliseResult> {
    if (!OVERVIEW_ALLOWED_ROLES.includes(input.role)) {
      throw new AppError({
        message: "Acesso negado",
        statusCode: 403,
        code: "OVERVIEW_CUSTOMER_FORBIDDEN",
      });
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
      throw new AppError({
        message: "Acesso negado",
        statusCode: 403,
        code: "OVERVIEW_CUSTOMER_FORBIDDEN",
      });
    }

    const winsSnapshot = extractOverviewCustomerWinsByGroupSnapshot(snapshot.payload);
    const rows = winsSnapshot?.customers[String(input.customerCode)] ?? [];
    const ganhos = selectOverviewCustomerGroupGanhos(rows, input.grupoCodigo);

    try {
      const lines = await this.senior.fetchLines({
        customerCode: input.customerCode,
        grupoCodigo: input.grupoCodigo,
      });
      const totals = aggregateOverviewCustomerGroupPerdidos(lines);
      const reasons =
        totals.length === 0
          ? []
          : await this.orderLoss.findLossReasonsByOrderNumbers(
              totals.map((row) => row.numped),
            );
      const motivoByOrder = new Map(
        reasons.map((reason) => [reason.orderNumber, reason.description]),
      );

      return {
        customerCode: input.customerCode,
        grupoCodigo: input.grupoCodigo,
        ganhos,
        perdidos: totals.map((row) => ({
          ...row,
          motivo:
            motivoByOrder.get(row.numped) ?? OVERVIEW_CUSTOMER_UNMATCHED_LOSS_MOTIVO,
        })),
        perdidosFailed: false,
      };
    } catch {
      return {
        customerCode: input.customerCode,
        grupoCodigo: input.grupoCodigo,
        ganhos,
        perdidos: null,
        perdidosFailed: true,
      };
    }
  }

  private notFound(customerCode: number): AppError {
    return new AppError({
      message: `Overview customer ${customerCode} not found`,
      statusCode: 404,
      code: "OVERVIEW_CUSTOMER_NOT_FOUND",
    });
  }
}
