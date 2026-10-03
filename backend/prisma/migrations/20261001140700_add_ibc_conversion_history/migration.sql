-- IBC conversão/mudança de produto (#123/#124): vínculo origem→destino + histórico estrutural

ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "convertedToContainerId" TEXT;

DO $$ BEGIN
  ALTER TABLE "Ibc" ADD CONSTRAINT "Ibc_convertedToContainerId_fkey"
    FOREIGN KEY ("convertedToContainerId") REFERENCES "Ibc"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Ibc_convertedToContainerId_idx" ON "Ibc"("convertedToContainerId");

CREATE TABLE IF NOT EXISTS "IbcConversionHistory" (
  "id" TEXT NOT NULL,
  "fromContainerId" TEXT NOT NULL,
  "toContainerId" TEXT NOT NULL,
  "changeType" TEXT NOT NULL,
  "observation" TEXT,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IbcConversionHistory_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "IbcConversionHistory" ADD CONSTRAINT "IbcConversionHistory_fromContainerId_fkey"
    FOREIGN KEY ("fromContainerId") REFERENCES "Ibc"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IbcConversionHistory" ADD CONSTRAINT "IbcConversionHistory_toContainerId_fkey"
    FOREIGN KEY ("toContainerId") REFERENCES "Ibc"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "IbcConversionHistory_fromContainerId_idx" ON "IbcConversionHistory"("fromContainerId");
CREATE INDEX IF NOT EXISTS "IbcConversionHistory_toContainerId_idx" ON "IbcConversionHistory"("toContainerId");
