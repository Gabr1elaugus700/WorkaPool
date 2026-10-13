-- AlterEnum
ALTER TYPE "IbcCustodia" ADD VALUE 'CLIENTE';

-- CreateEnum
CREATE TYPE "IbcMotivoBaixa" AS ENUM ('VENDA', 'TROCA');
CREATE TYPE "ConciliacaoDestinoIbc" AS ENUM ('FICOU', 'RETORNOU', 'TROCA');
CREATE TYPE "ConciliacaoModalidadeIbc" AS ENUM ('VENDA', 'EMPRESTIMO');

-- AlterTable
ALTER TABLE "Ibc" ADD COLUMN "motivoBaixa" "IbcMotivoBaixa",
ADD COLUMN "baixaViagemEm" TIMESTAMP(3),
ADD COLUMN "trocaEntradaId" TEXT;

ALTER TABLE "AlocacaoIbc" ADD COLUMN "encerradaEm" TIMESTAMP(3),
ADD COLUMN "emprestimoIniciadoEm" TIMESTAMP(3),
ADD COLUMN "emprestimoVenceEm" TIMESTAMP(3);

ALTER TABLE "ExpedicaoIbc" ADD COLUMN "viagemFechadaPorId" TEXT,
ADD COLUMN "viagemFechadaEm" TIMESTAMP(3);

-- Alocação aberta continua única; encerrada fica como histórico e libera o IBC.
DROP INDEX "AlocacaoIbc_ibcId_key";
CREATE UNIQUE INDEX "AlocacaoIbc_ibcId_aberta_key" ON "AlocacaoIbc"("ibcId") WHERE "encerradaEm" IS NULL;
CREATE INDEX "AlocacaoIbc_ibcId_idx" ON "AlocacaoIbc"("ibcId");
CREATE UNIQUE INDEX "Ibc_trocaEntradaId_key" ON "Ibc"("trocaEntradaId");

-- CreateTable
CREATE TABLE "ConciliacaoViagemIbc" (
    "id" TEXT NOT NULL,
    "expedicaoIbcId" TEXT NOT NULL,
    "alocacaoIbcId" TEXT NOT NULL,
    "destino" "ConciliacaoDestinoIbc" NOT NULL,
    "modalidade" "ConciliacaoModalidadeIbc",
    "ibcEntradaId" TEXT,
    "lancadoPorId" TEXT NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConciliacaoViagemIbc_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConciliacaoRetornoSemId" (
    "id" TEXT NOT NULL,
    "expedicaoIbcId" TEXT NOT NULL,
    "chaveCliente" TEXT NOT NULL,
    "quantidadePapel" INTEGER NOT NULL,
    "confirmouDivergencia" BOOLEAN NOT NULL DEFAULT false,
    "lancadoPorId" TEXT NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConciliacaoRetornoSemId_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConciliacaoViagemIbc_alocacaoIbcId_key" ON "ConciliacaoViagemIbc"("alocacaoIbcId");
CREATE UNIQUE INDEX "ConciliacaoViagemIbc_ibcEntradaId_key" ON "ConciliacaoViagemIbc"("ibcEntradaId");
CREATE INDEX "ConciliacaoViagemIbc_expedicaoIbcId_idx" ON "ConciliacaoViagemIbc"("expedicaoIbcId");
CREATE UNIQUE INDEX "ConciliacaoRetornoSemId_expedicaoIbcId_chaveCliente_key" ON "ConciliacaoRetornoSemId"("expedicaoIbcId", "chaveCliente");

-- AddForeignKey
ALTER TABLE "Ibc" ADD CONSTRAINT "Ibc_trocaEntradaId_fkey" FOREIGN KEY ("trocaEntradaId") REFERENCES "Ibc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpedicaoIbc" ADD CONSTRAINT "ExpedicaoIbc_viagemFechadaPorId_fkey" FOREIGN KEY ("viagemFechadaPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConciliacaoViagemIbc" ADD CONSTRAINT "ConciliacaoViagemIbc_expedicaoIbcId_fkey" FOREIGN KEY ("expedicaoIbcId") REFERENCES "ExpedicaoIbc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConciliacaoViagemIbc" ADD CONSTRAINT "ConciliacaoViagemIbc_alocacaoIbcId_fkey" FOREIGN KEY ("alocacaoIbcId") REFERENCES "AlocacaoIbc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConciliacaoViagemIbc" ADD CONSTRAINT "ConciliacaoViagemIbc_ibcEntradaId_fkey" FOREIGN KEY ("ibcEntradaId") REFERENCES "Ibc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConciliacaoViagemIbc" ADD CONSTRAINT "ConciliacaoViagemIbc_lancadoPorId_fkey" FOREIGN KEY ("lancadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConciliacaoRetornoSemId" ADD CONSTRAINT "ConciliacaoRetornoSemId_expedicaoIbcId_fkey" FOREIGN KEY ("expedicaoIbcId") REFERENCES "ExpedicaoIbc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConciliacaoRetornoSemId" ADD CONSTRAINT "ConciliacaoRetornoSemId_lancadoPorId_fkey" FOREIGN KEY ("lancadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
