import type { OverviewCustomerSyncPipeline } from "../sync/OverviewCustomerSyncPipeline";
import type { SyncRunResult } from "../sync/types";

export class StartOverviewSyncUseCase {
  constructor(private readonly pipeline: OverviewCustomerSyncPipeline) {}

  async execute(): Promise<SyncRunResult> {
    return this.pipeline.run();
  }
}
