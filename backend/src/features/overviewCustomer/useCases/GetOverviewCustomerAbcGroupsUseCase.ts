import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { extractOverviewCustomerIdentitySnapshot } from "../sync/extractOverviewCustomerIdentitySnapshot";
import { extractOverviewCustomerWinsByGroupSnapshot } from "../sync/extractOverviewCustomerWinsByGroupSnapshot";
import type { OverviewCustomerSyncStore } from "../sync/ports";
import {
  rankOverviewCustomerAbcGroups,
  type OverviewCustomerAbcGroup,
} from "../utils/rankOverviewCustomerAbcGroups";

export type GetOverviewCustomerAbcGroupsInput = {
  customerCode: number;
  role: Role;
  codRep?: number;
};

export type GetOverviewCustomerAbcGroupsResult = {
  customerCode: number;
  grupos: OverviewCustomerAbcGroup[];
};

const OVERVIEW_ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.GERENTE_DPTO, Role.VENDAS];

export class GetOverviewCustomerAbcGroupsUseCase {
  constructor(private readonly store: OverviewCustomerSyncStore) {}

  async execute(
    input: GetOverviewCustomerAbcGroupsInput,
  ): Promise<GetOverviewCustomerAbcGroupsResult> {
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
      grupos: rankOverviewCustomerAbcGroups(rows),
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
