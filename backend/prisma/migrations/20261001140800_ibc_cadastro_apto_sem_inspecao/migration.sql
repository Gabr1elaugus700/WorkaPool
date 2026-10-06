-- AlterTable
ALTER TABLE "Ibc" ADD COLUMN "primeiraInspecaoEm" TIMESTAMP(3);

-- Cadastro deixa de bloquear: IBCs aguardando inspeção passam a Apto + Sem inspeção
UPDATE "Ibc"
SET "aptidao" = 'APTO', "motivoInaptidao" = NULL
WHERE "motivoInaptidao" = 'AGUARDANDO_INSPECAO';
