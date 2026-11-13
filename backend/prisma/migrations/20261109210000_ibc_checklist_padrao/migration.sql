-- CreateEnum
CREATE TYPE "IbcChecklistSituacao" AS ENUM ('ENTRADA_PATIO');

-- AlterTable
ALTER TABLE "IbcChecklistVinculo" ADD COLUMN "situacao" "IbcChecklistSituacao" NOT NULL DEFAULT 'ENTRADA_PATIO';

-- CreateTable
CREATE TABLE "IbcChecklistPadrao" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "checklistModeloId" TEXT NOT NULL,
    "situacao" "IbcChecklistSituacao" NOT NULL DEFAULT 'ENTRADA_PATIO',
    "vinculadoPorId" TEXT NOT NULL,
    "vinculadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IbcChecklistPadrao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IbcChecklistPadrao_checklistModeloId_idx" ON "IbcChecklistPadrao"("checklistModeloId");

-- CreateIndex
CREATE UNIQUE INDEX "IbcChecklistPadrao_produtoId_checklistModeloId_situacao_key" ON "IbcChecklistPadrao"("produtoId", "checklistModeloId", "situacao");

-- AddForeignKey
ALTER TABLE "IbcChecklistPadrao" ADD CONSTRAINT "IbcChecklistPadrao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "IbcProduto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IbcChecklistPadrao" ADD CONSTRAINT "IbcChecklistPadrao_checklistModeloId_fkey" FOREIGN KEY ("checklistModeloId") REFERENCES "ChecklistModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IbcChecklistPadrao" ADD CONSTRAINT "IbcChecklistPadrao_vinculadoPorId_fkey" FOREIGN KEY ("vinculadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
