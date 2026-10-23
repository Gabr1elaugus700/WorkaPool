-- IbcProduto vira configuração de grupo. A tabela está vazia: não há dado para migrar.
ALTER TABLE "IbcProduto" DROP COLUMN "nome";
ALTER TABLE "IbcProduto" DROP COLUMN "abreviacao";

ALTER TABLE "IbcProduto" ADD COLUMN "grupo_codigo" VARCHAR(10);
ALTER TABLE "IbcProduto" ADD COLUMN "sigla" VARCHAR(2);
ALTER TABLE "IbcProduto" ADD COLUMN "cor_hex" VARCHAR(7) NOT NULL;
ALTER TABLE "IbcProduto" ADD COLUMN "universal" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "IbcProduto_grupoCodigo_key" ON "IbcProduto"("grupo_codigo");
CREATE UNIQUE INDEX "IbcProduto_sigla_key" ON "IbcProduto"("sigla");
CREATE UNIQUE INDEX "IbcProduto_corHex_key" ON "IbcProduto"("cor_hex");
CREATE UNIQUE INDEX "IbcProduto_universal_key" ON "IbcProduto"("universal") WHERE "universal" = true;

ALTER TABLE "IbcProduto" ADD CONSTRAINT "IbcProduto_forma_check" CHECK (
  ("universal" = true AND "grupo_codigo" IS NULL AND "sigla" IS NULL)
  OR ("universal" = false AND "grupo_codigo" IS NOT NULL AND "sigla" IS NOT NULL)
);
