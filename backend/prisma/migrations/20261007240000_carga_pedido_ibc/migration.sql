-- CreateTable
CREATE TABLE "CargaPedidoIbc" (
    "id" TEXT NOT NULL,
    "cargaId" TEXT NOT NULL,
    "numPed" TEXT NOT NULL,
    "codCli" TEXT,
    "cliente" TEXT NOT NULL,
    "quantidadeEsperadaTotal" INTEGER NOT NULL,
    "quantidadeEsperadaVenda" INTEGER NOT NULL,
    "quantidadeEsperadaEmprestimo" INTEGER NOT NULL,
    "ibcInvalido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CargaPedidoIbc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CargaPedidoIbc_cargaId_idx" ON "CargaPedidoIbc"("cargaId");

-- CreateIndex
CREATE UNIQUE INDEX "CargaPedidoIbc_cargaId_numPed_key" ON "CargaPedidoIbc"("cargaId", "numPed");

-- AddForeignKey
ALTER TABLE "CargaPedidoIbc" ADD CONSTRAINT "CargaPedidoIbc_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "Cargas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
