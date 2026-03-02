-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'VENDAS', 'LOGISTICA', 'ALMOX', 'GERENTE_DPTO');

-- CreateEnum
CREATE TYPE "FuncaoDepartamento" AS ENUM ('GERENTE', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "CargaSituacao" AS ENUM ('ABERTA', 'SOLICITADA', 'FECHADA', 'CANCELADA', 'ENTREGUE');

-- CreateEnum
CREATE TYPE "Meses" AS ENUM ('JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusOrdemServico" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "StatusWorkOrder" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEGOTIATING', 'LOST', 'WON', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LossReasonCode" AS ENUM ('FREIGHT', 'PRICE', 'MARGIN', 'STOCK', 'OTHER');

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
CREATE TABLE "carga" (
    "id" TEXT NOT NULL,
    "codCar" INTEGER NOT NULL,
    "destino" TEXT NOT NULL,
    "pesoMax" INTEGER NOT NULL,
    "custoMin" INTEGER NOT NULL,
    "situacao" "CargaSituacao" NOT NULL DEFAULT 'ABERTA',
    "previsaoSaida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "carga_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Goals" (
    "id" TEXT NOT NULL,
    "product" TEXT NOT NULL DEFAULT '',
    "productGoal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "codRep" INTEGER NOT NULL DEFAULT 0,
    "monthGoal" INTEGER NOT NULL DEFAULT 0,
    "yearGoal" INTEGER NOT NULL DEFAULT 0,
    "averagePrice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "cod_grp" TEXT DEFAULT '',

    CONSTRAINT "Goals_pkey" PRIMARY KEY ("id")
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "custo_combustivel" DOUBLE PRECISION NOT NULL,
    "custo_total" DOUBLE PRECISION NOT NULL,
    "salario_motorista_rota" DOUBLE PRECISION NOT NULL,
    "refeicao_motorista_rota" DOUBLE PRECISION NOT NULL,
    "ajuda_custo_motorista_rota" DOUBLE PRECISION NOT NULL,
    "chapa_descarga_rota" DOUBLE PRECISION NOT NULL,
    "desgaste_pneus_rota" DOUBLE PRECISION NOT NULL,
    "margem_lucro_frete" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "custo_total_rota" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "custo_por_kg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "valor_frete_kg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "custo_operacional" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

-- CreateTable
CREATE TABLE "OrdemServico" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "problema" TEXT NOT NULL DEFAULT '',
    "status" "StatusOrdemServico" NOT NULL DEFAULT 'ABERTA',
    "prioridade" "Prioridade" NOT NULL DEFAULT 'BAIXA',
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_conclusao" TIMESTAMP(3),
    "email_solicitante" TEXT,
    "localizacao" TEXT,
    "id_solicitante" TEXT,
    "id_responsavel" TEXT,
    "id_atribuida_por" TEXT,
    "data_atribuicao" TIMESTAMP(3),
    "id_departamento" TEXT,
    "id_vistoria" TEXT,

    CONSTRAINT "OrdemServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "problem" TEXT NOT NULL DEFAULT '',
    "status" "StatusWorkOrder" NOT NULL DEFAULT 'OPEN',
    "priority" "Prioridade" NOT NULL DEFAULT 'BAIXA',
    "creation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completion_date" TIMESTAMP(3),
    "requester_email" TEXT,
    "location" TEXT,
    "requester_id" TEXT,
    "responsible_id" TEXT,
    "assigned_by_id" TEXT,
    "assignment_date" TIMESTAMP(3),
    "department_id" TEXT,
    "inspection_id" TEXT,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderImages" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderImages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OsImagens" (
    "id" TEXT NOT NULL,
    "ordem_id" TEXT NOT NULL,
    "imagem_url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OsImagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "inspection_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department_id" TEXT NOT NULL,
    "responsible_id" TEXT NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vistoria" (
    "id" TEXT NOT NULL,
    "data_vistoria" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departamento_id" TEXT NOT NULL,
    "responsavel_id" TEXT NOT NULL,

    CONSTRAINT "Vistoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemChecklist" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "ItemChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistModel" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departurement_id" TEXT,

    CONSTRAINT "ChecklistModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistModelo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departamento_id" TEXT,

    CONSTRAINT "ChecklistModelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistModelItem" (
    "id" TEXT NOT NULL,
    "checklistModelId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "itemChecklistId" TEXT,

    CONSTRAINT "ChecklistModelItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistModeloItem" (
    "id" TEXT NOT NULL,
    "checklistModeloId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,

    CONSTRAINT "ChecklistModeloItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistInspection" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "checklistModeloId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "ordemServicoId" TEXT,
    "workOrderId" TEXT,
    "itemChecklistId" TEXT,
    "checklistModelId" TEXT,

    CONSTRAINT "ChecklistInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistVistoria" (
    "id" TEXT NOT NULL,
    "vistoria_id" TEXT NOT NULL,
    "checklistModeloId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "ordemServicoId" TEXT,

    CONSTRAINT "ChecklistVistoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recebe_os" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioDepartamento" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "departamento_id" TEXT NOT NULL,
    "funcao" "FuncaoDepartamento" NOT NULL DEFAULT 'FUNCIONARIO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioDepartamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEGOTIATING',
    "idUser" TEXT NOT NULL,
    "codRep" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_products" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "codprod" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loss_reasons" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "code" "LossReasonCode" NOT NULL,
    "description" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedBy" TEXT NOT NULL,

    CONSTRAINT "loss_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_key" ON "User"("user");

-- CreateIndex
CREATE UNIQUE INDEX "carga_codCar_key" ON "carga"("codCar");

-- CreateIndex
CREATE UNIQUE INDEX "CaminhaoRota_rota_base_id_caminhao_id_key" ON "CaminhaoRota"("rota_base_id", "caminhao_id");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistModelItem_checklistModelId_checklistItemId_key" ON "ChecklistModelItem"("checklistModelId", "checklistItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistModeloItem_checklistModeloId_checklistItemId_key" ON "ChecklistModeloItem"("checklistModeloId", "checklistItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_name_key" ON "Departamento"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioDepartamento_user_id_departamento_id_key" ON "UsuarioDepartamento"("user_id", "departamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_idUser_idx" ON "orders"("idUser");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "order_products_orderId_idx" ON "order_products"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "loss_reasons_orderId_key" ON "loss_reasons"("orderId");

-- CreateIndex
CREATE INDEX "loss_reasons_code_idx" ON "loss_reasons"("code");

-- AddForeignKey
ALTER TABLE "CargasFechadas" ADD CONSTRAINT "CargasFechadas_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "carga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaminhaoRota" ADD CONSTRAINT "CaminhaoRota_rota_base_id_fkey" FOREIGN KEY ("rota_base_id") REFERENCES "Rota_base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaminhaoRota" ADD CONSTRAINT "CaminhaoRota_caminhao_id_fkey" FOREIGN KEY ("caminhao_id") REFERENCES "Caminhao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoRota" ADD CONSTRAINT "SolicitacaoRota_solicitante_user_fkey" FOREIGN KEY ("solicitante_user") REFERENCES "User"("user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_id_solicitante_fkey" FOREIGN KEY ("id_solicitante") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_id_responsavel_fkey" FOREIGN KEY ("id_responsavel") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_id_atribuida_por_fkey" FOREIGN KEY ("id_atribuida_por") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_id_departamento_fkey" FOREIGN KEY ("id_departamento") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderImages" ADD CONSTRAINT "WorkOrderImages_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OsImagens" ADD CONSTRAINT "OsImagens_ordem_id_fkey" FOREIGN KEY ("ordem_id") REFERENCES "OrdemServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vistoria" ADD CONSTRAINT "Vistoria_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vistoria" ADD CONSTRAINT "Vistoria_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistModel" ADD CONSTRAINT "ChecklistModel_departurement_id_fkey" FOREIGN KEY ("departurement_id") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistModelo" ADD CONSTRAINT "ChecklistModelo_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistModelItem" ADD CONSTRAINT "ChecklistModelItem_checklistModelId_fkey" FOREIGN KEY ("checklistModelId") REFERENCES "ChecklistModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistModelItem" ADD CONSTRAINT "ChecklistModelItem_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistModelItem" ADD CONSTRAINT "ChecklistModelItem_itemChecklistId_fkey" FOREIGN KEY ("itemChecklistId") REFERENCES "ItemChecklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistModeloItem" ADD CONSTRAINT "ChecklistModeloItem_checklistModeloId_fkey" FOREIGN KEY ("checklistModeloId") REFERENCES "ChecklistModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistModeloItem" ADD CONSTRAINT "ChecklistModeloItem_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInspection" ADD CONSTRAINT "ChecklistInspection_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInspection" ADD CONSTRAINT "ChecklistInspection_checklistModeloId_fkey" FOREIGN KEY ("checklistModeloId") REFERENCES "ChecklistModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInspection" ADD CONSTRAINT "ChecklistInspection_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInspection" ADD CONSTRAINT "ChecklistInspection_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInspection" ADD CONSTRAINT "ChecklistInspection_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInspection" ADD CONSTRAINT "ChecklistInspection_itemChecklistId_fkey" FOREIGN KEY ("itemChecklistId") REFERENCES "ItemChecklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInspection" ADD CONSTRAINT "ChecklistInspection_checklistModelId_fkey" FOREIGN KEY ("checklistModelId") REFERENCES "ChecklistModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistVistoria" ADD CONSTRAINT "ChecklistVistoria_vistoria_id_fkey" FOREIGN KEY ("vistoria_id") REFERENCES "Vistoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistVistoria" ADD CONSTRAINT "ChecklistVistoria_checklistModeloId_fkey" FOREIGN KEY ("checklistModeloId") REFERENCES "ChecklistModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistVistoria" ADD CONSTRAINT "ChecklistVistoria_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistVistoria" ADD CONSTRAINT "ChecklistVistoria_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioDepartamento" ADD CONSTRAINT "UsuarioDepartamento_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioDepartamento" ADD CONSTRAINT "UsuarioDepartamento_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_products" ADD CONSTRAINT "order_products_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_reasons" ADD CONSTRAINT "loss_reasons_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
