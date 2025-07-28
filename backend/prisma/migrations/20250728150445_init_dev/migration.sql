-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'VENDAS', 'LOGISTICA', 'ALMOX');

-- CreateEnum
CREATE TYPE "CargaSituacao" AS ENUM ('ABERTA', 'SOLICITADA', 'FECHADA', 'CANCELADA', 'ENTREGUE');

-- CreateEnum
CREATE TYPE "Meses" AS ENUM ('JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO');

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

-- CreateTable
CREATE TABLE "CargasFechadas" (
    "id" TEXT NOT NULL,
    "cargaId" TEXT NOT NULL,
    "pedidos" JSONB[],

    CONSTRAINT "CargasFechadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caminhao" (
    "id" SERIAL NOT NULL,
    "modelo" TEXT NOT NULL,
    "eixos" INTEGER NOT NULL,
    "eixos_carregado" INTEGER NOT NULL,
    "eixos_vazio" INTEGER NOT NULL,
    "pneus" INTEGER NOT NULL,
    "capacidade_kg" INTEGER NOT NULL,
    "consumo_medio_km_l" DOUBLE PRECISION NOT NULL,
    "tipo" TEXT,

    CONSTRAINT "Caminhao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rota_base" (
    "id" SERIAL NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "total_km" INTEGER NOT NULL,
    "dias_viagem" INTEGER NOT NULL,

    CONSTRAINT "Rota_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaminhaoRota" (
    "id" SERIAL NOT NULL,
    "rota_base_id" INTEGER NOT NULL,
    "caminhao_id" INTEGER NOT NULL,
    "pedagio_ida" DOUBLE PRECISION NOT NULL,
    "pedagio_volta" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CaminhaoRota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametrosGlobaisViagem" (
    "id" SERIAL NOT NULL,
    "valor_diesel_s10_sem_icms" DOUBLE PRECISION NOT NULL,
    "valor_diesel_s10_com_icms" DOUBLE PRECISION NOT NULL,
    "valor_salario_motorista_dia" DOUBLE PRECISION NOT NULL,
    "valor_refeicao_motorista_dia" DOUBLE PRECISION NOT NULL,
    "valor_ajuda_custo_motorista" DOUBLE PRECISION NOT NULL,
    "valor_chapa_descarga" DOUBLE PRECISION NOT NULL,
    "valor_desgaste_pneus" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "margem_lucro_frete" DOUBLE PRECISION NOT NULL DEFAULT 0.35,

    CONSTRAINT "ParametrosGlobaisViagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitacaoRota" (
    "id" SERIAL NOT NULL,
    "data_solicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "peso" INTEGER NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDENTE',
    "solicitante_user" TEXT NOT NULL,

    CONSTRAINT "SolicitacaoRota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_key" ON "User"("user");

-- CreateIndex
CREATE UNIQUE INDEX "Cargas_codCar_key" ON "Cargas"("codCar");

-- AddForeignKey
ALTER TABLE "CargasFechadas" ADD CONSTRAINT "CargasFechadas_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "Cargas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaminhaoRota" ADD CONSTRAINT "CaminhaoRota_rota_base_id_fkey" FOREIGN KEY ("rota_base_id") REFERENCES "Rota_base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaminhaoRota" ADD CONSTRAINT "CaminhaoRota_caminhao_id_fkey" FOREIGN KEY ("caminhao_id") REFERENCES "Caminhao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoRota" ADD CONSTRAINT "SolicitacaoRota_solicitante_user_fkey" FOREIGN KEY ("solicitante_user") REFERENCES "User"("user") ON DELETE RESTRICT ON UPDATE CASCADE;
