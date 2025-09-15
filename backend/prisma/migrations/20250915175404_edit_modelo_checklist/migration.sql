-- DropForeignKey
ALTER TABLE "ChecklistModelo" DROP CONSTRAINT "ChecklistModelo_departamento_id_fkey";

-- AlterTable
ALTER TABLE "ChecklistModelo" ALTER COLUMN "departamento_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ChecklistModelo" ADD CONSTRAINT "ChecklistModelo_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
