-- CreateTable
CREATE TABLE "CargasFechadas" (
    "id" TEXT NOT NULL,
    "cargaId" TEXT NOT NULL,
    "pedidos" JSONB[],

    CONSTRAINT "CargasFechadas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CargasFechadas" ADD CONSTRAINT "CargasFechadas_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "Cargas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
