-- IBC (#123/#124): prefixo + sequencial explícitos, com unicidade por par

ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "prefixo" TEXT;
ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "sequencial" INTEGER;

UPDATE "Ibc"
SET
  "prefixo" = substring("identificador" FROM '^([A-Z]+)[0-9]+$'),
  "sequencial" = CAST(substring("identificador" FROM '^[A-Z]+([0-9]+)$') AS INTEGER)
WHERE "prefixo" IS NULL
  AND "identificador" ~ '^[A-Z]+[0-9]+$';

CREATE UNIQUE INDEX IF NOT EXISTS "Ibc_prefixo_sequencial_key" ON "Ibc"("prefixo", "sequencial");
