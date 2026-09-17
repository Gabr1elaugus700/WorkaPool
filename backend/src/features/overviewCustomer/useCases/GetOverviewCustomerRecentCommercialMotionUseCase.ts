import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import type {
  OverviewCustomerRecentInvoicedOrder,
  OverviewCustomerRecentLostOrder,
} from "../models/OverviewCustomerIdentity";
import { extractOverviewCustomerIdentitySnapshot } from "../sync/extractOverviewCustomerIdentitySnapshot";
import { extractOverviewCustomerRecentCommercialMotionSnapshot } from "../sync/extractOverviewCustomerRecentCommercialMotionSnapshot";
import type { OverviewCustomerSyncStore } from "../sync/ports";

const OVERVIEW_ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.GERENTE_DPTO, Role.VENDAS];

export type GetOverviewCustomerRecentCommercialMotionInput = {
  customerCode: number;
  role: Role;
  codRep?: number;
};

export type GetOverviewCustomerRecentCommercialMotionResult = {
  customerCode: number;
  lastInvoicedPurchaseAt: string | null;
  lastLostOrderAt: string | null;
  lastCommercialMovementAt: string | null;
  invoicedCountLast12Months: number;
  lostCountLast12Months: number;
  recentInvoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  recentLostOrders: OverviewCustomerRecentLostOrder[];
};

export class GetOverviewCustomerRecentCommercialMotionUseCase {
  constructor(private readonly store: OverviewCustomerSyncStore) {}

  async execute(
    input: GetOverviewCustomerRecentCommercialMotionInput,
  ): Promise<GetOverviewCustomerRecentCommercialMotionResult> {
    if (!OVERVIEW_ALLOWED_ROLES.includes(input.role)) {
      throw forbidden();
    }

    const snapshot = await this.store.getServedSnapshot();
    if (!snapshot) {
      throw notFound(input.customerCode);
    }

    const identitySnapshot = extractOverviewCustomerIdentitySnapshot(snapshot.payload);
    const customer = identitySnapshot?.customers[String(input.customerCode)] ?? null;
    if (!customer) {
      throw notFound(input.customerCode);
    }

    if (input.role === Role.VENDAS && customer.primaryCodRep !== input.codRep) {
      throw forbidden();
    }

    const motionSnapshot = extractOverviewCustomerRecentCommercialMotionSnapshot(snapshot.payload);
    if (!motionSnapshot) {
      throw notFound(input.customerCode);
    }

    const motion = motionSnapshot.customers[String(input.customerCode)];
    if (!motion) {
      throw notFound(input.customerCode);
    }

    return {
      customerCode: input.customerCode,
      lastInvoicedPurchaseAt:
        motion.lastInvoicedPurchaseAt ?? customer.lastInvoicedPurchaseAt ?? null,
      lastLostOrderAt: motion.lastLostOrderAt ?? customer.lastLostOrderAt ?? null,
      lastCommercialMovementAt:
        motion.lastCommercialMovementAt ??
        customer.lastCommercialMovementAt ??
        motion.lastInvoicedPurchaseAt ??
        customer.lastInvoicedPurchaseAt ??
        null,
      invoicedCountLast12Months: motion.invoicedCountLast12Months,
      lostCountLast12Months: motion.lostCountLast12Months,
      recentInvoicedOrders: motion.recentInvoicedOrders,
      recentLostOrders: motion.recentLostOrders,
    };
  }
}

function notFound(customerCode: number): AppError {
  return new AppError({
    message: `Overview customer ${customerCode} not found`,
    statusCode: 404,
    code: "OVERVIEW_CUSTOMER_NOT_FOUND",
  });
}

function forbidden(): AppError {
  return new AppError({
    message: "Acesso negado",
    statusCode: 403,
    code: "OVERVIEW_CUSTOMER_FORBIDDEN",
  });
}
