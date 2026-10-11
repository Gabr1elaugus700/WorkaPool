-- AlterEnum
ALTER TYPE "IbcMotivoInaptidao" ADD VALUE 'INSPECAO_REPROVADA';

-- CreateEnum
CREATE TYPE "IbcInspecaoResultado" AS ENUM ('APROVADA', 'REPROVADA');

-- CreateTable
CREATE TABLE "IbcInspecao" (
    "id" TEXT NOT NULL,
    "ibcId" TEXT NOT NULL,
    "checklistModeloId" TEXT NOT NULL,
    "resultado" "IbcInspecaoResultado" NOT NULL,
    "mediaObtida" DOUBLE PRECISION,
    "notaMinimaCritico" DOUBLE PRECISION NOT NULL,
    "mediaMinima" DOUBLE PRECISION NOT NULL,
    "inspetorId" TEXT NOT NULL,
    "inspecionadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,

    CONSTRAINT "IbcInspecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IbcInspecaoResposta" (
    "id" TEXT NOT NULL,
    "inspecaoId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "critico" BOOLEAN NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "IbcInspecaoResposta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IbcInspecao_ibcId_checklistModeloId_inspecionadoEm_idx" ON "IbcInspecao"("ibcId", "checklistModeloId", "inspecionadoEm");

-- CreateIndex
CREATE INDEX "IbcInspecao_checklistModeloId_idx" ON "IbcInspecao"("checklistModeloId");

-- CreateIndex
CREATE INDEX "IbcInspecao_inspetorId_idx" ON "IbcInspecao"("inspetorId");

-- CreateIndex
CREATE UNIQUE INDEX "IbcInspecaoResposta_inspecaoId_checklistItemId_key" ON "IbcInspecaoResposta"("inspecaoId", "checklistItemId");

-- CreateIndex
CREATE INDEX "IbcInspecaoResposta_checklistItemId_idx" ON "IbcInspecaoResposta"("checklistItemId");

-- AddForeignKey
ALTER TABLE "IbcInspecao" ADD CONSTRAINT "IbcInspecao_ibcId_fkey" FOREIGN KEY ("ibcId") REFERENCES "Ibc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IbcInspecao" ADD CONSTRAINT "IbcInspecao_checklistModeloId_fkey" FOREIGN KEY ("checklistModeloId") REFERENCES "ChecklistModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IbcInspecao" ADD CONSTRAINT "IbcInspecao_inspetorId_fkey" FOREIGN KEY ("inspetorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IbcInspecaoResposta" ADD CONSTRAINT "IbcInspecaoResposta_inspecaoId_fkey" FOREIGN KEY ("inspecaoId") REFERENCES "IbcInspecao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IbcInspecaoResposta" ADD CONSTRAINT "IbcInspecaoResposta_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
