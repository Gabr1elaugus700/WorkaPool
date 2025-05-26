-- CreateEnum
CREATE TYPE "CargaSituacao" AS ENUM ('ABERTA', 'SOLICITADA', 'FECHADA', 'CANCELADA', 'ENTREGUE');

-- CreateTable
CREATE TABLE "Trucks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codRep" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Trucks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cargas" (
    "id" TEXT NOT NULL,
    "codCar" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "pesoMax" INTEGER NOT NULL,
    "custoMin" INTEGER NOT NULL,
    "situacao" "CargaSituacao" NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cargas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cargas_codCar_key" ON "Cargas"("codCar");
