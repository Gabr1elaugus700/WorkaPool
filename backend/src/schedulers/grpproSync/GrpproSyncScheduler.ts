import * as cron from "node-cron";
import { AppError } from "../../utils/AppError";
import { GrpProSyncPipeline } from "../../features/grppro/sync/GrpProSyncPipeline";
import { grpproSyncConfig } from "./grpproSyncConfig";

interface GrpproSyncSchedulerDependencies {
  pipeline: Pick<GrpProSyncPipeline, "run">;
}

export class GrpproSyncScheduler {
  private task: cron.ScheduledTask | null = null;
  private isRunning = false;
  private taskInFlight = false;

  constructor(private readonly deps: GrpproSyncSchedulerDependencies) {}

  public start(): void {
    if (!grpproSyncConfig.enabled) {
      console.log("⚠️  GrpPro sync scheduler desabilitado nas configurações");
      return;
    }

    if (this.isRunning) {
      console.log("⚠️  GrpPro sync scheduler já está em execução");
      return;
    }

    this.task = cron.schedule(
      grpproSyncConfig.cronExpression,
      async () => {
        await this.tick();
      },
      { timezone: grpproSyncConfig.timezone },
    );
    this.isRunning = true;
    console.log(
      `🕒 GrpPro sync scheduler iniciado (${grpproSyncConfig.cronExpression}, ${grpproSyncConfig.timezone})`,
    );
  }

  public stop(): void {
    if (!this.task) {
      return;
    }
    this.task.stop();
    this.isRunning = false;
    console.log("🛑 GrpPro sync scheduler parado");
  }

  public getStatus(): boolean {
    return this.isRunning;
  }

  public async tick(): Promise<void> {
    if (this.taskInFlight) {
      console.log("⚠️  GrpPro sync ignorou tick: run anterior ainda em execução");
      return;
    }

    this.taskInFlight = true;
    const startedAt = Date.now();

    try {
      console.log("🔄 GrpPro sync: iniciando run agendado");
      const result = await this.deps.pipeline.run();
      const duration = Date.now() - startedAt;
      console.log(
        `✅ GrpPro sync: run ${result.run.id} concluído com status ${result.run.status} em ${duration}ms (${result.rowCount ?? 0} linhas)`,
      );
    } catch (error: unknown) {
      const duration = Date.now() - startedAt;
      if (error instanceof AppError && error.code === "GRPPRO_SYNC_ALREADY_RUNNING") {
        console.log("⚠️  GrpPro sync: run já ativo, tick ignorado");
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `❌ GrpPro sync: falha no run agendado após ${duration}ms - ${message}`,
      );
    } finally {
      this.taskInFlight = false;
    }
  }
}
