/*
  Warnings:

  - You are about to drop the `carga` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CargasFechadas" DROP CONSTRAINT "CargasFechadas_cargaId_fkey";

-- DropForeignKey
ALTER TABLE "historico_peso_pedidos" DROP CONSTRAINT "historico_peso_pedidos_cargaId_fkey";

-- DropTable
DROP TABLE "carga";

-- CreateTable
CREATE TABLE "Cargas" (
    "id" TEXT NOT NULL,
    "codCar" INTEGER NOT NULL,
    "destino" TEXT NOT NULL,
    "pesoMax" INTEGER NOT NULL,
    "custoMin" INTEGER NOT NULL,
    "situacao" "CargaSituacao" NOT NULL DEFAULT 'ABERTA',
    "previsaoSaida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Cargas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cargas_codCar_key" ON "Cargas"("codCar");

-- AddForeignKey
ALTER TABLE "historico_peso_pedidos" ADD CONSTRAINT "historico_peso_pedidos_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "Cargas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargasFechadas" ADD CONSTRAINT "CargasFechadas_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "Cargas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
