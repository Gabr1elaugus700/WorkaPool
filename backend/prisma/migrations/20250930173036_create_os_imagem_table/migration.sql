-- AlterTable
ALTER TABLE "OrdemServico" ADD COLUMN     "localizacao" TEXT;

-- CreateTable
CREATE TABLE "OsImagens" (
    "id" TEXT NOT NULL,
    "ordem_id" TEXT NOT NULL,
    "imagem_url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OsImagens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OsImagens" ADD CONSTRAINT "OsImagens_ordem_id_fkey" FOREIGN KEY ("ordem_id") REFERENCES "OrdemServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
