-- Foto da placa no histórico de conversão e mudança de produto (#422).
-- Eventos antigos ficam com os quatro campos nulos.

ALTER TABLE "IbcConversionHistory"
  ADD COLUMN IF NOT EXISTS "identificadorAnterior" TEXT,
  ADD COLUMN IF NOT EXISTS "corAnterior" TEXT,
  ADD COLUMN IF NOT EXISTS "identificadorNovo" TEXT,
  ADD COLUMN IF NOT EXISTS "corNova" TEXT;
