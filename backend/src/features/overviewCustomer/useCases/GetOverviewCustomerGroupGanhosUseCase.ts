import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { extractOverviewCustomerIdentitySnapshot } from "../sync/extractOverviewCustomerIdentitySnapshot";
import { extractOverviewCustomerWinsByGroupSnapshot } from "../sync/extractOverviewCustomerWinsByGroupSnapshot";
import type { OverviewCustomerSyncStore } from "../sync/ports";
import {
  selectOverviewCustomerGroupGanhos,
  type OverviewCustomerGroupGanho,
} from "../utils/selectOverviewCustomerGroupGanhos";

export type GetOverviewCustomerGroupGanhosInput = {
  customerCode: number;
  grupoCodigo: string;
  role: Role;
  codRep?: number;
};

export type GetOverviewCustomerGroupGanhosResult = {
  customerCode: number;
  grupoCodigo: string;
  ganhos: OverviewCustomerGroupGanho[];
};

const OVERVIEW_ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.GERENTE_DPTO, Role.VENDAS];

export class GetOverviewCustomerGroupGanhosUseCase {
  constructor(private readonly store: OverviewCustomerSyncStore) {}

  async execute(
    input: GetOverviewCustomerGroupGanhosInput,
  ): Promise<GetOverviewCustomerGroupGanhosResult> {
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

    return {
      customerCode: input.customerCode,
      grupoCodigo: input.grupoCodigo,
      ganhos: selectOverviewCustomerGroupGanhos(rows, input.grupoCodigo),
    };
  }

  private notFound(customerCode: number): AppError {
    return new AppError({
      message: `Overview customer ${customerCode} not found`,
      statusCode: 404,
      code: "OVERVIEW_CUSTOMER_NOT_FOUND",
    });
  }
}
