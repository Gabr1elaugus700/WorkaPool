CREATE TABLE "IbcProduto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "abreviacao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IbcProduto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IbcProduto_abreviacao_key" ON "IbcProduto"("abreviacao");

ALTER TABLE "Ibc" ADD COLUMN "produtoId" TEXT;

CREATE INDEX "Ibc_produtoId_idx" ON "Ibc"("produtoId");

ALTER TABLE "Ibc"
ADD CONSTRAINT "Ibc_produtoId_fkey"
FOREIGN KEY ("produtoId") REFERENCES "IbcProduto"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
