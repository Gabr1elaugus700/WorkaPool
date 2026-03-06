-- CreateTable
CREATE TABLE "historico_peso_pedidos" (
    "id" TEXT NOT NULL,
    "cargaId" TEXT NOT NULL,
    "numPed" INTEGER NOT NULL,
    "peso" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_peso_pedidos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "historico_peso_pedidos" ADD CONSTRAINT "historico_peso_pedidos_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "carga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
