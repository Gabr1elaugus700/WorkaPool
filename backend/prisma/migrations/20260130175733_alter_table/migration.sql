/*
  Warnings:

  - Added the required column `idUser` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_codRep_fkey";

-- DropIndex
DROP INDEX "orders_codRep_idx";

-- DropIndex
DROP INDEX "orders_orderNumber_key";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "idUser" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "orders_idUser_idx" ON "orders"("idUser");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
