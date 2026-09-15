import * as cron from "node-cron";
import { AppError } from "../../utils/AppError";
import { OverviewCustomerSyncPipeline } from "../../features/overviewCustomer/sync/OverviewCustomerSyncPipeline";
import { overviewCustomerSyncConfig } from "./overviewCustomerSyncConfig";

interface OverviewCustomerSyncSchedulerDependencies {
  pipeline: Pick<OverviewCustomerSyncPipeline, "run">;
}

export class OverviewCustomerSyncScheduler {
  private task: cron.ScheduledTask | null = null;
  private isRunning = false;
  private taskInFlight = false;

  constructor(private readonly deps: OverviewCustomerSyncSchedulerDependencies) {}

  public start(): void {
    if (!overviewCustomerSyncConfig.enabled) {
      console.log("⚠️  Overview sync scheduler desabilitado nas configurações");
      return;
    }

    if (this.isRunning) {
      console.log("⚠️  Overview sync scheduler já está em execução");
      return;
    }

    this.task = cron.schedule(
      overviewCustomerSyncConfig.cronExpression,
      async () => {
        await this.tick();
      },
      { timezone: overviewCustomerSyncConfig.timezone },
    );
    this.isRunning = true;
    console.log(
      `🕒 Overview sync scheduler iniciado (${overviewCustomerSyncConfig.cronExpression}, ${overviewCustomerSyncConfig.timezone})`,
    );
  }

  public stop(): void {
    if (!this.task) {
      return;
    }
    this.task.stop();
    this.isRunning = false;
    console.log("🛑 Overview sync scheduler parado");
  }

  public getStatus(): boolean {
    return this.isRunning;
  }

  public async tick(): Promise<void> {
    if (this.taskInFlight) {
      console.log("⚠️  Overview sync ignorou tick: run anterior ainda em execução");
      return;
    }

    this.taskInFlight = true;
    const startedAt = Date.now();

    try {
      console.log("🔄 Overview sync: iniciando run agendado");
      const result = await this.deps.pipeline.run();
      const duration = Date.now() - startedAt;
      console.log(
        `✅ Overview sync: run ${result.run.id} concluído com status ${result.run.status} em ${duration}ms`,
      );
    } catch (error: unknown) {
      const duration = Date.now() - startedAt;
      if (error instanceof AppError && error.code === "OVERVIEW_SYNC_ALREADY_RUNNING") {
        console.log("⚠️  Overview sync: run já ativo, tick ignorado");
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `❌ Overview sync: falha no run agendado após ${duration}ms - ${message}`,
      );
    } finally {
      this.taskInFlight = false;
    }
  }
}
