import { PrismaClient } from "@prisma/client";

export async function ensureTrucksFleetSchema(prisma: PrismaClient): Promise<void> {
  const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Trucks'
      AND column_name = 'plate'
  `;

  if (columns.length > 0) {
    return;
  }

  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Trucks" ADD COLUMN IF NOT EXISTS "plate" TEXT`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Trucks" ADD COLUMN IF NOT EXISTS "type" TEXT`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Trucks" ADD COLUMN IF NOT EXISTS "axles" INTEGER`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Trucks" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true`,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE "Trucks" SET "plate" = 'LEGACY-' || "id" WHERE "plate" IS NULL`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Trucks" ALTER COLUMN "plate" SET NOT NULL`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Trucks_plate_key" ON "Trucks"("plate")`,
  );
}
