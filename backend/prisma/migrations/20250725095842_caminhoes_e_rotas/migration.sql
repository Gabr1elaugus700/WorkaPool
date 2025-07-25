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
    "caminhao_id" INTEGER NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "total_km" INTEGER NOT NULL,
    "dias_viagem" INTEGER NOT NULL,
    "pedagio_ida" DOUBLE PRECISION NOT NULL,
    "pedagio_volta" DOUBLE PRECISION NOT NULL,
    "custo_diesel" DOUBLE PRECISION NOT NULL,
    "custo_arla_32" DOUBLE PRECISION NOT NULL,
    "salario_motorista" DOUBLE PRECISION NOT NULL,
    "refeicao_motorista" DOUBLE PRECISION NOT NULL,
    "ajuda_custo_motorista" DOUBLE PRECISION NOT NULL,
    "chapa_descarga" DOUBLE PRECISION NOT NULL,
    "desgaste_pneus" DOUBLE PRECISION NOT NULL,
    "custo_total_base" DOUBLE PRECISION NOT NULL,
    "peso_base" INTEGER NOT NULL,
    "rentabilidade_padrao" DOUBLE PRECISION NOT NULL,
    "valor_sugerido_base" DOUBLE PRECISION NOT NULL,
    "frete_kg_base" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Rota_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametrosGlobaisViagem" (
    "id" SERIAL NOT NULL,
    "valor_diesel_s10_sem_icms" DOUBLE PRECISION NOT NULL,
    "valor_diesel_s10_com_icms" DOUBLE PRECISION NOT NULL,
    "valor_arla_32" DOUBLE PRECISION NOT NULL,
    "valor_salario_motorista_dia" DOUBLE PRECISION NOT NULL,
    "valor_refeicao_motorista_dia" DOUBLE PRECISION NOT NULL,
    "valor_ajuda_custo_motorista" DOUBLE PRECISION NOT NULL,
    "valor_chapa_descarga" DOUBLE PRECISION NOT NULL,
    "valor_desgaste_pneus" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParametrosGlobaisViagem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Rota_base" ADD CONSTRAINT "Rota_base_caminhao_id_fkey" FOREIGN KEY ("caminhao_id") REFERENCES "Caminhao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
