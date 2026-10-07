-- CreateTable
CREATE TABLE "IbcChecklistVinculo" (
    "id" TEXT NOT NULL,
    "ibcId" TEXT NOT NULL,
    "checklistModeloId" TEXT NOT NULL,
    "vinculadoPorId" TEXT NOT NULL,
    "vinculadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IbcChecklistVinculo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IbcChecklistVinculo_checklistModeloId_idx" ON "IbcChecklistVinculo"("checklistModeloId");

-- CreateIndex
CREATE UNIQUE INDEX "IbcChecklistVinculo_ibcId_checklistModeloId_key" ON "IbcChecklistVinculo"("ibcId", "checklistModeloId");

-- AddForeignKey
ALTER TABLE "IbcChecklistVinculo" ADD CONSTRAINT "IbcChecklistVinculo_ibcId_fkey" FOREIGN KEY ("ibcId") REFERENCES "Ibc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IbcChecklistVinculo" ADD CONSTRAINT "IbcChecklistVinculo_checklistModeloId_fkey" FOREIGN KEY ("checklistModeloId") REFERENCES "ChecklistModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
