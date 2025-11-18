-- CreateEnum
CREATE TYPE "StatusWorkOrder" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED', 'CANCELED');

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
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "inspection_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department_id" TEXT NOT NULL,
    "responsible_id" TEXT NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemChecklist" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "ItemChecklist_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "ChecklistModelItem" (
    "id" TEXT NOT NULL,
    "checklistModelId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "itemChecklistId" TEXT,

    CONSTRAINT "ChecklistModelItem_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistModelItem_checklistModelId_checklistItemId_key" ON "ChecklistModelItem"("checklistModelId", "checklistItemId");

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
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistModel" ADD CONSTRAINT "ChecklistModel_departurement_id_fkey" FOREIGN KEY ("departurement_id") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistModelItem" ADD CONSTRAINT "ChecklistModelItem_checklistModelId_fkey" FOREIGN KEY ("checklistModelId") REFERENCES "ChecklistModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistModelItem" ADD CONSTRAINT "ChecklistModelItem_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistModelItem" ADD CONSTRAINT "ChecklistModelItem_itemChecklistId_fkey" FOREIGN KEY ("itemChecklistId") REFERENCES "ItemChecklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
