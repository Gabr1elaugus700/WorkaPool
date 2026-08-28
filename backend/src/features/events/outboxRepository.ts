import type { PrismaClient } from "@prisma/client";
import prismaInstance from "../../config/prisma";

export type OutboxEventRecord = {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: unknown;
  occurredAt: Date;
  createdAt: Date;
  publishedAt: Date | null;
  attempts: number;
  lastError: string | null;
  lockedAt: Date | null;
};

export class OutboxRepository {
  constructor(private readonly prisma: PrismaClient = prismaInstance) {}

  async claimNext(): Promise<OutboxEventRecord | null> {
    const lockExpiration = new Date(Date.now() - 60_000);

    return this.prisma.$transaction(async (tx) => {
      const event = await tx.outboxEvent.findFirst({
        where: {
          publishedAt: null,
          OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiration } }],
        },
        orderBy: { createdAt: "asc" },
      });

      if (!event) return null;

      const claimed = await tx.outboxEvent.updateMany({
        where: {
          id: event.id,
          publishedAt: null,
          OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiration } }],
        },
        data: { lockedAt: new Date() },
      });

      return claimed.count === 1 ? this.toRecord(event) : null;
    });
  }

  async markPublished(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        publishedAt: new Date(),
        lockedAt: null,
        lastError: null,
      },
    });
  }

  async markFailed(id: string, error: unknown): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        lastError: error instanceof Error ? error.message : "Erro desconhecido",
        lockedAt: null,
      },
    });
  }

  private toRecord(event: {
    id: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: unknown;
    occurredAt: Date;
    createdAt: Date;
    publishedAt: Date | null;
    attempts: number;
    lastError: string | null;
    lockedAt: Date | null;
  }): OutboxEventRecord {
    return event;
  }
}
