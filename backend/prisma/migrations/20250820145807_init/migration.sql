/*
  Warnings:

  - A unique constraint covering the columns `[rota_base_id,caminhao_id]` on the table `CaminhaoRota` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CargasFechadas" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "CaminhaoRota_rota_base_id_caminhao_id_key" ON "CaminhaoRota"("rota_base_id", "caminhao_id");
