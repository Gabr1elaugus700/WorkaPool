import { Request, Response } from "express";
import { AppError } from "../../../../utils/AppError";
import type { GetGrpproSyncRunUseCase } from "../../useCases/GetGrpproSyncRunUseCase";
import type { GetGrpproSyncStatusUseCase } from "../../useCases/GetGrpproSyncStatusUseCase";
import type { ListGrpproSyncRunsUseCase } from "../../useCases/ListGrpproSyncRunsUseCase";
import type { StartGrpproSyncUseCase } from "../../useCases/StartGrpproSyncUseCase";

export type GrpproSyncAdminControllerDeps = {
  getStatus: GetGrpproSyncStatusUseCase;
  listRuns: ListGrpproSyncRunsUseCase;
  getRun: GetGrpproSyncRunUseCase;
  startSync: StartGrpproSyncUseCase;
};

export class GrpproSyncAdminController {
  constructor(private readonly deps: GrpproSyncAdminControllerDeps) {}

  getStatus = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const status = await this.deps.getStatus.execute();
      return res.status(200).json({
        lastSuccessfulSyncAt: status.lastSuccessfulSyncAt,
        lastRowCount: status.lastRowCount,
        activeRunId: status.activeRunId,
        lastError: status.lastError,
      });
    } catch (error: unknown) {
      return this.mapError(res, error, "Erro ao buscar status do sync GrpPro");
    }
  };

  listRuns = async (req: Request, res: Response): Promise<Response> => {
    try {
      const limitRaw = req.query.limit;
      const limit =
        typeof limitRaw === "string" && limitRaw.length > 0
          ? Number(limitRaw)
          : 50;
      if (!Number.isFinite(limit) || limit <= 0) {
        return res.status(400).json({
          error: "limit inválido",
          code: "GRPPRO_SYNC_INVALID_LIMIT",
        });
      }
      const runs = await this.deps.listRuns.execute(limit);
      return res.status(200).json({ runs });
    } catch (error: unknown) {
      return this.mapError(res, error, "Erro ao listar runs do sync GrpPro");
    }
  };

  getRun = async (req: Request, res: Response): Promise<Response> => {
    try {
      const runId = String(req.params.runId ?? "");
      if (!runId) {
        return res.status(400).json({
          error: "runId é obrigatório",
          code: "GRPPRO_SYNC_INVALID_RUN_ID",
        });
      }
      const run = await this.deps.getRun.execute(runId);
      return res.status(200).json({ run });
    } catch (error: unknown) {
      return this.mapError(res, error, "Erro ao buscar run do sync GrpPro");
    }
  };

  startSync = async (_req: Request, res: Response): Promise<Response> => {
    try {
      console.log("🔄 [grppro-sync-admin] Manual sync trigger requested");
      const result = await this.deps.startSync.execute();
      return res.status(202).json(result);
    } catch (error: unknown) {
      return this.mapError(res, error, "Erro ao iniciar sync do GrpPro");
    }
  };

  private mapError(
    res: Response,
    error: unknown,
    fallbackMessage: string,
  ): Response {
    if (error instanceof AppError) {
      console.error(`[grppro-sync-admin] ${error.code}: ${error.message}`);
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
        details: error.details,
      });
    }
    console.error("[grppro-sync-admin] unexpected error", error);
    return res.status(500).json({
      error: fallbackMessage,
      code: "INTERNAL_ERROR",
    });
  }
}
