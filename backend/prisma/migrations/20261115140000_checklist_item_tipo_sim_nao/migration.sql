-- CreateEnum
CREATE TYPE "ChecklistItemTipo" AS ENUM ('NUMERICO', 'SIM_NAO');

-- CreateEnum
CREATE TYPE "ChecklistItemRespostaEsperada" AS ENUM ('SIM', 'NAO');

-- AlterTable
ALTER TABLE "ChecklistItem" ADD COLUMN "tipo" "ChecklistItemTipo" NOT NULL DEFAULT 'NUMERICO',
ADD COLUMN "respostaEsperada" "ChecklistItemRespostaEsperada",
ADD COLUMN "bloqueante" BOOLEAN;