ALTER TABLE "ExpedicaoIbc" ADD COLUMN "chegaramAMais" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ConciliacaoTrocaStage" (
    "id" TEXT NOT NULL,
    "expedicaoIbcId" TEXT NOT NULL,
    "alocacaoIbcId" TEXT NOT NULL,
    "ibcId" TEXT NOT NULL,
    "numPed" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConciliacaoTrocaStage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConciliacaoTrocaStage_alocacaoIbcId_key" ON "ConciliacaoTrocaStage"("alocacaoIbcId");

CREATE INDEX "ConciliacaoTrocaStage_expedicaoIbcId_idx" ON "ConciliacaoTrocaStage"("expedicaoIbcId");

ALTER TABLE "ConciliacaoTrocaStage" ADD CONSTRAINT "ConciliacaoTrocaStage_expedicaoIbcId_fkey" FOREIGN KEY ("expedicaoIbcId") REFERENCES "ExpedicaoIbc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ConciliacaoTrocaStage" ADD CONSTRAINT "ConciliacaoTrocaStage_alocacaoIbcId_fkey" FOREIGN KEY ("alocacaoIbcId") REFERENCES "AlocacaoIbc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ConciliacaoTrocaStage" ADD CONSTRAINT "ConciliacaoTrocaStage_ibcId_fkey" FOREIGN KEY ("ibcId") REFERENCES "Ibc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;