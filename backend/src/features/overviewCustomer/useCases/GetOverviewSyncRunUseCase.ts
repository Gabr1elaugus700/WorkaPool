import { AppError } from "../../../utils/AppError";
import type { OverviewCustomerSyncStore } from "../sync/ports";
import type { SyncRunRecord } from "../sync/types";

export class GetOverviewSyncRunUseCase {
  constructor(private readonly store: OverviewCustomerSyncStore) {}

  async execute(runId: string): Promise<SyncRunRecord> {
    const run = await this.store.getRun(runId);
    if (!run) {
      throw new AppError({
        message: `Overview sync run ${runId} not found`,
        statusCode: 404,
        code: "OVERVIEW_SYNC_RUN_NOT_FOUND",
      });
    }
    return run;
  }
}
