-- AlterTable
ALTER TABLE "Trucks" ADD COLUMN "plate" TEXT;
ALTER TABLE "Trucks" ADD COLUMN "type" TEXT;
ALTER TABLE "Trucks" ADD COLUMN "axles" INTEGER;
ALTER TABLE "Trucks" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- Backfill plate for existing rows before enforcing NOT NULL + UNIQUE
UPDATE "Trucks" SET "plate" = 'LEGACY-' || "id" WHERE "plate" IS NULL;

ALTER TABLE "Trucks" ALTER COLUMN "plate" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Trucks_plate_key" ON "Trucks"("plate");
