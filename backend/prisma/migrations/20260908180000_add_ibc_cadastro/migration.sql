-- AlterEnum / CreateEnum for IBC cadastro (#32 / #91)

DO $$ BEGIN
  CREATE TYPE "IbcTipoCadastro" AS ENUM ('NOVO', 'TROCA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "IbcAquisicao" AS ENUM ('COMPRA', 'TROCA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "IbcMotivoInaptidao" AS ENUM ('AGUARDANDO_INSPECAO', 'DATA_LIMITE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "tipoCadastro" "IbcTipoCadastro" NOT NULL DEFAULT 'NOVO';
ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "aquisicao" "IbcAquisicao" NOT NULL DEFAULT 'COMPRA';
ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "motivoInaptidao" "IbcMotivoInaptidao";
ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "dataLimite" TIMESTAMP(3);
ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "baixadoEm" TIMESTAMP(3);
