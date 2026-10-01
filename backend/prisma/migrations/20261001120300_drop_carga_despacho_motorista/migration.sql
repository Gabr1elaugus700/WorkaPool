-- DropForeignKey
ALTER TABLE "CargaDespacho" DROP CONSTRAINT IF EXISTS "CargaDespacho_motoristaId_fkey";

-- AlterTable
ALTER TABLE "CargaDespacho" DROP COLUMN IF EXISTS "motoristaId";
