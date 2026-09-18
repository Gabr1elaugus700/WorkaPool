import { getPrismaClient } from "../../../config/prisma";
import { createGrpproSyncRuntime } from "../sync/createGrpproSyncRuntime";
import { GetGrpproSyncRunUseCase } from "../useCases/GetGrpproSyncRunUseCase";
import { GetGrpproSyncStatusUseCase } from "../useCases/GetGrpproSyncStatusUseCase";
import { ListGrpproSyncRunsUseCase } from "../useCases/ListGrpproSyncRunsUseCase";
import { StartGrpproSyncUseCase } from "../useCases/StartGrpproSyncUseCase";
import { createGrpproSyncAdminRoutes } from "./routes/grpproSyncAdminRoutes";

export function createGrpproSyncAdminRouter(
  prisma = getPrismaClient(),
) {
  const { store, pipeline } = createGrpproSyncRuntime(prisma);

  return createGrpproSyncAdminRoutes({
    getStatus: new GetGrpproSyncStatusUseCase(store),
    listRuns: new ListGrpproSyncRunsUseCase(store),
    getRun: new GetGrpproSyncRunUseCase(store),
    startSync: new StartGrpproSyncUseCase(pipeline),
  });
}
