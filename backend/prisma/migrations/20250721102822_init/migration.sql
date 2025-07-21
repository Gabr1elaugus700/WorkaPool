-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'VENDAS', 'LOGISTICA', 'ALMOX');

-- CreateEnum
CREATE TYPE "CargaSituacao" AS ENUM ('ABERTA', 'SOLICITADA', 'FECHADA', 'CANCELADA', 'ENTREGUE');

-- CreateEnum
CREATE TYPE "Meses" AS ENUM ('JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codRep" INTEGER NOT NULL DEFAULT 0,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

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
    "destino" TEXT NOT NULL,
    "pesoMax" INTEGER NOT NULL,
    "custoMin" INTEGER NOT NULL,
    "situacao" "CargaSituacao" NOT NULL DEFAULT 'ABERTA',
    "previsaoSaida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cargas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metas" (
    "id" TEXT NOT NULL,
    "produto" TEXT NOT NULL DEFAULT '',
    "metaProduto" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codRep" INTEGER NOT NULL DEFAULT 0,
    "mesMeta" INTEGER NOT NULL DEFAULT 0,
    "anoMeta" INTEGER NOT NULL DEFAULT 0,
    "precoMedio" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalVendas" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "cod_grp" TEXT DEFAULT '',

    CONSTRAINT "Metas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarioMetas" (
    "id" TEXT NOT NULL,
    "mes" "Meses" NOT NULL DEFAULT 'JANEIRO',
    "ano" INTEGER NOT NULL DEFAULT 2025,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarioMetas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_key" ON "User"("user");

-- CreateIndex
CREATE UNIQUE INDEX "Cargas_codCar_key" ON "Cargas"("codCar");
