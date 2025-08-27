-- AlterTable
ALTER TABLE "OrdemServico" ADD COLUMN     "id_departamento" TEXT;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_id_departamento_fkey" FOREIGN KEY ("id_departamento") REFERENCES "Departamento"("name") ON DELETE SET NULL ON UPDATE CASCADE;
