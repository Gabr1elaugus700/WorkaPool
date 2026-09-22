import { Request, Response } from "express";
import { AppError } from "../../../../utils/AppError";
import type { GetOverviewSyncRunUseCase } from "../../useCases/GetOverviewSyncRunUseCase";
import type { GetOverviewSyncStatusUseCase } from "../../useCases/GetOverviewSyncStatusUseCase";
import type { ListOverviewSyncRunsUseCase } from "../../useCases/ListOverviewSyncRunsUseCase";
import type { RetryOverviewSyncFailedStepUseCase } from "../../useCases/RetryOverviewSyncFailedStepUseCase";
import type { StartOverviewSyncUseCase } from "../../useCases/StartOverviewSyncUseCase";

export type OverviewSyncAdminControllerDeps = {
  getStatus: GetOverviewSyncStatusUseCase;
  listRuns: ListOverviewSyncRunsUseCase;
  getRun: GetOverviewSyncRunUseCase;
  retryFailedStep: RetryOverviewSyncFailedStepUseCase;
  startSync: StartOverviewSyncUseCase;
};

export class OverviewSyncAdminController {
  constructor(private readonly deps: OverviewSyncAdminControllerDeps) {}

  getStatus = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const status = await this.deps.getStatus.execute();
      return res.status(200).json({
        lastSuccessfulSyncAt: status.lastSuccessfulSyncAt,
        servedSnapshotId: status.servedSnapshotId,
        activeRunId: status.activeRunId,
      });
    } catch (error: unknown) {
      return this.mapError(res, error, "Erro ao buscar status do sync Overview");
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
          code: "OVERVIEW_SYNC_INVALID_LIMIT",
        });
      }
      const runs = await this.deps.listRuns.execute(limit);
      return res.status(200).json({ runs });
    } catch (error: unknown) {
      return this.mapError(res, error, "Erro ao listar runs do sync Overview");
    }
  };

  getRun = async (req: Request, res: Response): Promise<Response> => {
    try {
      const runId = String(req.params.runId ?? "");
      if (!runId) {
        return res.status(400).json({
          error: "runId é obrigatório",
          code: "OVERVIEW_SYNC_INVALID_RUN_ID",
        });
      }
      const run = await this.deps.getRun.execute(runId);
      return res.status(200).json({ run });
    } catch (error: unknown) {
      return this.mapError(res, error, "Erro ao buscar run do sync Overview");
    }
  };

  retryFailedStep = async (req: Request, res: Response): Promise<Response> => {
    try {
      const runId = String(req.params.runId ?? "");
      const stepName = String(req.params.stepName ?? "");
      if (!runId || !stepName) {
        return res.status(400).json({
          error: "runId e stepName são obrigatórios",
          code: "OVERVIEW_SYNC_INVALID_RETRY_PARAMS",
        });
      }
      const result = await this.deps.retryFailedStep.execute(runId, stepName);
      return res.status(200).json(result);
    } catch (error: unknown) {
      return this.mapError(
        res,
        error,
        "Erro ao retentar step do sync Overview",
      );
    }
  };

  startSync = async (_req: Request, res: Response): Promise<Response> => {
    try {
      console.log("🔄 [overview-sync-admin] Manual sync trigger requested");
      const result = await this.deps.startSync.execute();
      return res.status(202).json(result);
    } catch (error: unknown) {
      return this.mapError(res, error, "Erro ao iniciar sync do Overview");
    }
  };

  private mapError(
    res: Response,
    error: unknown,
    fallbackMessage: string,
  ): Response {
    if (error instanceof AppError) {
      console.error(`[overview-sync-admin] ${error.code}: ${error.message}`);
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
        details: error.details,
      });
    }
    console.error("[overview-sync-admin] unexpected error", error);
    return res.status(500).json({
      error: fallbackMessage,
      code: "INTERNAL_ERROR",
    });
  }
}
