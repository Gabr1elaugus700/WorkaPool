import { getPrismaClient } from "../../../config/prisma";
import { createOverviewCustomerSyncRuntime } from "../sync/createOverviewCustomerSyncRuntime";
import { GetOverviewSyncRunUseCase } from "../useCases/GetOverviewSyncRunUseCase";
import { GetOverviewSyncStatusUseCase } from "../useCases/GetOverviewSyncStatusUseCase";
import { ListOverviewSyncRunsUseCase } from "../useCases/ListOverviewSyncRunsUseCase";
import { RetryOverviewSyncFailedStepUseCase } from "../useCases/RetryOverviewSyncFailedStepUseCase";
import { StartOverviewSyncUseCase } from "../useCases/StartOverviewSyncUseCase";
import { createOverviewSyncAdminRoutes } from "./routes/overviewSyncAdminRoutes";

export function createOverviewSyncAdminRouter(
  prisma = getPrismaClient(),
) {
  const { store, pipeline } = createOverviewCustomerSyncRuntime(prisma);

  return createOverviewSyncAdminRoutes({
    getStatus: new GetOverviewSyncStatusUseCase(store),
    listRuns: new ListOverviewSyncRunsUseCase(store),
    getRun: new GetOverviewSyncRunUseCase(store),
    retryFailedStep: new RetryOverviewSyncFailedStepUseCase(pipeline),
    startSync: new StartOverviewSyncUseCase(pipeline),
  });
}
