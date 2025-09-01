/*
  Warnings:

  - You are about to drop the column `responsavel_name` on the `Vistoria` table. All the data in the column will be lost.
  - Added the required column `responsavel_id` to the `Vistoria` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Vistoria" DROP CONSTRAINT "Vistoria_departamento_id_fkey";

-- DropForeignKey
ALTER TABLE "Vistoria" DROP CONSTRAINT "Vistoria_responsavel_name_fkey";

-- AlterTable
ALTER TABLE "Vistoria" DROP COLUMN "responsavel_name",
ADD COLUMN     "responsavel_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ChecklistVistoria" (
    "id" TEXT NOT NULL,
    "vistoria_id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "ordemServico_id" TEXT,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,

    CONSTRAINT "ChecklistVistoria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Vistoria" ADD CONSTRAINT "Vistoria_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vistoria" ADD CONSTRAINT "Vistoria_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistVistoria" ADD CONSTRAINT "ChecklistVistoria_vistoria_id_fkey" FOREIGN KEY ("vistoria_id") REFERENCES "Vistoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistVistoria" ADD CONSTRAINT "ChecklistVistoria_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "ChecklistModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistVistoria" ADD CONSTRAINT "ChecklistVistoria_ordemServico_id_fkey" FOREIGN KEY ("ordemServico_id") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
