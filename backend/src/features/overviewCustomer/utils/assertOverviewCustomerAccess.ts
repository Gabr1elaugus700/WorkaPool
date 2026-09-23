import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import type { OverviewCustomerIdentity } from "../models/OverviewCustomerIdentity";
import { extractOverviewCustomerIdentitySnapshot } from "../sync/extractOverviewCustomerIdentitySnapshot";
import type { OverviewCustomerSyncStore } from "../sync/ports";
import type { OverviewSnapshot } from "../sync/types";

export type AssertOverviewCustomerAccessInput = {
  customerCode: number;
  role: Role;
  codRep?: number;
};

export type AssertOverviewCustomerAccessResult = {
  customer: OverviewCustomerIdentity;
  snapshot: OverviewSnapshot;
};

const OVERVIEW_ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.GERENTE_DPTO, Role.VENDAS];

export async function assertOverviewCustomerAccess(
  store: OverviewCustomerSyncStore,
  input: AssertOverviewCustomerAccessInput,
): Promise<AssertOverviewCustomerAccessResult> {
  if (!OVERVIEW_ALLOWED_ROLES.includes(input.role)) {
    throw forbidden();
  }

  const snapshot = await store.getServedSnapshot();
  if (!snapshot) {
    throw notFound(input.customerCode);
  }

  const parsed = extractOverviewCustomerIdentitySnapshot(snapshot.payload);
  const customer = parsed?.customers[String(input.customerCode)] ?? null;
  if (!customer) {
    throw notFound(input.customerCode);
  }

  if (input.role === Role.VENDAS && customer.primaryCodRep !== input.codRep) {
    throw forbidden();
  }

  return { customer, snapshot };
}

function forbidden(): AppError {
  return new AppError({
    message: "Acesso negado",
    statusCode: 403,
    code: "OVERVIEW_CUSTOMER_FORBIDDEN",
  });
}

function notFound(customerCode: number): AppError {
  return new AppError({
    message: `Overview customer ${customerCode} not found`,
    statusCode: 404,
    code: "OVERVIEW_CUSTOMER_NOT_FOUND",
  });
}
