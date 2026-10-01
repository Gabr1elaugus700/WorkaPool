-- IBC lote cadastro (#117): rastro NF opcional por lote

CREATE TABLE IF NOT EXISTS "IbcLote" (
  "id" TEXT NOT NULL,
  "numeroNf" TEXT,
  "dataLimite" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IbcLote_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "loteId" TEXT;

DO $$ BEGIN
  ALTER TABLE "Ibc" ADD CONSTRAINT "Ibc_loteId_fkey"
    FOREIGN KEY ("loteId") REFERENCES "IbcLote"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Ibc_loteId_idx" ON "Ibc"("loteId");
