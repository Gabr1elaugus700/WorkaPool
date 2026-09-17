import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import type { OverviewCustomerSyncStore } from "../sync/ports";
import { extractOverviewCustomerIdentitySnapshot } from "../sync/extractOverviewCustomerIdentitySnapshot";
import type {
  OverviewCustomerCommercialSummary,
  OverviewCustomerIdentity,
} from "../models/OverviewCustomerIdentity";
import { extractOverviewCustomerCommercialSummarySnapshot } from "../sync/extractOverviewCustomerCommercialSummarySnapshot";

export type GetOverviewCustomerDetailInput = {
  customerCode: number;
  role: Role;
  codRep?: number;
};

export type OverviewCustomerDetailResult = {
  customer: OverviewCustomerIdentity;
  commercialSummary: OverviewCustomerCommercialSummary;
  sync: {
    lastSuccessfulSyncAt: string | null;
    servedSnapshotId: string;
  };
};

const OVERVIEW_ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.GERENTE_DPTO, Role.VENDAS];

export class GetOverviewCustomerDetailUseCase {
  constructor(private readonly store: OverviewCustomerSyncStore) {}

  async execute(input: GetOverviewCustomerDetailInput): Promise<OverviewCustomerDetailResult> {
    if (!OVERVIEW_ALLOWED_ROLES.includes(input.role)) {
      throw new AppError({
        message: "Acesso negado",
        statusCode: 403,
        code: "OVERVIEW_CUSTOMER_FORBIDDEN",
      });
    }

    const [snapshot, lastSuccessfulSyncAt] = await Promise.all([
      this.store.getServedSnapshot(),
      this.store.getLastSuccessfulSyncAt(),
    ]);

    if (!snapshot) {
      throw new AppError({
        message: `Overview customer ${input.customerCode} not found`,
        statusCode: 404,
        code: "OVERVIEW_CUSTOMER_NOT_FOUND",
      });
    }

    const parsed = extractOverviewCustomerIdentitySnapshot(snapshot.payload);
    const customer = parsed?.customers[String(input.customerCode)] ?? null;
    if (!customer) {
      throw new AppError({
        message: `Overview customer ${input.customerCode} not found`,
        statusCode: 404,
        code: "OVERVIEW_CUSTOMER_NOT_FOUND",
      });
    }

    const commercialSummarySnapshot = extractOverviewCustomerCommercialSummarySnapshot(
      snapshot.payload,
    );
    const commercialSummary =
      commercialSummarySnapshot?.customers[String(input.customerCode)] ??
      emptyCommercialSummary();

    if (input.role === Role.VENDAS && customer.primaryCodRep !== input.codRep) {
      throw new AppError({
        message: "Acesso negado",
        statusCode: 403,
        code: "OVERVIEW_CUSTOMER_FORBIDDEN",
      });
    }

    return {
      customer: {
        ...customer,
        lastLostOrderAt: customer.lastLostOrderAt ?? null,
        lastCommercialMovementAt:
          customer.lastCommercialMovementAt ?? customer.lastInvoicedPurchaseAt ?? null,
      },
      commercialSummary,
      sync: {
        lastSuccessfulSyncAt: lastSuccessfulSyncAt
          ? lastSuccessfulSyncAt.toISOString()
          : null,
        servedSnapshotId: snapshot.id,
      },
    };
  }
}

function emptyCommercialSummary(): OverviewCustomerCommercialSummary {
  return {
    revenueSinceJan2024: 0,
    revenueLast12Months: 0,
    orderCountSinceJan2024: 0,
    orderCountLast12Months: 0,
    averageTicketSinceJan2024: 0,
    averageTicketLast12Months: 0,
    volumeSinceJan2024: 0,
    volumeLast12Months: 0,
    marginPercentWeightedByRevenue: null,
    purchaseFrequencyDays: null,
    daysSinceLastPurchase: null,
  };
}
