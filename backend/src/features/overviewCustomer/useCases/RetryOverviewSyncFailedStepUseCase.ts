import type { OverviewCustomerSyncPipeline } from "../sync/OverviewCustomerSyncPipeline";
import type { SyncRunResult } from "../sync/types";

export class RetryOverviewSyncFailedStepUseCase {
  constructor(private readonly pipeline: OverviewCustomerSyncPipeline) {}

  async execute(runId: string, stepName: string): Promise<SyncRunResult> {
    return this.pipeline.retryFailedStep(runId, stepName);
  }
}
