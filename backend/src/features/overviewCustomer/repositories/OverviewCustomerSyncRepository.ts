import { PrismaClient, Prisma } from "@prisma/client";
import type { IOverviewCustomerSyncRepository } from "./IOverviewCustomerSyncRepository";
import type {
  OverviewSnapshot,
  SyncRunRecord,
  SyncRunStatus,
  SyncStepRecord,
  SyncStepStatus,
} from "../sync/types";

type RunRow = {
  id: string;
  status: SyncRunStatus;
  startedAt: Date;
  finishedAt: Date | null;
  errorSummary: string | null;
  steps: Array<{
    name: string;
    status: SyncStepStatus;
    attemptCount: number;
    lastError: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
  }>;
};

const META_ID = 1;

export class OverviewCustomerSyncRepository
  implements IOverviewCustomerSyncRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async getActiveRun(): Promise<SyncRunRecord | null> {
    const run = await this.prisma.overviewCustomerSyncRun.findFirst({
      where: { status: "RUNNING" },
      include: { steps: { orderBy: { name: "asc" } } },
    });
    return run ? this.toRunRecord(run) : null;
  }

  async createRun(stepNames: string[]): Promise<SyncRunRecord> {
    const startedAt = new Date();
    const run = await this.prisma.overviewCustomerSyncRun.create({
      data: {
        status: "RUNNING",
        startedAt,
        steps: {
          create: stepNames.map((name) => ({
            name,
            status: "PENDING",
            attemptCount: 0,
          })),
        },
      },
      include: { steps: true },
    });
    return this.toRunRecord(run);
  }

  async updateStep(runId: string, step: SyncStepRecord): Promise<void> {
    await this.prisma.overviewCustomerSyncStep.update({
      where: {
        runId_name: { runId, name: step.name },
      },
      data: {
        status: step.status,
        attemptCount: step.attemptCount,
        lastError: step.lastError ?? null,
        startedAt: step.startedAt ?? null,
        finishedAt: step.finishedAt ?? null,
      },
    });
  }

  async completeRun(
    runId: string,
    status: "SUCCEEDED" | "FAILED",
    errorSummary?: string,
  ): Promise<SyncRunRecord> {
    const run = await this.prisma.overviewCustomerSyncRun.update({
      where: { id: runId },
      data: {
        status,
        finishedAt: new Date(),
        errorSummary: errorSummary ?? null,
      },
      include: { steps: true },
    });
    return this.toRunRecord(run);
  }

  async reopenRun(runId: string): Promise<SyncRunRecord> {
    const run = await this.prisma.overviewCustomerSyncRun.update({
      where: { id: runId },
      data: {
        status: "RUNNING",
        finishedAt: null,
        errorSummary: null,
      },
      include: { steps: true },
    });
    return this.toRunRecord(run);
  }

  async getRun(runId: string): Promise<SyncRunRecord | null> {
    const run = await this.prisma.overviewCustomerSyncRun.findUnique({
      where: { id: runId },
      include: { steps: true },
    });
    return run ? this.toRunRecord(run) : null;
  }

  async listRuns(limit = 50): Promise<SyncRunRecord[]> {
    const runs = await this.prisma.overviewCustomerSyncRun.findMany({
      take: limit,
      orderBy: { startedAt: "desc" },
      include: { steps: true },
    });
    return runs.map((run) => this.toRunRecord(run));
  }

  async getServedSnapshot(): Promise<OverviewSnapshot | null> {
    const meta = await this.ensureMeta();
    if (!meta.servedSnapshotId) {
      return null;
    }
    const snapshot = await this.prisma.overviewCustomerSnapshot.findUnique({
      where: { id: meta.servedSnapshotId },
    });
    if (!snapshot) {
      return null;
    }
    return {
      id: snapshot.id,
      publishedAt: snapshot.publishedAt,
      payload: snapshot.payload,
    };
  }

  async getLastSuccessfulSyncAt(): Promise<Date | null> {
    const meta = await this.ensureMeta();
    return meta.lastSuccessfulSyncAt;
  }

  async publishSnapshot(
    payload: unknown,
    successAt: Date,
  ): Promise<OverviewSnapshot> {
    const snapshot = await this.prisma.overviewCustomerSnapshot.create({
      data: {
        publishedAt: successAt,
        payload: payload as Prisma.InputJsonValue,
      },
    });

    await this.prisma.overviewCustomerSyncMeta.upsert({
      where: { id: META_ID },
      create: {
        id: META_ID,
        lastSuccessfulSyncAt: successAt,
        servedSnapshotId: snapshot.id,
      },
      update: {
        lastSuccessfulSyncAt: successAt,
        servedSnapshotId: snapshot.id,
      },
    });

    return {
      id: snapshot.id,
      publishedAt: snapshot.publishedAt,
      payload: snapshot.payload,
    };
  }

  async seedSuccessfulSnapshot(
    snapshot: OverviewSnapshot,
    lastSuccessfulSyncAt: Date,
  ): Promise<void> {
    await this.prisma.overviewCustomerSnapshot.create({
      data: {
        id: snapshot.id,
        publishedAt: snapshot.publishedAt,
        payload: snapshot.payload as Prisma.InputJsonValue,
      },
    });
    await this.prisma.overviewCustomerSyncMeta.upsert({
      where: { id: META_ID },
      create: {
        id: META_ID,
        lastSuccessfulSyncAt,
        servedSnapshotId: snapshot.id,
      },
      update: {
        lastSuccessfulSyncAt,
        servedSnapshotId: snapshot.id,
      },
    });
  }

  private async ensureMeta(): Promise<{
    lastSuccessfulSyncAt: Date | null;
    servedSnapshotId: string | null;
  }> {
    return this.prisma.overviewCustomerSyncMeta.upsert({
      where: { id: META_ID },
      create: { id: META_ID },
      update: {},
    });
  }

  private toRunRecord(run: RunRow): SyncRunRecord {
    return {
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt ?? undefined,
      errorSummary: run.errorSummary ?? undefined,
      steps: run.steps.map((step) => ({
        name: step.name,
        status: step.status,
        attemptCount: step.attemptCount,
        lastError: step.lastError ?? undefined,
        startedAt: step.startedAt ?? undefined,
        finishedAt: step.finishedAt ?? undefined,
      })),
    };
  }
}
