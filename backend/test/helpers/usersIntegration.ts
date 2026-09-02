import express, { Express } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import userRoutes from "../../src/features/users/routes/userRoutes";

export const USERS_FIXTURE_PREFIX = "test-users-87-";

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

export function createUsersTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/users", userRoutes);
  return app;
}

export function createRoleToken(role: Role, id = "users-integration-admin"): string {
  return jwt.sign({ id, role }, JWT_SECRET);
}

export async function cleanupUsersFixtures(): Promise<void> {
  await prisma.user.deleteMany({
    where: { user: { startsWith: USERS_FIXTURE_PREFIX } },
  });
}
