import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import type { OverviewCustomerPurchasedProduct } from "../models/OverviewCustomerIdentity";
import { extractOverviewCustomerIdentitySnapshot } from "../sync/extractOverviewCustomerIdentitySnapshot";
import { extractOverviewCustomerPurchasedProductsSnapshot } from "../sync/extractOverviewCustomerPurchasedProductsSnapshot";
import type { OverviewCustomerSyncStore } from "../sync/ports";

export type GetOverviewCustomerPurchasedProductsInput = {
  customerCode: number;
  role: Role;
  codRep?: number;
};

export type GetOverviewCustomerPurchasedProductsResult = {
  customerCode: number;
  products: OverviewCustomerPurchasedProduct[];
};

const OVERVIEW_ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.GERENTE_DPTO, Role.VENDAS];

export class GetOverviewCustomerPurchasedProductsUseCase {
  constructor(private readonly store: OverviewCustomerSyncStore) {}

  async execute(
    input: GetOverviewCustomerPurchasedProductsInput,
  ): Promise<GetOverviewCustomerPurchasedProductsResult> {
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

    const purchasedProductsSnapshot = extractOverviewCustomerPurchasedProductsSnapshot(
      snapshot.payload,
    );
    const products = purchasedProductsSnapshot?.customers[String(input.customerCode)] ?? [];
    return {
      customerCode: input.customerCode,
      products,
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
