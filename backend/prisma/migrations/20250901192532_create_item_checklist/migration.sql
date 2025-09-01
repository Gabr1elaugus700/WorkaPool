/*
  Warnings:

  - You are about to drop the column `descricao` on the `ChecklistModelo` table. All the data in the column will be lost.
  - You are about to drop the column `checklist_id` on the `ChecklistVistoria` table. All the data in the column will be lost.
  - You are about to drop the column `ordemServico_id` on the `ChecklistVistoria` table. All the data in the column will be lost.
  - Added the required column `nome` to the `ChecklistModelo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `checklistItemId` to the `ChecklistVistoria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `checklistModeloId` to the `ChecklistVistoria` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChecklistVistoria" DROP CONSTRAINT "ChecklistVistoria_checklist_id_fkey";

-- DropForeignKey
ALTER TABLE "ChecklistVistoria" DROP CONSTRAINT "ChecklistVistoria_ordemServico_id_fkey";

-- AlterTable
ALTER TABLE "ChecklistModelo" DROP COLUMN "descricao",
ADD COLUMN     "nome" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ChecklistVistoria" DROP COLUMN "checklist_id",
DROP COLUMN "ordemServico_id",
ADD COLUMN     "checklistItemId" TEXT NOT NULL,
ADD COLUMN     "checklistModeloId" TEXT NOT NULL,
ADD COLUMN     "ordemServicoId" TEXT;

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistModeloItem" (
    "id" TEXT NOT NULL,
    "checklistModeloId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,

    CONSTRAINT "ChecklistModeloItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistModeloItem_checklistModeloId_checklistItemId_key" ON "ChecklistModeloItem"("checklistModeloId", "checklistItemId");

-- AddForeignKey
ALTER TABLE "ChecklistModeloItem" ADD CONSTRAINT "ChecklistModeloItem_checklistModeloId_fkey" FOREIGN KEY ("checklistModeloId") REFERENCES "ChecklistModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistModeloItem" ADD CONSTRAINT "ChecklistModeloItem_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistVistoria" ADD CONSTRAINT "ChecklistVistoria_checklistModeloId_fkey" FOREIGN KEY ("checklistModeloId") REFERENCES "ChecklistModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistVistoria" ADD CONSTRAINT "ChecklistVistoria_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistVistoria" ADD CONSTRAINT "ChecklistVistoria_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
