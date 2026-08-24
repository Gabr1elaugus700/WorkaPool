-- CreateEnum
CREATE TYPE "IbcAptidao" AS ENUM ('APTO', 'INAPTO');

-- CreateEnum
CREATE TYPE "IbcCustodia" AS ENUM ('PATIO', 'EM_VIAGEM');

-- CreateTable
CREATE TABLE "Ibc" (
    "id" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "aptidao" "IbcAptidao" NOT NULL,
    "custodia" "IbcCustodia" NOT NULL DEFAULT 'PATIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ibc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpedicaoIbc" (
    "id" TEXT NOT NULL,
    "cargaId" TEXT NOT NULL,
    "fechadoPorId" TEXT NOT NULL,
    "fechadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpedicaoIbc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlocacaoIbc" (
    "id" TEXT NOT NULL,
    "ibcId" TEXT NOT NULL,
    "cargaId" TEXT NOT NULL,
    "numPed" TEXT NOT NULL,
    "alocadoPorId" TEXT NOT NULL,
    "alocadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expedicaoIbcId" TEXT,

    CONSTRAINT "AlocacaoIbc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ibc_identificador_key" ON "Ibc"("identificador");

-- CreateIndex
CREATE UNIQUE INDEX "ExpedicaoIbc_cargaId_key" ON "ExpedicaoIbc"("cargaId");

-- CreateIndex
CREATE UNIQUE INDEX "AlocacaoIbc_ibcId_key" ON "AlocacaoIbc"("ibcId");

-- CreateIndex
CREATE INDEX "AlocacaoIbc_cargaId_numPed_idx" ON "AlocacaoIbc"("cargaId", "numPed");

-- AddForeignKey
ALTER TABLE "ExpedicaoIbc" ADD CONSTRAINT "ExpedicaoIbc_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "Cargas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpedicaoIbc" ADD CONSTRAINT "ExpedicaoIbc_fechadoPorId_fkey" FOREIGN KEY ("fechadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlocacaoIbc" ADD CONSTRAINT "AlocacaoIbc_ibcId_fkey" FOREIGN KEY ("ibcId") REFERENCES "Ibc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlocacaoIbc" ADD CONSTRAINT "AlocacaoIbc_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "Cargas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlocacaoIbc" ADD CONSTRAINT "AlocacaoIbc_alocadoPorId_fkey" FOREIGN KEY ("alocadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlocacaoIbc" ADD CONSTRAINT "AlocacaoIbc_expedicaoIbcId_fkey" FOREIGN KEY ("expedicaoIbcId") REFERENCES "ExpedicaoIbc"("id") ON DELETE SET NULL ON UPDATE CASCADE;
