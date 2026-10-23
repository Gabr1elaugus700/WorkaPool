-- AlterTable
ALTER TABLE "CargaPedidoIbc" ADD COLUMN "gruposCodigo" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
