import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import type { OverviewCustomerMonthlyEvolutionRow } from "../models/OverviewCustomerIdentity";
import type { OverviewCustomerSyncStore } from "../sync/ports";
import { extractOverviewCustomerIdentitySnapshot } from "../sync/extractOverviewCustomerIdentitySnapshot";
import { extractOverviewCustomerMonthlyEvolutionSnapshot } from "../sync/extractOverviewCustomerMonthlyEvolutionSnapshot";

export type GetOverviewCustomerMonthlyEvolutionInput = {
  customerCode: number;
  role: Role;
  codRep?: number;
};

export type GetOverviewCustomerMonthlyEvolutionResult = {
  customerCode: number;
  monthly: OverviewCustomerMonthlyEvolutionRow[];
};

const OVERVIEW_ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.GERENTE_DPTO, Role.VENDAS];

export class GetOverviewCustomerMonthlyEvolutionUseCase {
  constructor(private readonly store: OverviewCustomerSyncStore) {}

  async execute(
    input: GetOverviewCustomerMonthlyEvolutionInput,
  ): Promise<GetOverviewCustomerMonthlyEvolutionResult> {
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

    const monthlySnapshot = extractOverviewCustomerMonthlyEvolutionSnapshot(snapshot.payload);
    const monthly = monthlySnapshot?.customers[String(input.customerCode)] ?? [];

    return {
      customerCode: input.customerCode,
      monthly,
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
