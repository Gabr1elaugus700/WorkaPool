/**
 * Prisma Client único, gerado a partir de prisma/schema.prisma.
 */

import { Prisma, PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: ['error'],
    });
  }
  return prismaInstance;
}

export { PrismaClient, Prisma };
export default getPrismaClient();
