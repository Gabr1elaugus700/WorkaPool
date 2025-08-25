/*
  Warnings:

  - A unique constraint covering the columns `[rota_base_id,caminhao_id]` on the table `CaminhaoRota` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StatusOrdemServico" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MANUTENCAO';

-- AlterTable
ALTER TABLE "CargasFechadas" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "OrdemServico" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "status" "StatusOrdemServico" NOT NULL DEFAULT 'ABERTA',
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_conclusao" TIMESTAMP(3),
    "email_solicitante" TEXT NOT NULL,
    "id_solicitante" TEXT,

    CONSTRAINT "OrdemServico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaminhaoRota_rota_base_id_caminhao_id_key" ON "CaminhaoRota"("rota_base_id", "caminhao_id");

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_id_solicitante_fkey" FOREIGN KEY ("id_solicitante") REFERENCES "User"("user") ON DELETE SET NULL ON UPDATE CASCADE;
