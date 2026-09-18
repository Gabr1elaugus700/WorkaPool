import { PrismaClient } from "@prisma/client";
import type { GrpproSyncStore } from "../sync/ports";
import type { GrpproSyncRunRecord, GrpproSyncRunStatus } from "../sync/types";

const META_ID = 1;

type RunRow = {
  id: string;
  status: GrpproSyncRunStatus;
  startedAt: Date;
  finishedAt: Date | null;
  rowCount: number | null;
  error: string | null;
};

export class GrpproSyncRepository implements GrpproSyncStore {
  constructor(private readonly prisma: PrismaClient) {}

  async getActiveRun(): Promise<GrpproSyncRunRecord | null> {
    const run = await this.prisma.grpproSyncRun.findFirst({
      where: { status: "RUNNING" },
    });
    return run ? this.toRunRecord(run) : null;
  }

  async createRun(): Promise<GrpproSyncRunRecord> {
    const run = await this.prisma.grpproSyncRun.create({
      data: {
        status: "RUNNING",
        startedAt: new Date(),
      },
    });
    return this.toRunRecord(run);
  }

  async completeRun(
    runId: string,
    status: "SUCCEEDED" | "FAILED",
    params?: { rowCount?: number; error?: string },
  ): Promise<GrpproSyncRunRecord> {
    const run = await this.prisma.grpproSyncRun.update({
      where: { id: runId },
      data: {
        status,
        finishedAt: new Date(),
        rowCount: params?.rowCount ?? null,
        error: params?.error ?? null,
      },
    });
    return this.toRunRecord(run);
  }

  async getRun(runId: string): Promise<GrpproSyncRunRecord | null> {
    const run = await this.prisma.grpproSyncRun.findUnique({
      where: { id: runId },
    });
    return run ? this.toRunRecord(run) : null;
  }

  async listRuns(limit = 50): Promise<GrpproSyncRunRecord[]> {
    const runs = await this.prisma.grpproSyncRun.findMany({
      take: limit,
      orderBy: { startedAt: "desc" },
    });
    return runs.map((run) => this.toRunRecord(run));
  }

  async getLastSuccessfulSyncAt(): Promise<Date | null> {
    const meta = await this.prisma.grpproSyncMeta.findUnique({
      where: { id: META_ID },
    });
    return meta?.lastSuccessfulSyncAt ?? null;
  }

  async getLastRowCount(): Promise<number | null> {
    const meta = await this.prisma.grpproSyncMeta.findUnique({
      where: { id: META_ID },
    });
    return meta?.lastRowCount ?? null;
  }

  async updateMetaAfterSuccess(syncedAt: Date, rowCount: number): Promise<void> {
    await this.prisma.grpproSyncMeta.upsert({
      where: { id: META_ID },
      create: {
        id: META_ID,
        lastSuccessfulSyncAt: syncedAt,
        lastRowCount: rowCount,
      },
      update: {
        lastSuccessfulSyncAt: syncedAt,
        lastRowCount: rowCount,
      },
    });
  }

  private toRunRecord(run: RunRow): GrpproSyncRunRecord {
    return {
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt ?? undefined,
      rowCount: run.rowCount ?? undefined,
      error: run.error ?? undefined,
    };
  }
}
