import { PrismaClient } from "@prisma/client";
import { OverviewCustomerSyncRepository } from "../repositories/OverviewCustomerSyncRepository";
import { OverviewCustomerSyncPipeline } from "../sync/OverviewCustomerSyncPipeline";
import type { SeniorStepExecutor } from "../sync/ports";
import { GetOverviewSyncRunUseCase } from "../useCases/GetOverviewSyncRunUseCase";
import { GetOverviewSyncStatusUseCase } from "../useCases/GetOverviewSyncStatusUseCase";
import { ListOverviewSyncRunsUseCase } from "../useCases/ListOverviewSyncRunsUseCase";
import { RetryOverviewSyncFailedStepUseCase } from "../useCases/RetryOverviewSyncFailedStepUseCase";
import { createOverviewSyncAdminRoutes } from "./routes/overviewSyncAdminRoutes";

const PLACEHOLDER_STEP_NAMES = [
  "dados-gerais-cliente",
  "resumo-comercial",
  "evolucao-mensal",
  "produtos-comprados",
  "ultimo-pedido-cliente",
] as const;

function createPlaceholderSteps(): SeniorStepExecutor[] {
  return PLACEHOLDER_STEP_NAMES.map((name) => ({
    name,
    execute: async () => {
      throw new Error(`Senior step ${name} is not wired yet`);
    },
  }));
}

export function createOverviewSyncAdminRouter(
  prisma: PrismaClient = new PrismaClient(),
) {
  const store = new OverviewCustomerSyncRepository(prisma);
  const pipeline = new OverviewCustomerSyncPipeline(
    store,
    createPlaceholderSteps(),
  );

  return createOverviewSyncAdminRoutes({
    getStatus: new GetOverviewSyncStatusUseCase(store),
    listRuns: new ListOverviewSyncRunsUseCase(store),
    getRun: new GetOverviewSyncRunUseCase(store),
    retryFailedStep: new RetryOverviewSyncFailedStepUseCase(pipeline),
  });
}
