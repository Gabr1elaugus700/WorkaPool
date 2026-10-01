import express, { Express } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import trucksRoutes from "../../src/features/trucks/http/routes/TrucksRoute";
import cargoRoutes from "../../src/features/cargo/http/routes/CargoRoute";
import authRoutes from "../../src/features/users/routes/authRoutes";

export const FLEET_FIXTURE_PREFIX = "test-fleet-84-";
export const FLEET_PLATE_PREFIX = "TF84";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export const prisma = new PrismaClient();

export function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(
      `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
    );
  }
}

export function createFleetTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/trucks", trucksRoutes);
  app.use("/api/cargo", cargoRoutes);
  app.use("/api/auth", authRoutes);
  return app;
}

export function createRoleToken(role: Role, id = "fleet-integration-user"): string {
  return jwt.sign({ id, role }, JWT_SECRET);
}

export async function cleanupFleetFixtures(): Promise<void> {
  await prisma.trucks.deleteMany({
    where: { plate: { startsWith: FLEET_PLATE_PREFIX } },
  });
  await prisma.user.deleteMany({
    where: { user: { startsWith: FLEET_FIXTURE_PREFIX } },
  });
}
