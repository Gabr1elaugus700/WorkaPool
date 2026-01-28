-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEGOTIATING', 'LOST', 'WON', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LossReasonCode" AS ENUM ('FREIGHT', 'PRICE', 'MARGIN', 'STOCK', 'OTHER');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL DEFAULT '1',
    "status" "OrderStatus" NOT NULL DEFAULT 'NEGOTIATING',
    "sellerId" TEXT NOT NULL,
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
CREATE INDEX "orders_sellerId_idx" ON "orders"("sellerId");

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
ALTER TABLE "orders" ADD CONSTRAINT "orders_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_products" ADD CONSTRAINT "order_products_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_reasons" ADD CONSTRAINT "loss_reasons_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
