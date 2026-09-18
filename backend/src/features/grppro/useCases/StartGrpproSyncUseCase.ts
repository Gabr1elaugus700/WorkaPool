import type { GrpProSyncPipeline } from "../sync/GrpProSyncPipeline";
import type { GrpproSyncRunResult } from "../sync/types";

export class StartGrpproSyncUseCase {
  constructor(private readonly pipeline: GrpProSyncPipeline) {}

  async execute(): Promise<GrpproSyncRunResult> {
    return this.pipeline.run();
  }
}
