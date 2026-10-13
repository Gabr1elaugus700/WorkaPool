-- CreateTable
CREATE TABLE "AvisoRepresentanteIbc" (
    "id" TEXT NOT NULL,
    "expedicaoIbcId" TEXT NOT NULL,
    "codCar" INTEGER NOT NULL,
    "numPed" TEXT NOT NULL,
    "codCli" TEXT,
    "cliente" TEXT NOT NULL,
    "codRep" INTEGER NOT NULL,
    "itens" JSONB NOT NULL,
    "lidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvisoRepresentanteIbc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvisoRepresentanteIbc_expedicaoIbcId_numPed_key" ON "AvisoRepresentanteIbc"("expedicaoIbcId", "numPed");

-- CreateIndex
CREATE INDEX "AvisoRepresentanteIbc_codRep_createdAt_idx" ON "AvisoRepresentanteIbc"("codRep", "createdAt");

-- AddForeignKey
ALTER TABLE "AvisoRepresentanteIbc" ADD CONSTRAINT "AvisoRepresentanteIbc_expedicaoIbcId_fkey" FOREIGN KEY ("expedicaoIbcId") REFERENCES "ExpedicaoIbc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
