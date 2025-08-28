-- CreateEnum
CREATE TYPE "FuncaoDepartamento" AS ENUM ('GERENTE', 'FUNCIONARIO');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'GERENTE_DPTO';

-- DropForeignKey
ALTER TABLE "OrdemServico" DROP CONSTRAINT "OrdemServico_id_departamento_fkey";

-- DropForeignKey
ALTER TABLE "OrdemServico" DROP CONSTRAINT "OrdemServico_id_solicitante_fkey";

-- AlterTable
ALTER TABLE "OrdemServico" ADD COLUMN     "data_atribuicao" TIMESTAMP(3),
ADD COLUMN     "id_atribuida_por" TEXT,
ADD COLUMN     "id_responsavel" TEXT;

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

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioDepartamento_user_id_departamento_id_key" ON "UsuarioDepartamento"("user_id", "departamento_id");

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_id_solicitante_fkey" FOREIGN KEY ("id_solicitante") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_id_responsavel_fkey" FOREIGN KEY ("id_responsavel") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_id_atribuida_por_fkey" FOREIGN KEY ("id_atribuida_por") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_id_departamento_fkey" FOREIGN KEY ("id_departamento") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioDepartamento" ADD CONSTRAINT "UsuarioDepartamento_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioDepartamento" ADD CONSTRAINT "UsuarioDepartamento_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
