/**
 * Arquivo centralizador do Prisma Client
 * Usa o client correto baseado no NODE_ENV
 *
 * - development: usa src/generated/prisma-dev
 * - production: usa @prisma/client
 */

import { PrismaClient as ProductionPrismaClient } from "@prisma/client";

const isDevelopment = process.env.NODE_ENV === "development";

type PrismaClientConstructor = new (
  ...args: ConstructorParameters<typeof ProductionPrismaClient>
) => ProductionPrismaClient;

const loadPrismaClientConstructor = (): PrismaClientConstructor => {
  if (isDevelopment) {
    const devPrisma = require("../generated/prisma-dev") as {
      PrismaClient: PrismaClientConstructor;
    };
    return devPrisma.PrismaClient;
  }

  return ProductionPrismaClient;
};

let prismaInstance: ProductionPrismaClient | null = null;

export function getPrismaClient(): ProductionPrismaClient {
  if (!prismaInstance) {
    const PrismaClient = loadPrismaClientConstructor();
    prismaInstance = new PrismaClient({
      log: ["error"],
    });
  }
  return prismaInstance;
}

export default getPrismaClient();
