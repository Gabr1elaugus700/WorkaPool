/**
 * Arquivo centralizador do Prisma Client
 * Usa o client correto baseado no NODE_ENV
 * 
 * - development: usa src/generated/prisma-dev
 * - production: usa src/generated/prisma
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// Importa o client correto baseado no ambiente
let PrismaClient: any;
let Prisma: any;

if (isDevelopment) {
  // DEV: usa schema.dev.prisma
  const devPrisma = require('../generated/prisma-dev');
  PrismaClient = devPrisma.PrismaClient;
  Prisma = devPrisma.Prisma;
} else {
  // PROD: usa schema.prisma
  const prodPrisma = require('../generated/prisma');
  PrismaClient = prodPrisma.PrismaClient;
  Prisma = prodPrisma.Prisma;
}

// Singleton instance
let prismaInstance: any = null;

export function getPrismaClient() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: ['error'], // Apenas erros (sem queries)
    });
  }
  return prismaInstance;
}

export { PrismaClient, Prisma };
export default getPrismaClient();
