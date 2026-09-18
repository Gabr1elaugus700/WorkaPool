import { AppError } from "../../../utils/AppError";
import type {
  GrpproSeniorReader,
  GrpproSyncStore,
  ProdutoGrupoMapWriter,
} from "./ports";
import type { GrpproSyncRunResult } from "./types";

type GrpProSyncPipelineOptions = {
  now?: () => Date;
};

export class GrpProSyncPipeline {
  private readonly now: () => Date;

  constructor(
    private readonly store: GrpproSyncStore,
    private readonly seniorReader: GrpproSeniorReader,
    private readonly mapWriter: ProdutoGrupoMapWriter,
    options: GrpProSyncPipelineOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
  }

  async run(): Promise<GrpproSyncRunResult> {
    const active = await this.store.getActiveRun();
    if (active) {
      throw new AppError({
        message: "GrpPro sync already has an active run",
        statusCode: 409,
        code: "GRPPRO_SYNC_ALREADY_RUNNING",
      });
    }

    const run = await this.store.createRun();
    const syncedAt = this.now();

    try {
      const rows = await this.seniorReader.fetchAll();
      await this.mapWriter.truncateStaging();
      await this.mapWriter.bulkInsertStaging(rows, syncedAt);
      await this.mapWriter.atomicSwap();
      await this.store.updateMetaAfterSuccess(syncedAt, rows.length);

      const succeededRun = await this.store.completeRun(run.id, "SUCCEEDED", {
        rowCount: rows.length,
      });

      return {
        run: succeededRun,
        published: true,
        rowCount: rows.length,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const failedRun = await this.store.completeRun(run.id, "FAILED", {
        error: message,
      });
      return { run: failedRun, published: false };
    }
  }
}
