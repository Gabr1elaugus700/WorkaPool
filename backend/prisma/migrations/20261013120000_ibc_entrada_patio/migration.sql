-- AlterEnum
ALTER TYPE "IbcCustodia" ADD VALUE 'ENTRADA';

-- CreateEnum
CREATE TYPE "EntradaPatioOrigem" AS ENUM ('RETORNO', 'TROCA');

-- CreateEnum
CREATE TYPE "EntradaPatioStatus" AS ENUM ('PENDENTE', 'CONCLUIDA');

-- CreateTable
CREATE TABLE "EntradaPatioIbc" (
    "id" TEXT NOT NULL,
    "ibcId" TEXT NOT NULL,
    "origem" "EntradaPatioOrigem" NOT NULL,
    "status" "EntradaPatioStatus" NOT NULL DEFAULT 'PENDENTE',
    "abertoPorId" TEXT NOT NULL,
    "abertoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidoPorId" TEXT,
    "concluidoEm" TIMESTAMP(3),

    CONSTRAINT "EntradaPatioIbc_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "IbcInspecao" ADD COLUMN "entradaPatioId" TEXT;

-- CreateIndex
CREATE INDEX "EntradaPatioIbc_ibcId_status_idx" ON "EntradaPatioIbc"("ibcId", "status");

-- CreateIndex
CREATE INDEX "EntradaPatioIbc_status_abertoEm_idx" ON "EntradaPatioIbc"("status", "abertoEm");

-- Uma entrada pendente por IBC. Concluídas permanecem como histórico.
CREATE UNIQUE INDEX "EntradaPatioIbc_ibcId_pendente_key" ON "EntradaPatioIbc"("ibcId") WHERE "status" = 'PENDENTE';

-- CreateIndex
CREATE INDEX "IbcInspecao_entradaPatioId_idx" ON "IbcInspecao"("entradaPatioId");

-- AddForeignKey
ALTER TABLE "EntradaPatioIbc" ADD CONSTRAINT "EntradaPatioIbc_ibcId_fkey" FOREIGN KEY ("ibcId") REFERENCES "Ibc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntradaPatioIbc" ADD CONSTRAINT "EntradaPatioIbc_abertoPorId_fkey" FOREIGN KEY ("abertoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntradaPatioIbc" ADD CONSTRAINT "EntradaPatioIbc_concluidoPorId_fkey" FOREIGN KEY ("concluidoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IbcInspecao" ADD CONSTRAINT "IbcInspecao_entradaPatioId_fkey" FOREIGN KEY ("entradaPatioId") REFERENCES "EntradaPatioIbc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
