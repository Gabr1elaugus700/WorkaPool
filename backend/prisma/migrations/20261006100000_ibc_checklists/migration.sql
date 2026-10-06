-- CreateEnum
CREATE TYPE "ChecklistTipo" AS ENUM ('VISTORIA', 'IBC');

-- AlterTable
ALTER TABLE "ChecklistItem" ADD COLUMN "critico" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ChecklistModelo" ADD COLUMN "tipo" "ChecklistTipo" NOT NULL DEFAULT 'VISTORIA',
ADD COLUMN "notaMinimaCritico" DOUBLE PRECISION,
ADD COLUMN "mediaMinima" DOUBLE PRECISION,
ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ChecklistModeloItem" ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "ChecklistModelo_tipo_idx" ON "ChecklistModelo"("tipo");
