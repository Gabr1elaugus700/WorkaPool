import { AppError } from "../../../utils/AppError";
import type { GrpproSyncStore } from "../sync/ports";
import type { GrpproSyncRunRecord } from "../sync/types";

export class GetGrpproSyncRunUseCase {
  constructor(private readonly store: GrpproSyncStore) {}

  async execute(runId: string): Promise<GrpproSyncRunRecord> {
    const run = await this.store.getRun(runId);
    if (!run) {
      throw new AppError({
        message: `GrpPro sync run ${runId} not found`,
        statusCode: 404,
        code: "GRPPRO_SYNC_RUN_NOT_FOUND",
      });
    }
    return run;
  }
}
