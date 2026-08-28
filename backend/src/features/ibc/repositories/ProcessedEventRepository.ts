import type { PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";

export class ProcessedEventRepository {
  constructor(private readonly prisma: PrismaClient = prismaInstance) {}

  async tryMarkProcessed(
    consumerName: string,
    eventId: string,
  ): Promise<boolean> {
    try {
      await this.prisma.processedEvent.create({
        data: { consumerName, eventId },
      });
      return true;
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) return false;
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    );
  }
}
